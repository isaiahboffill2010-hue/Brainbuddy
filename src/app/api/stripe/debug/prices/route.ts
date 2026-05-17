import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const res = await stripe.prices.list({ limit: 20 });
    const prices = res.data.map((p) => ({ id: p.id, active: p.active, currency: (p as any).currency ?? null }));
    return NextResponse.json({ prices });
  } catch (err: any) {
    console.error("/api/stripe/debug/prices error:", err?.message ?? err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
