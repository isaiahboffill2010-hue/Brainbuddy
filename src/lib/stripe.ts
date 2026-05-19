import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  });
  return _stripe;
}

// Lazy proxy so importing this module never throws at build/eval time.
// The real Stripe client is only instantiated on first property access.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    return Reflect.get(instance, prop, instance);
  },
});

export const stripePriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
