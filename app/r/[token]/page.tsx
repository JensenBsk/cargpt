import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mchaniccarlos.com";

const SAFETY_CONFIG = {
  STOP: { bg: "#1a0a0a", border: "#3a1515", accent: "#ef4444", badgeBg: "#ef4444", label: "⛔ STOP DRIVING", reasonColor: "#fca5a5" },
  CAUTION: { bg: "#1a1500", border: "#3a2e00", accent: "#f59e0b", badgeBg: "#f59e0b", label: "⚠️ DRIVE WITH CAUTION", reasonColor: "#fcd34d" },
  OKAY: { bg: "#0a1a0f", border: "#1a3a1f", accent: "#22c55e", badgeBg: "#22c55e", label: "✅ OKAY TO DRIVE", reasonColor: "#86efac" },
};

const LIKELIHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "Most Likely": { bg: "rgba(59,130,246,0.14)", text: "#4a9eff" },
  "Likely": { bg: "rgba(99,102,241,0.14)", text: "#818cf8" },
  "Possible": { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" },
  "Unlikely but serious": { bg: "rgba(245,158,11,0.14)", text: "#f59e0b" },
};

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shared_diagnoses")
    .select("car_year, car_make, car_model, code_or_symptom, diagnosis_json")
    .eq("token", token)
    .single();

  if (!data) return { title: "Diagnosis | Carlos" };

  const { car_year, car_make, car_model, code_or_symptom, diagnosis_json } = data;
  const verdict = diagnosis_json?.driveSafety?.verdict ?? "OKAY";
  const topCause = diagnosis_json?.rankedCauses?.[0]?.cause ?? "";
  const topCost = diagnosis_json?.costEstimates?.[0]?.total ?? "";

  const verdictText = verdict === "STOP" ? "Stop driving." : verdict === "CAUTION" ? "Drive with caution." : "Safe to drive.";

  return {
    title: `${car_year} ${car_make} ${car_model} — ${code_or_symptom} | Carlos`,
    description: `${verdictText} Most likely: ${topCause}. Est. repair: ${topCost}. Full step-by-step guide inside.`,
    openGraph: {
      title: `${car_year} ${car_make} ${car_model} Diagnosis | Carlos`,
      description: `${verdictText} ${topCause}. Est: ${topCost}.`,
      images: [`${APP_URL}/api/og?token=${token}`],
      url: `${APP_URL}/r/${token}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${car_year} ${car_make} ${car_model} Diagnosis | Carlos`,
      description: `${verdictText} ${topCause}. Est: ${topCost}.`,
      images: [`${APP_URL}/api/og?token=${token}`],
    },
  };
}

