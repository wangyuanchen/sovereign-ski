import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export const runtime = "nodejs";

/** Delete blobs older than 7 days. Triggered by Vercel Cron. */
export async function GET(req: Request) {
  // Simple auth: check cron secret or allow only from Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - SEVEN_DAYS);
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: "share/", cursor, limit: 100 });
    const old = result.blobs.filter((b) => new Date(b.uploadedAt) < cutoff);

    if (old.length > 0) {
      await Promise.all(old.map((b) => del(b.url)));
      deleted += old.length;
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return NextResponse.json({ ok: true, deleted });
}
