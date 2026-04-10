import { NextResponse } from "next/server";
import { recordBodySchema } from "@/lib/schema";
import { skiRecords } from "@/lib/db/schema";
import { getDb } from "@/lib/db/index";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = recordBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const v = parsed.data;
  const id = crypto.randomUUID();

  try {
    await db.insert(skiRecords).values({
      id,
      resort: v.resort,
      date: v.date,
      duration: v.duration,
      distanceKm: String(v.distance_km),
      maxSpeedKmh: String(v.max_speed_kmh),
      verticalM: v.vertical_m,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
