import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return Response.json({ error: "No subscription found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/diagnose`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return Response.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
