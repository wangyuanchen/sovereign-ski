import sharp from "sharp";

/**
 * MIME types the app accepts for image uploads.
 * HEIC/HEIF are accepted and converted to JPEG server-side.
 */
export const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** For HTML `accept` attributes (front-end). */
export const ACCEPT_STRING =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

/**
 * Convert an uploaded File buffer to a data-URL that vision / image models can
 * consume.  HEIC/HEIF is transcoded to JPEG via sharp; other formats pass
 * through as-is.
 */
export async function toModelDataUrl(
  buf: Buffer,
  mimeType: string,
): Promise<{ dataUrl: string; mime: string }> {
  const isHeic =
    mimeType === "image/heic" || mimeType === "image/heif";

  let outputBuf: Buffer;
  let outputMime: string;

  if (isHeic) {
    outputBuf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    outputMime = "image/jpeg";
  } else {
    outputBuf = buf;
    outputMime = mimeType;
  }

  const b64 = outputBuf.toString("base64");
  return { dataUrl: `data:${outputMime};base64,${b64}`, mime: outputMime };
}
