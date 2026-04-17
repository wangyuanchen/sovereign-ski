import { headers } from "next/headers";
import crypto from "node:crypto";

/**
 * Server-side anonymous fingerprint: SHA-256(IP + User-Agent).
 * Not perfect but enough to stop casual abuse (微信 reopens, incognito etc).
 */
export async function getAnonFingerprint(): Promise<string> {
  const h = await headers();

  // IP: check common proxy headers first
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown";

  const ua = h.get("user-agent") || "unknown";

  // Add a server-side secret salt to prevent clients from predicting/spoofing
  const salt = process.env.FINGERPRINT_SALT || "ski-svgn-default-salt";

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}:${ua}`)
    .digest("hex");
}
