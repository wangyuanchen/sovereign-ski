import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/** Credit packages available for purchase */
export const CREDIT_PACKAGES = [
  { id: "credits_5", credits: 5, priceId: process.env.STRIPE_PRICE_5 ?? "" },
  { id: "credits_20", credits: 20, priceId: process.env.STRIPE_PRICE_20 ?? "" },
] as const;
