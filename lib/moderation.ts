import {
  OPENROUTER_BASE,
  openRouterHeaders,
} from "@/lib/openrouter";

const MODERATION_MODEL = "google/gemini-2.5-flash";

const MODERATION_PROMPT = `You are a content safety classifier. Analyze this image and respond with ONLY a JSON object:
{"safe": true} or {"safe": false, "reason": "brief reason"}

Reject (safe=false) if the image contains:
- Nudity, pornography, or sexually explicit content
- Political leaders, political propaganda, or politically sensitive content
- Violence, gore, or graphic injury
- Hate symbols, extremism
- Content involving minors in inappropriate contexts
- Drug use or illegal activities

Accept (safe=true) if the image is:
- Ski/snowboard screenshots, sport stats, mountain scenery
- Normal selfies or group photos in appropriate clothing
- General outdoor/travel/lifestyle photos
- Charts, data, app screenshots

Be lenient with normal user photos (winter sports gear, casual clothing, etc). Only reject clearly inappropriate content.`;

export type ModerationResult = { safe: boolean; reason?: string };

/**
 * Check an image data URL for content policy violations using a vision model.
 * Returns { safe: true } for acceptable images.
 * Fails open (returns safe) on errors to avoid blocking legitimate users.
 */
export async function moderateImage(dataUrl: string): Promise<ModerationResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { safe: true }; // no key = skip moderation

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...openRouterHeaders(),
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: MODERATION_PROMPT },
            ],
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      console.error("moderation upstream error", res.status);
      return { safe: true }; // fail open
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse JSON from response (may be wrapped in ```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { safe: true }; // can't parse = fail open

    const result = JSON.parse(jsonMatch[0]) as ModerationResult;
    return { safe: result.safe !== false, reason: result.reason };
  } catch (e) {
    console.error("moderation error", e);
    return { safe: true }; // fail open
  }
}
