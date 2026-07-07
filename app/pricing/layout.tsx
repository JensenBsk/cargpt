import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Carlos, Your AI Mechanic",
  description: "Start free. Pro from $4.08/mo: unlimited AI car diagnoses, photo analysis, and your full garage. No hidden fees.",
  alternates: { canonical: "https://mchaniccarlos.com/pricing" },
  openGraph: {
    title: "Carlos Pricing — Start Free",
    description: "Unlimited AI car diagnoses from $4.08/mo.",
    url: "https://mchaniccarlos.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