export default async function SharedDiagnosisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: share, error } = await supabase
    .from("shared_diagnoses")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !share) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Atomic server-side increment; RLS allows no direct updates to this table.
  await supabase.rpc("increment_share_views", { share_token: token });

  const isSignedIn = !!userId;
  const isOwner = userId === share.created_by && !!share.created_by;

  const { car_year, car_make, car_model, code_or_symptom, diagnosis_json, view_count } = share;
  const diagnosis = diagnosis_json;
  const verdict: "STOP" | "CAUTION" | "OKAY" = diagnosis?.driveSafety?.verdict ?? "OKAY";
  const safetyConfig = SAFETY_CONFIG[verdict];
  const topCause = diagnosis?.rankedCauses?.[0];
  const topEst = diagnosis?.costEstimates?.[0];
  const totalCauses = diagnosis?.rankedCauses?.length ?? 0;
  const totalSteps = diagnosis?.diagnosticSteps?.length ?? 0;
  const totalWarnings = diagnosis?.dontDoThis?.length ?? 0;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0d0f12", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0d0f12", borderBottom: "1px solid #1e2329" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: "18px", color: "#4a9eff", letterSpacing: "0.15em" }}>CARLOS</span>
        </Link>
        {isOwner && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "20px", padding: "4px 12px" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>You shared this</span>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>·</span>
            <span style={{ fontSize: "12px", color: "#4a9eff", fontWeight: 600 }}>{view_count} views</span>
          </div>
        )}
        {!isSignedIn && (
          <Link href="/" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(59,130,246,0.5)", color: "#4a9eff", backgroundColor: "rgba(59,130,246,0.08)", textDecoration: "none" }}>
            Try Carlos
          </Link>
        )}
        {isSignedIn && !isOwner && (
          <Link href="/" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid #252b34", color: "#9ca3af", backgroundColor: "transparent", textDecoration: "none" }}>
            Try on my car →
          </Link>
        )}
      </div>

      <div style={{ padding: "16px 16px", maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Provenance */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/carlos/carlos-icon.webp"
            alt="Carlos"
            style={{ width: "40px", height: "40px", borderRadius: "10px", boxShadow: "0 0 12px rgba(59,130,246,0.3)", flexShrink: 0 }}
          />
          <span style={{ color: "#6b7280", fontSize: "14px" }}>Carlos diagnosed this car</span>
        </div>

        {/* Car + issue */}
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1 }}>
            {car_year} {car_make} {car_model}
          </h1>
          {code_or_symptom && (
            <div style={{ marginTop: "6px", fontSize: "14px", color: "#6b7280", lineHeight: 1.4 }}>{code_or_symptom}</div>
          )}
        </div>

        {/* Safety badge — always visible, always animated */}
        <div style={{ backgroundColor: safetyConfig.bg, border: `1px solid ${safetyConfig.border}`, borderLeft: `3px solid ${safetyConfig.accent}`, borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <span
              className={verdict === "STOP" ? "badge-pulse-stop" : verdict === "CAUTION" ? "badge-pulse-caution" : ""}
              style={{ display: "inline-block", backgroundColor: safetyConfig.badgeBg, color: "white", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" }}
            >
              {safetyConfig.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: safetyConfig.reasonColor, lineHeight: 1.5 }}>
            {diagnosis?.driveSafety?.reason}
          </p>
        </div>

        {/* Top cause — always visible */}
        {topCause && (
          <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderLeft: "3px solid #4a9eff", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
              #1 Most Likely
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>{topCause.cause}</div>
            <span style={{
              backgroundColor: LIKELIHOOD_COLORS[topCause.likelihood]?.bg ?? "rgba(59,130,246,0.14)",
              color: LIKELIHOOD_COLORS[topCause.likelihood]?.text ?? "#4a9eff",
              fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px",
            }}>{topCause.likelihood}</span>
          </div>
        )}

        {/* Cost pill — always visible */}
        {topEst && (
          <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>Est. Repair Cost</span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#4a9eff" }}>{topEst.total}</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            `${totalCauses} cause${totalCauses !== 1 ? "s" : ""} analyzed`,
            `${totalSteps} step${totalSteps !== 1 ? "s" : ""}`,
            `${totalWarnings} warning${totalWarnings !== 1 ? "s" : ""}`,
          ].map((stat) => (
            <div key={stat} style={{ flex: 1, backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "8px", padding: "8px", textAlign: "center", fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
              {stat}
            </div>
          ))}
        </div>

        {/* Remaining causes — blurred when not signed in */}
        {diagnosis?.rankedCauses?.length > 1 && (
          <div style={{ position: "relative" }}>
            <div style={{ filter: isSignedIn ? "none" : "blur(5px)", userSelect: isSignedIn ? "auto" : "none", pointerEvents: isSignedIn ? "auto" : "none" }}>
              <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  All Likely Causes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {diagnosis.rankedCauses.slice(1).map((cause: { rank: number; cause: string; likelihood: string }) => {
                    const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" };
                    return (
                      <div key={cause.rank} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "#1a1e25", borderRadius: "8px", border: "1px solid #1e2329" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#252b34", color: "#9ca3af", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cause.rank}</span>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>{cause.cause}</span>
                        </div>
                        <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>{cause.likelihood}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Steps preview */}
              {diagnosis?.diagnosticSteps && (
                <div style={{ marginTop: "12px", backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Check This First</div>
                  {diagnosis.diagnosticSteps.slice(0, 2).map((step: { step: number; action: string }) => (
                    <div key={step.step} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #1e2329" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#1a1e25", border: "1px solid #252b34", color: "#6b7280", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step.step}</span>
                      <span style={{ fontSize: "14px", color: "#f1f5f9" }}>{step.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gradient fade */}
            {!isSignedIn && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(transparent, #0d0f12)", pointerEvents: "none" }} />
            )}
          </div>
        )}

        {/* Signed-in: show full content */}
        {isSignedIn && diagnosis?.costEstimates && (
          <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Cost Estimates</div>
            {diagnosis.costEstimates.map((est: { fix: string; total: string; parts: string; labor: string; note?: string }, i: number) => (
              <div key={i} style={{ backgroundColor: "#1a1e25", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px", marginBottom: i < diagnosis.costEstimates.length - 1 ? "8px" : 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>{est.fix}</div>
                <div style={{ display: "flex", gap: "16px" }}>
                  {[["Parts", est.parts], ["Labor", est.labor], ["Total", est.total]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: label === "Total" ? "16px" : "13px", color: label === "Total" ? "#f1f5f9" : "#9ca3af", fontWeight: label === "Total" ? 700 : 400 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>{est.note}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacer */}
        <div style={{ height: isSignedIn ? "32px" : "160px" }} />
      </div>

      {/* Gate CTA */}
    </div>
  );
}
