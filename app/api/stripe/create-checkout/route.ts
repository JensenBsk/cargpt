import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

  const { priceId, mode = "subscription" } = await request.json();
  if (!priceId) {
    return Response.json({ error: "Missing priceId" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode === "payment" ? "payment" : "subscription",
      success_url: `${appUrl}/diagnose?upgrade=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { user_id: userId },
      allow_promotion_codes: true,
      subscription_data: mode !== "payment" ? { metadata: { user_id: userId } } : undefined,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/create-checkout]", err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
