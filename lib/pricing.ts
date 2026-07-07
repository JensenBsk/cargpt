// Single source of truth for pricing. The pricing page renders from this,
// and scripts/setup-stripe.mjs creates the matching Stripe products/prices.
//
// Positioning: FIXD Premium is $99/yr and BlueDriver is $120 of hardware.
// Pro undercuts both for the "one problem a year" driver; Enthusiast is
// priced for people who wrench every weekend and would pay for the
// mod-aware analysis alone.

export const PRICING = {
  free: {
    name: "Free",
    tagline: "For the occasional check-engine light",
    monthly: 0,
    features: [
      "3 diagnoses / month",
      "OBD code lookup",
      "Cost estimates",
      "AI follow-up questions",
      "Quote checker",
    ],
  },
  pro: {
    name: "Pro",
    tagline: "For daily drivers who want answers on tap",
    monthly: 6.99,
    annual: 49, // ≈ $4.08/mo — 42% off
    features: [
      "Everything in Free",
      "Unlimited diagnoses",
      "Photo upload for quotes",
      "Up to 3 cars in garage",
      "Diagnosis history sync",
      "Priority AI model",
    ],
  },
  enthusiast: {
    name: "Enthusiast",
    tagline: "For modified, tuned, and project cars",
    monthly: 14.99,
    annual: 99, // ≈ $8.25/mo — 45% off
    features: [
      "Everything in Pro",
      "Unlimited cars in garage",
      "Full modified car mode",
      "Advanced OBD analysis",
      "Parts finder with OEM numbers",
      "Early access to new features",
    ],
  },
} as const;

export const proMonthlyEquivalent = (PRICING.pro.annual / 12).toFixed(2); // "4.08"
export const enthusiastMonthlyEquivalent = (PRICING.enthusiast.annual / 12).toFixed(2); // "8.25"
