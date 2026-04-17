import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { put } from "@vercel/blob";
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
import { getAnonFingerprint } from "@/lib/fingerprint";
import { watermarkToBuffer, compressToBuffer, dataUrlToBuffer } from "@/lib/watermark";
import { getDb } from "@/lib/db";
import { anonDailyUsage } from "@/lib/db/schema";
import { moderateImage } from "@/lib/moderation";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const ANON_FREE_LIMIT = 1; // free uses per fingerprint per day

async function checkAnonFree(fingerprint: string, today: string): Promise<boolean> {
  const db = getDb();
  if (!db) return true; // no DB = allow (dev fallback)
  const [row] = await db
    .select({ count: anonDailyUsage.count })
    .from(anonDailyUsage)
    .where(and(eq(anonDailyUsage.fingerprint, fingerprint), eq(anonDailyUsage.day, today)));
  return !row || row.count < ANON_FREE_LIMIT;
}

async function recordAnonUsage(fingerprint: string, today: string) {
  const db = getDb();
  if (!db) return;
  await db
    .insert(anonDailyUsage)
    .values({ fingerprint, day: today, count: 1 })
    .onConflictDoUpdate({
      target: [anonDailyUsage.fingerprint, anonDailyUsage.day],
      set: { count: sql`${anonDailyUsage.count} + 1` },
    });
}

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
  }

  /* ── Auth & credits check ── */
  const authSession = await auth();
  let addWatermark = true;
  let consumedCredit = false;

  const fingerprint = await getAnonFingerprint();
  const td = new Date().toISOString().slice(0, 10);
  const freeAvailable = await checkAnonFree(fingerprint, td);

  if (authSession?.user?.id) {
    // Logged-in: try paid credits first (no watermark)
    const creditResult = await consumeCredit(authSession.user.id);
    if (creditResult.used) {
      addWatermark = false;
      consumedCredit = true;
    } else if (freeAvailable) {
      addWatermark = true;
    } else {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  } else {
    // Anonymous: free daily only (fingerprint-based)
    if (freeAvailable) {
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

      // Content moderation on user photo
      const modResult = await moderateImage(dataUrl);
      if (!modResult.safe) {
        return NextResponse.json(
          { ok: false, error: "content_rejected", reason: modResult.reason },
          { status: 451 },
        );
      }
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
        max_tokens: 512,
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

    // Convert data URL to buffer, apply watermark or compress
    let imgBuffer: Buffer;
    if (addWatermark) {
      try {
        imgBuffer = await watermarkToBuffer(image);
      } catch (e) {
        console.error("watermark error", e);
        imgBuffer = dataUrlToBuffer(image);
      }
    } else {
      try {
        imgBuffer = await compressToBuffer(image);
      } catch (e) {
        console.error("compress error", e);
        imgBuffer = dataUrlToBuffer(image);
      }
    }

    // Record anonymous free usage in DB (skip if paid credit was used)
    if (!consumedCredit) {
      await recordAnonUsage(fingerprint, td);
    }

    // Upload to Vercel Blob and return URL — avoids Vercel payload limit entirely
    const filename = `share/${td}/${Date.now()}.jpg`;
    const blob = await put(filename, imgBuffer, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    return NextResponse.json({ ok: true, url: blob.url, watermark: addWatermark });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
