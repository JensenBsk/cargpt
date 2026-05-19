import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || !session.customer) return Response.json({ received: true });

      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;

      if (session.mode === "subscription" && session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        const priceId = sub.items.data[0]?.price.id;
        const tier = getTierFromPriceId(priceId);

        await supabase.from("users").update({
          stripe_customer_id: customerId,
          subscription_tier: tier,
        }).eq("id", userId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) return Response.json({ received: true });

      const tier = event.type === "customer.subscription.deleted" || sub.status !== "active"
        ? "free"
        : getTierFromPriceId(sub.items.data[0]?.price.id);

      await supabase.from("users").update({ subscription_tier: tier }).eq("id", userId);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

function getTierFromPriceId(priceId: string | undefined): string {
  const proIds = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ];
  const enthusiastIds = [
    process.env.STRIPE_ENTHUSIAST_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTHUSIAST_ANNUAL_PRICE_ID,
  ];
  if (priceId && proIds.includes(priceId)) return "pro";
  if (priceId && enthusiastIds.includes(priceId)) return "enthusiast";
  return "free";
}
