import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type ConsumeResult = { used: boolean };

/**
 * Try to deduct 1 paid credit. Returns { used: true } if deducted.
 * Free daily tracking is handled via cookie in the route.
 */
export async function consumeCredit(userId: string): Promise<ConsumeResult> {
  const db = getDb();
  if (!db) return { used: false };

  const [row] = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, userId));

  if (!row || row.credits <= 0) return { used: false };

  await db
    .update(users)
    .set({ credits: sql`${users.credits} - 1` })
    .where(eq(users.id, userId));
  return { used: true };
}
