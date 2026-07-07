#!/usr/bin/env node
// One-time Stripe setup: creates the Carlos products + prices and prints
// the env vars to paste into .env.local and Vercel.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe.mjs
//
// Amounts must match lib/pricing.ts (kept in sync by hand — check both
// before running). Safe to re-run: it looks up existing products by name
// and only creates what's missing.

import Stripe from "stripe";

// Accept the key as env var or first argument — people paste it both ways.
const key = process.env.STRIPE_SECRET_KEY?.startsWith("sk_")
  ? process.env.STRIPE_SECRET_KEY
  : process.argv[2];
if (!key?.startsWith("sk_")) {
  console.error("Set STRIPE_SECRET_KEY (sk_test_... to try it, sk_live_... for real).");
  process.exit(1);
}
if (key.startsWith("sk_test_")) {
  console.log("NOTE: test-mode key — prices work with test cards only. Re-run with sk_live_ for real payments.\n");
}
const stripe = new Stripe(key);

const PLANS = [
  {
    product: "Carlos Pro",
    description: "Unlimited AI diagnoses, photo quotes, history sync",
    prices: [
      { envVar: "NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID", amount: 699, interval: "month" },
      { envVar: "NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID", amount: 4900, interval: "year" },
    ],
  },
  {
    product: "Carlos Enthusiast",
    description: "Everything in Pro plus modified-car mode, advanced OBD, parts finder",
    prices: [
      { envVar: "NEXT_PUBLIC_STRIPE_ENTHUSIAST_MONTHLY_PRICE_ID", amount: 1499, interval: "month" },
      { envVar: "NEXT_PUBLIC_STRIPE_ENTHUSIAST_ANNUAL_PRICE_ID", amount: 9900, interval: "year" },
    ],
  },
];

const envLines = [];

for (const plan of PLANS) {
  const existing = await stripe.products.search({ query: `name:"${plan.product}" AND active:"true"` });
  const product = existing.data[0] ?? await stripe.products.create({ name: plan.product, description: plan.description });
  console.log(`product: ${product.name} (${product.id})`);

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  for (const spec of plan.prices) {
    let price = prices.data.find(
      (p) => p.unit_amount === spec.amount && p.recurring?.interval === spec.interval && p.currency === "usd"
    );
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: spec.amount,
        currency: "usd",
        recurring: { interval: spec.interval },
      });
      console.log(`  created $${(spec.amount / 100).toFixed(2)}/${spec.interval} → ${price.id}`);
    } else {
      console.log(`  exists  $${(spec.amount / 100).toFixed(2)}/${spec.interval} → ${price.id}`);
    }
    envLines.push(`${spec.envVar}=${price.id}`);
    // The Stripe webhook maps price -> tier via the server-side name (no NEXT_PUBLIC_)
    envLines.push(`${spec.envVar.replace("NEXT_PUBLIC_", "")}=${price.id}`);
  }
}

console.log(`\nPaste into .env.local, then add to Vercel (all environments):\n`);
console.log(envLines.join("\n"));
console.log(`\nAlso needed if not set yet:\n  STRIPE_SECRET_KEY=<the key you just used>\n  STRIPE_WEBHOOK_SECRET=<from: stripe listen or the dashboard webhook for /api/stripe/webhook>`);
console.log(`\nVercel one-liners:\n${envLines.map((l) => {
  const [k, v] = l.split("=");
  return `  printf '${v}' | npx vercel env add ${k} production`;
}).join("\n")}`);
