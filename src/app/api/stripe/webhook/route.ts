import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, stripeWebhookSecret } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  let event;
  if (!stripeWebhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook secret" }, { status: 500 });
  }
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const service = createServiceClient();

  async function updateProfileByCustomer(customerId: string, updates: Record<string, unknown>) {
    await service.from("profiles").update(updates).eq("stripe_customer_id", customerId);
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (customerId && subscriptionId) {
          await updateProfileByCustomer(customerId, {
            plan: "premium",
            subscription_status: "active",
            stripe_subscription_id: subscriptionId,
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await updateProfileByCustomer(customerId, {
            subscription_status: "past_due",
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
        if (!customerId) break;
        if (subscription.status === "active" || subscription.status === "trialing") {
          await updateProfileByCustomer(customerId, {
            plan: "premium",
            subscription_status: subscription.status === "trialing" ? "trial" : "active",
            stripe_subscription_id: subscription.id,
          });
        } else if (subscription.status === "past_due") {
          await updateProfileByCustomer(customerId, {
            subscription_status: "past_due",
            stripe_subscription_id: subscription.id,
          });
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
          await updateProfileByCustomer(customerId, {
            plan: "free",
            subscription_status: "canceled",
            messages_used: 0,
            snips_used: 0,
            quizzes_used: 0,
            message_limit: 15,
            snip_limit: 1,
            quiz_limit: 1,
            stripe_subscription_id: subscription.id,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
        if (customerId) {
          await updateProfileByCustomer(customerId, {
            plan: "free",
            subscription_status: "canceled",
            messages_used: 0,
            snips_used: 0,
            quizzes_used: 0,
            message_limit: 15,
            snip_limit: 1,
            quiz_limit: 1,
            stripe_subscription_id: subscription.id,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
