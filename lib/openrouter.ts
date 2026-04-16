import OpenAI from "openai";

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export function getOpenRouterClient(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ski.svgn.org";

  return new OpenAI({
    baseURL: OPENROUTER_BASE,
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": siteUrl,
      "X-Title": "sovereign-ski",
    },
  });
}

export function openRouterHeaders(): Record<string, string> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ski.svgn.org";
  return {
    "HTTP-Referer": siteUrl,
    "X-Title": "sovereign-ski",
  };
}

/** Best-effort: OpenRouter image models return base64 data URLs in varying shapes. */
export function extractImageDataUrlFromCompletion(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const root = body as {
    choices?: Array<{
      message?: {
        content?: unknown;
        images?: Array<{ image_url?: { url?: string }; url?: string }>;
      };
    }>;
  };
  const msg = root.choices?.[0]?.message;
  if (!msg) return null;

  const imgs = msg.images;
  if (Array.isArray(imgs)) {
    for (const im of imgs) {
      const u = im?.image_url?.url ?? im?.url;
      if (typeof u === "string" && (u.startsWith("data:image/") || u.startsWith("http"))) return u;
    }
  }

  const content = msg.content;
  if (typeof content === "string" && content.startsWith("data:image/")) return content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const p = part as { type?: string; image_url?: { url?: string } };
      if (p.type === "image_url" && typeof p.image_url?.url === "string") return p.image_url.url;
    }
  }

  return null;
}
