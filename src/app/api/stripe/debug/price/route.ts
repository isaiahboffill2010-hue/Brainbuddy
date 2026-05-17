import { NextResponse } from "next/server";
import { stripe, stripePriceId } from "@/lib/stripe";

export async function GET() {
  try {
    if (!stripePriceId) {
      return NextResponse.json({ error: "Missing STRIPE_PREMIUM_PRICE_ID" }, { status: 500 });
    }

    const price = await stripe.prices.retrieve(stripePriceId as string);

    // Return a minimal, non-sensitive summary so we can verify the price exists
    return NextResponse.json({
      id: price.id,
      active: price.active,
      currency: (price as any).currency ?? null,
      unit_amount: (price as any).unit_amount ?? (price as any).unit_amount_decimal ?? null,
      product: typeof price.product === "string" ? price.product : price.product?.id ?? null,
    });
  } catch (err: any) {
    console.error("/api/stripe/debug/price error:", err?.message ?? err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
