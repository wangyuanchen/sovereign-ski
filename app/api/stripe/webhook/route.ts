import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { users, creditPurchases } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const credits = Number(session.metadata?.credits ?? 0);

    if (userId && credits > 0) {
      const db = getDb();
      if (db) {
        await db.insert(creditPurchases).values({
          userId,
          amount: credits,
          stripeSessionId: session.id,
        });
        await db
          .update(users)
          .set({ credits: sql`${users.credits} + ${credits}` })
          .where(eq(users.id, userId));
      }
    }
  }

  return NextResponse.json({ received: true });
}
