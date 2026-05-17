import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-04-22.dahlia",
});

export const stripePriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
if (!stripePriceId) {
  throw new Error("Missing STRIPE_PREMIUM_PRICE_ID in environment");
}

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
