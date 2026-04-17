import { getGeminiClient, extractTextFromResponse } from "@/lib/gemini";

const MODERATION_MODEL = "gemini-2.5-flash";

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
  const client = getGeminiClient();
  if (!client) return { safe: true }; // no key = skip moderation

  const b64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!b64Match) return { safe: true };

  try {
    const response = await client.models.generateContent({
      model: MODERATION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: b64Match[1], data: b64Match[2] } },
            { text: MODERATION_PROMPT },
          ],
        },
      ],
    });

    const text = extractTextFromResponse(response as never) ?? "";

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
