import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnose Your Car — Carlos, Your AI Mechanic",
  description: "Describe the problem, add a photo or OBD2 codes, and get ranked causes, step-by-step checks, and fair repair costs in seconds.",
  alternates: { canonical: "https://mchaniccarlos.com/diagnose" },
  openGraph: {
    title: "Diagnose Your Car with Carlos",
    description: "Ranked causes, step-by-step checks, and fair repair costs in seconds.",
    url: "https://mchaniccarlos.com/diagnose",
  },
};

export default function DiagnoseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
