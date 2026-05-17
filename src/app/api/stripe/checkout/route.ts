import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { stripe, stripePriceId } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripePriceId) {
      console.error("Missing STRIPE_PREMIUM_PRICE_ID in environment");

      return NextResponse.json(
        {
          error: "Server misconfiguration: missing price id",
          details: "Missing STRIPE_PREMIUM_PRICE_ID in environment",
        },
        { status: 500 }
      );
    }

    const { data: profileData, error: profileError } = await service
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Supabase profile lookup error:", profileError);
    }

    let customerId = profileData?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      const { error: updateError } = await service
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Supabase stripe_customer_id update error:", updateError);
      }
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: stripePriceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.confirmation_secret"],
      metadata: {
        user_id: user.id,
      },
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | string | null;

    const clientSecret =
      typeof latestInvoice === "object" &&
      latestInvoice !== null &&
      "confirmation_secret" in latestInvoice &&
      latestInvoice.confirmation_secret &&
      typeof latestInvoice.confirmation_secret === "object"
        ? latestInvoice.confirmation_secret.client_secret
        : null;

    if (!clientSecret) {
      console.error("Unable to get Stripe confirmation secret for subscription", {
        subscriptionId: subscription.id,
        latestInvoice,
      });

      return NextResponse.json(
        {
          error: "Unable to initialize payment.",
          details: "Missing invoice confirmation_secret.client_secret from Stripe.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId,
    });
  } catch (err: any) {
    console.error("/api/stripe/checkout error:", err);
    if (err?.raw?.message) {
      console.error("Stripe raw message:", err.raw.message);
    }

    return NextResponse.json(
      {
        error: "Unable to initialize payment.",
        details: err?.raw?.message || err?.message || String(err),
      },
      { status: 500 }
    );
  }
}