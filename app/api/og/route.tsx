import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return fallbackImage();
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: share } = await supabase
      .from("shared_diagnoses")
      .select("car_year, car_make, car_model, code_or_symptom, diagnosis_json")
      .eq("token", token)
      .single();

    if (!share) return fallbackImage();

    const { car_year, car_make, car_model, code_or_symptom, diagnosis_json } = share;
    const verdict: "STOP" | "CAUTION" | "OKAY" = diagnosis_json?.driveSafety?.verdict ?? "OKAY";
    const topCause = diagnosis_json?.rankedCauses?.[0]?.cause ?? "Unknown";
    const topCost = diagnosis_json?.costEstimates?.[0]?.total ?? "N/A";

    const verdictColors = { STOP: "#ef4444", CAUTION: "#f59e0b", OKAY: "#22c55e" };
    const verdictLabels = { STOP: "STOP DRIVING", CAUTION: "DRIVE WITH CAUTION", OKAY: "OKAY TO DRIVE" };
    const accentColor = verdictColors[verdict];

    const symptom = (code_or_symptom || "").length > 65
      ? (code_or_symptom || "").slice(0, 62) + "…"
      : code_or_symptom || "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0d0f12",
            padding: "56px 72px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", marginBottom: "36px" }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#3b82f6", letterSpacing: "0.2em" }}>
              TORQUE
            </span>
          </div>

          {/* Car name */}
          <div style={{ fontSize: 54, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.05, marginBottom: "12px" }}>
            {car_year} {car_make} {car_model}
          </div>

          {/* Symptom */}
          <div style={{ fontSize: 20, color: "#6b7280", marginBottom: "32px" }}>{symptom}</div>

          {/* Safety badge */}
          <div style={{ display: "flex", marginBottom: "28px" }}>
            <div
              style={{
                backgroundColor: accentColor,
                color: "white",
                fontSize: 17,
                fontWeight: 700,
                padding: "8px 24px",
                borderRadius: 999,
                letterSpacing: "0.07em",
              }}
            >
              {verdictLabels[verdict]}
            </div>
          </div>

          {/* Top cause */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "24px" }}>
            <div style={{ fontSize: 14, color: "#4b5563", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
              Most Likely Cause
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#f1f5f9" }}>{topCause}</div>
          </div>

          {/* Cost */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "auto" }}>
            <div style={{ fontSize: 18, color: "#6b7280" }}>Est. Repair:</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#3b82f6" }}>{topCost}</div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "20px",
              borderTop: "1px solid #1e2329",
            }}
          >
            <div style={{ fontSize: 15, color: "#4b5563" }}>AI diagnosis · verify with a mechanic</div>
            <div style={{ fontSize: 19, color: "#3b82f6", fontWeight: 700 }}>torqueapp.co</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    console.error("OG image error:", err);
    return fallbackImage();
  }
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0f12",
          fontFamily: "sans-serif",
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 900, color: "#3b82f6", letterSpacing: "0.2em" }}>
          TORQUE
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
