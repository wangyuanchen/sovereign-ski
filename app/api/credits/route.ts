import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** GET /api/credits — credit count + free daily availability */
export async function GET() {
  const jar = await cookies();
  const freeUsed = jar.get("anon_free_used")?.value;
  const freeToday = freeUsed !== new Date().toISOString().slice(0, 10);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ credits: 0, freeToday, loggedIn: false });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ credits: 0, freeToday, loggedIn: true });

  const [row] = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    credits: row?.credits ?? 0,
    freeToday,
    loggedIn: true,
  });
}
