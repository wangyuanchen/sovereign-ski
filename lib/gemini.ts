import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new GoogleGenAI({ apiKey: key });
  return _client;
}

/** Extract all base64 image data URLs from a Gemini generateContent response */
export function extractImagesFromResponse(
  response: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> } }> },
): string[] {
  const images: string[] = [];
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/")) {
      images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
    }
  }
  return images;
}

/** Extract first text from response */
export function extractTextFromResponse(
  response: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> },
): string | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text) return part.text;
  }
  return null;
}
