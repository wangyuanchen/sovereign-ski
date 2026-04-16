import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OPENROUTER_BASE,
  extractImageDataUrlFromCompletion,
  openRouterHeaders,
} from "@/lib/openrouter";
import { ACCEPTED_IMAGE_TYPES, toModelDataUrl } from "@/lib/image-utils";
import { generateShareBodySchema } from "@/lib/schema";
import { buildShareImagePrompt } from "@/lib/share-image-prompt";
import { auth } from "@/lib/auth";
import { consumeCredit } from "@/lib/credits";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const ANON_COOKIE = "anon_free_used";

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
  }

  /* ── Auth & credits check ── */
  const authSession = await auth();
  let addWatermark = true;
  let setCookie: { name: string; value: string } | null = null;

  const jar = await cookies();
  const freeUsed = jar.get(ANON_COOKIE)?.value;
  const td = new Date().toISOString().slice(0, 10);
  const freeAvailable = freeUsed !== td;

  if (authSession?.user?.id) {
    // Logged-in: try paid credits first (no watermark)
    const creditResult = await consumeCredit(authSession.user.id);
    if (creditResult.used) {
      addWatermark = false;
    } else if (freeAvailable) {
      // Fall back to free daily (watermark)
      setCookie = { name: ANON_COOKIE, value: td };
      addWatermark = true;
    } else {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  } else {
    // Anonymous: free daily only
    if (freeAvailable) {
      setCookie = { name: ANON_COOKIE, value: td };
      addWatermark = true;
    } else {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  }

  /* ── Parse body: support both JSON and FormData ── */
  let sessionData: unknown;
  let userPhotoDataUrl: string | null = null;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const jsonStr = fd.get("data");
    if (typeof jsonStr !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }
    try {
      sessionData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const photo = fd.get("userPhoto");
    if (photo instanceof File && photo.size > 0) {
      if (!ACCEPTED_IMAGE_TYPES.has(photo.type)) {
        return NextResponse.json({ ok: false, error: "invalid_photo_type" }, { status: 400 });
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ ok: false, error: "photo_too_large" }, { status: 400 });
      }
      const buf = Buffer.from(await photo.arrayBuffer());
      const { dataUrl } = await toModelDataUrl(buf, photo.type);
      userPhotoDataUrl = dataUrl;
    }
  } else {
    try {
      sessionData = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }
  }

  const parsed = generateShareBodySchema.safeParse(sessionData);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const { locale: loc, ...sessionPayload } = parsed.data;
  const locale = loc === "en" ? "en" : "zh";
  const promptText = buildShareImagePrompt(sessionPayload, locale, !!userPhotoDataUrl);

  const model =
    process.env.OPENROUTER_IMAGE_MODEL?.trim() || "google/gemini-2.5-flash-image";

  /* ── Build message content (text-only or multimodal) ── */
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: promptText },
  ];
  if (userPhotoDataUrl) {
    content.push({ type: "image_url", image_url: { url: userPhotoDataUrl } });
  }

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...openRouterHeaders(),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("generate-share upstream", res.status, t.slice(0, 1500));
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }

    const json = (await res.json()) as unknown;
    const image = extractImageDataUrlFromCompletion(json);
    if (!image) {
      console.error("generate-share no_image", JSON.stringify(json).slice(0, 2500));
      return NextResponse.json({ ok: false, error: "no_image" }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true, image, watermark: addWatermark });
    if (setCookie) {
      response.cookies.set(setCookie.name, setCookie.value, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 86400,
        path: "/",
      });
    }
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
