import OpenAI from "openai";

export const LLM_BASE =
  process.env.LLM_API_BASE?.replace(/\/+$/, "") || "https://www.dmxapi.com/v1";

export function getLLMClient(): OpenAI | null {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;

  return new OpenAI({
    baseURL: LLM_BASE,
    apiKey: key,
  });
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
