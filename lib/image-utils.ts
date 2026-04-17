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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mimeType: string,
): Promise<{ dataUrl: string; mime: string }> {
  // Always resize + compress to JPEG to keep payloads small
  const outputBuf = await sharp(buf)
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  const mime = "image/jpeg";

  const b64 = outputBuf.toString("base64");
  return { dataUrl: `data:${mime};base64,${b64}`, mime };
}
