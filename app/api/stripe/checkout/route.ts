import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, CREDIT_PACKAGES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packageId } = await req.json();
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg || !pkg.priceId) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ski.svgn.org";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    customer_email: session.user.email!,
    metadata: {
      userId: session.user.id,
      credits: String(pkg.credits),
    },
    success_url: `${appUrl}?payment=success`,
    cancel_url: `${appUrl}?payment=cancel`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
