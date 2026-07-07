"use client";

// Vehicle Health Report — a scored, grounded read on any car at any mileage.
// Deterministic score (lib/healthScore) fed by real NHTSA data + Carlos's
// platform knowledge, streamed in live. "Prebuy" mode adds the used-car
// buyer's pack: seller questions, test-drive checks, walk-away red flags.

import { useRef, useState } from "react";
import { HeartPulse, Share2, Wrench, AlertTriangle, ShieldCheck, HelpCircle, Ban, Gauge } from "lucide-react";
import VinInput from "@/components/VinInput";
import { parsePartialJson } from "@/lib/partialJson";
import { computeHealthScore, type HealthScore } from "@/lib/healthScore";
import { track } from "@/lib/track";

interface MaintenanceItem {
  item: string;
  intervalMiles?: number;
  status: "overdue" | "due_soon" | "ok";
  estCost?: string;
  note?: string | null;
}

interface WeakPoint {
  issue: string;
  severity: "minor" | "moderate" | "major";
  window?: string;
  watchFor?: string;
}

interface HealthReport {
  summary: string;
  mileageAssessment?: string;
  maintenance: MaintenanceItem[];
  weakPoints: WeakPoint[];
  prebuy?: { questions?: string[]; testDrive?: string[]; redFlags?: string[] };
  scoreNote?: string;
}

// Streaming shape: every field may still be missing mid-stream.
type PartialReport = Partial<HealthReport> & {
  maintenance?: Partial<MaintenanceItem>[];
  weakPoints?: Partial<WeakPoint>[];
};

interface NhtsaBundle {
  recallCount: number;
  recallSubjects: string[];
  complaintCount: number;
  complaintTop: { name: string; count: number }[];
  tsbCount: number;
}

interface Props {
  savedCars: { year: string; make: string; model: string }[];
  onToast: (msg: string) => void;
  onDiagnose: () => void;
}

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" };
const mono10: React.CSSProperties = { fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" as const };
const fieldStyle: React.CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", height: "48px", padding: "0 14px", fontSize: "16px", backgroundColor: "var(--input)", border: "1px solid var(--border-muted)", borderRadius: "10px", color: "var(--text)" };

const STATUS_CFG = {
  overdue: { color: "var(--red)", label: "OVERDUE" },
  due_soon: { color: "var(--amber)", label: "DUE SOON" },
  ok: { color: "var(--green)", label: "OK" },
} as const;

const SEVERITY_CFG = {
  major: { color: "var(--red)", label: "MAJOR" },
  moderate: { color: "var(--amber)", label: "MODERATE" },
  minor: { color: "var(--text-2)", label: "MINOR" },
} as const;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: "128px", height: "128px", flexShrink: 0 }} aria-hidden="true">
      <svg viewBox="0 0 128 128" width="128" height="128">
        <circle cx="64" cy="64" r={r} style={{ fill: "none", stroke: "var(--surface-3)", strokeWidth: 9 }} />
        <circle
          cx="64" cy="64" r={r}
          style={{ fill: "none", stroke: color, strokeWidth: 9, strokeLinecap: "round", strokeDasharray: `${(score / 100) * c} ${c}`, transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "34px", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.1em", marginTop: "3px" }}>/ 100</span>
      </div>
    </div>
  );
}

export default function HealthView({ savedCars, onToast, onDiagnose }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 36 }, (_, i) => currentYear - i);

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [mode, setMode] = useState<"own" | "prebuy">("own");
  const [vinData, setVinData] = useState<{ year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PartialReport | null>(null);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [nhtsa, setNhtsa] = useState<NhtsaBundle | null>(null);
  const [scored, setScored] = useState<HealthScore | null>(null);
  const reportVehicleRef = useRef("");

  const canSubmit = year && make.trim() && model.trim() && mileage.trim();

  async function fetchNhtsa(): Promise<NhtsaBundle> {
    const qs = `year=${encodeURIComponent(year)}&make=${encodeURIComponent(make.trim())}&model=${encodeURIComponent(model.trim())}`;
    const [recalls, tsbs, complaints] = await Promise.all([
      fetch(`/api/recalls?${qs}`).then((r) => r.json()).catch(() => ({ count: 0, recalls: [] })),
      fetch(`/api/tsbs?${qs}`).then((r) => r.json()).catch(() => ({ count: 0, tsbs: [] })),
      fetch(`/api/complaints?${qs}`).then((r) => r.json()).catch(() => ({ count: 0, topComponents: [] })),
    ]);
    return {
      recallCount: recalls.count ?? 0,
      recallSubjects: (recalls.recalls ?? []).slice(0, 3).map((r: { subject: string }) => r.subject),
      complaintCount: complaints.count ?? 0,
      complaintTop: complaints.topComponents ?? [],
      tsbCount: tsbs.count ?? 0,
    };
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) { setShowErrors(true); return; }
    const miles = Number(mileage.replace(/[,\s]/g, ""));
    if (!Number.isFinite(miles) || miles < 0 || miles > 500_000) { setShowErrors(true); return; }

    setShowErrors(false);
    setLoading(true);
    setError(null);
    setReport(null);
    setScored(null);
    setPreview(null);
    track("health_started", { make, mode });
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const bundle = await fetchNhtsa();
      setNhtsa(bundle);

      const context = [
        `Open recalls: ${bundle.recallCount}${bundle.recallSubjects.length ? ` (${bundle.recallSubjects.join("; ")})` : ""}`,
        `Owner complaints filed: ${bundle.complaintCount}${bundle.complaintTop.length ? ` — top areas: ${bundle.complaintTop.map((c) => `${c.name} (${c.count})`).join(", ")}` : ""}`,
        `Technical service bulletins on file: ${bundle.tsbCount}`,
      ].join("\n").slice(0, 1900);

      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make: make.trim(), model: model.trim(), mileage: miles, mode, vinData: vinData ?? undefined, context }),
      });

      if (!res.ok) {
        setError(res.status === 429 ? "Slow down a little — try again in a minute." : "Couldn't run the health check. Try again.");
        return;
      }

      let parsed: HealthReport;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.error || !data.report) { setError("Couldn't run the health check. Try again."); return; }
        parsed = data.report;
      } else {
        if (!res.body) throw new Error("No body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let last = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const now = Date.now();
          if (now - last > 120) {
            last = now;
            const p = parsePartialJson(buf);
            if (p) setPreview(p as PartialReport);
          }
        }
        buf += decoder.decode();
        const s = buf.indexOf("{");
        const e2 = buf.lastIndexOf("}");
        if (s === -1 || e2 === -1) { setError("Couldn't run the health check. Try again."); return; }
        parsed = JSON.parse(buf.slice(s, e2 + 1));
      }

      const maintenance = parsed.maintenance ?? [];
      const weakPoints = parsed.weakPoints ?? [];
      const result = computeHealthScore({
        mileage: miles,
        openRecalls: bundle.recallCount,
        complaintCount: bundle.complaintCount,
        overdueCount: maintenance.filter((m) => m.status === "overdue").length,
        dueSoonCount: maintenance.filter((m) => m.status === "due_soon").length,
        weakPoints: weakPoints.map((w) => ({ severity: w.severity })),
      });
      reportVehicleRef.current = `${year} ${make.trim()} ${model.trim()}`;
      setReport(parsed);
      setScored(result);
      track("health_completed", { make, mode, score: result.score });
    } catch {
      setError(!navigator.onLine ? "You're offline — reconnect and try again." : "Couldn't run the health check. Try again.");
    } finally {
      setLoading(false);
      setPreview(null);
    }
  }

  async function handleShare() {
    if (!scored) return;
    const text = `${reportVehicleRef.current} — Carlos health score ${scored.score}/100 (${scored.label}). Full AI health report at mchaniccarlos.com`;
    track("health_shared", { score: scored.score });
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); onToast("Copied — paste it anywhere ✓"); }
    } catch { /* user cancelled */ }
  }

  function reset() {
    setReport(null);
    setScored(null);
    setNhtsa(null);
    setError(null);
  }

  // ── Report view ──
  if (report && scored) {
    const overdue = report.maintenance.filter((m) => m.status === "overdue");
    const rest = report.maintenance.filter((m) => m.status !== "overdue");
    const showPrebuy = mode === "prebuy" && report.prebuy && ((report.prebuy.questions?.length ?? 0) > 0 || (report.prebuy.testDrive?.length ?? 0) > 0);
    return (
      <div className="result-enter" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 20px 40px", maxWidth: "520px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Score card */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "18px" }}>
          <ScoreRing score={scored.score} color={scored.color} />
          <div style={{ minWidth: 0 }}>
            <div style={mono10}>{reportVehicleRef.current} · {Number(mileage.replace(/[,\s]/g, "")).toLocaleString("en-US")} MI</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: scored.color, margin: "4px 0 6px" }}>{scored.label}</div>
            <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.55, margin: 0 }}>{report.summary}</p>
          </div>
        </div>

        {/* Score factors — the receipts */}
        <div style={card}>
          <div style={{ ...mono10, marginBottom: "10px" }}>How the score breaks down</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scored.factors.map((f) => (
              <div key={f.label} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "var(--text-2)" }}>{f.label}</span>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: f.delta === 0 ? "var(--green)" : "var(--amber)", flexShrink: 0 }}>{f.delta === 0 ? "✓" : f.delta}</span>
              </div>
            ))}
          </div>
          {report.scoreNote && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "12px 0 0", lineHeight: 1.5 }}>{report.scoreNote}</p>}
          {report.mileageAssessment && <p style={{ fontSize: "12px", color: "var(--text-3)", margin: "6px 0 0", lineHeight: 1.5 }}>{report.mileageAssessment}</p>}
        </div>

        {/* Recalls (only when present) */}
        {nhtsa && nhtsa.recallCount > 0 && (
          <div style={{ ...card, border: "1px solid rgba(245,158,11,0.35)" }}>
            <div style={{ ...mono10, color: "var(--amber)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={12} aria-hidden="true" /> {nhtsa.recallCount} open recall{nhtsa.recallCount > 1 ? "s" : ""} — free to fix at any dealer
            </div>
            {nhtsa.recallSubjects.map((s, i) => (
              <p key={`${i}-${s}`} style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 4px" }}>{s}</p>
            ))}
          </div>
        )}

        {/* Maintenance */}
        <div style={card}>
          <div style={{ ...mono10, marginBottom: "10px" }}>Maintenance at this mileage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...overdue, ...rest].map((m, i) => {
              const cfg = STATUS_CFG[m.status] ?? STATUS_CFG.ok;
              return (
                <div key={`${i}-${m.item}`} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{m.item}</span>
                    {m.note && <div style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: 1.4 }}>{m.note}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexShrink: 0 }}>
                    {m.estCost && <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "var(--text-3)" }}>{m.estCost}</span>}
                    <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: cfg.color, letterSpacing: "0.06em" }}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak points */}
        {report.weakPoints.length > 0 && (
          <div style={card}>
            <div style={{ ...mono10, marginBottom: "10px" }}>Known trouble spots on this platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {report.weakPoints.map((w, i) => {
                const cfg = SEVERITY_CFG[w.severity] ?? SEVERITY_CFG.minor;
                return (
                  <div key={`${i}-${w.issue}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", fontWeight: 700, color: cfg.color, letterSpacing: "0.08em", border: `1px solid ${cfg.color}`, borderRadius: "4px", padding: "1px 5px", flexShrink: 0 }}>{cfg.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{w.issue}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                      {w.window ? <span style={{ color: "var(--text-3)" }}>{w.window} · </span> : null}{w.watchFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pre-purchase pack */}
        {showPrebuy && (
          <div style={{ ...card, border: "1px solid var(--accent-border)" }}>
            <div style={{ ...mono10, color: "var(--accent)", marginBottom: "12px" }}>Before you hand over money</div>
            {(report.prebuy?.questions?.length ?? 0) > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}><HelpCircle size={13} aria-hidden="true" /> Ask the seller</div>
                {report.prebuy!.questions!.map((q, i) => <p key={`${i}-${q}`} style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 4px" }}>· {q}</p>)}
              </div>
            )}
            {(report.prebuy?.testDrive?.length ?? 0) > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}><Gauge size={13} aria-hidden="true" /> On the test drive</div>
                {report.prebuy!.testDrive!.map((q, i) => <p key={`${i}-${q}`} style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 4px" }}>· {q}</p>)}
              </div>
            )}
            {(report.prebuy?.redFlags?.length ?? 0) > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--red)", marginBottom: "6px" }}><Ban size={13} aria-hidden="true" /> Walk away if</div>
                {report.prebuy!.redFlags!.map((q, i) => <p key={`${i}-${q}`} style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 4px" }}>· {q}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <button onClick={handleShare} className="tap-target" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "50px", backgroundColor: "var(--accent)", color: "white", fontWeight: 700, fontSize: "15px", border: "none", borderRadius: "12px", cursor: "pointer" }}>
          <Share2 size={16} aria-hidden="true" /> Share this report
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onDiagnose} className="tap-target" style={{ flex: 1, height: "46px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <Wrench size={14} aria-hidden="true" /> Diagnose a problem
          </button>
          <button onClick={reset} className="tap-target" style={{ flex: 1, height: "46px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            New check
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-4)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Score combines NHTSA recall, complaint, and bulletin data with mileage-based maintenance status. Guidance only — a hands-on inspection beats any report.
        </p>
      </div>
    );
  }

  // ── Form + streaming preview ──
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 20px 120px", maxWidth: "520px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

      {!loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 4px 16px" }}>
          <span style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <HeartPulse size={20} style={{ color: "var(--accent)" }} aria-hidden="true" />
          </span>
          <div>
            <h1 style={{ color: "var(--text)", fontSize: "20px", fontWeight: 700, margin: "0 0 2px" }}>Vehicle health check</h1>
            <p style={{ color: "var(--text-2)", fontSize: "13px", margin: 0 }}>Real recall, complaint & maintenance data — scored in seconds.</p>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ margin: "16px 0" }}>
          <div aria-live="polite" style={{ textAlign: "center", padding: "24px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border)", marginBottom: "12px" }}>
            <p style={{ color: "var(--text)", fontSize: "15px", fontWeight: 600, margin: "0 0 4px" }}>
              {preview ? "Here's what Carlos is finding…" : `Pulling federal safety data on the ${make.trim() || "car"}…`}
            </p>
            <p style={{ color: "var(--text-2)", fontSize: "13px", margin: 0 }}>{preview ? "Report coming in live" : "Recalls, complaints, bulletins, then the full report"}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {preview?.summary ? (
              <div className="preview-row-in" style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ ...mono10, marginBottom: "6px" }}>The read</div>
                <p style={{ color: "var(--text)", fontSize: "14px", lineHeight: 1.55, margin: 0 }}>
                  {preview.summary}
                  {!preview.maintenance && <span className="stream-cursor" aria-hidden="true" />}
                </p>
              </div>
            ) : (
              <div aria-hidden="true" className="skeleton" style={{ height: "64px" }} />
            )}
            {preview?.maintenance?.some((m) => m.item) ? (
              <div className="preview-row-in" style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={mono10}>Maintenance</div>
                {preview.maintenance.filter((m) => m.item).map((m, i) => (
                  <div key={i} className="preview-row-in" style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{m.item}</span>
                    {m.status && <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: (STATUS_CFG[m.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ok).color }}>{(STATUS_CFG[m.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ok).label}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div aria-hidden="true" className="skeleton" style={{ height: "96px" }} />
            )}
            <div aria-hidden="true" className="skeleton" style={{ height: "72px" }} />
          </div>
        </div>
      )}

      <form onSubmit={handleRun} style={{ display: loading ? "none" : "flex", flexDirection: "column", gap: "16px" }}>

        {/* Mode toggle */}
        <div role="radiogroup" aria-label="Check type" style={{ display: "flex", gap: "8px" }}>
          {([["own", "I own this car"], ["prebuy", "I'm thinking of buying it"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className="tap-target"
              style={{
                flex: 1, minHeight: "44px", padding: "8px 10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                transition: "background-color 200ms, border-color 200ms",
                backgroundColor: mode === value ? "var(--accent-dim)" : "var(--surface)",
                border: `1px solid ${mode === value ? "var(--accent-border)" : "var(--border)"}`,
                color: mode === value ? "var(--accent)" : "var(--text-2)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {savedCars.length > 0 && !(year && make && model) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Your cars:</span>
            {savedCars.map((c) => (
              <button key={`${c.year}${c.make}${c.model}`} type="button" onClick={() => { setYear(c.year); setMake(c.make); setModel(c.model); }} className="tap-target" style={{ fontSize: "12px", fontWeight: 600, padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--accent-border)", color: "var(--accent)", backgroundColor: "var(--accent-dim)", cursor: "pointer" }}>
                {c.year} {c.make} {c.model}
              </button>
            ))}
          </div>
        )}

        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "10px" }}>
          <label htmlFor="health-year" className="sr-only">Model year</label>
          <select id="health-year" value={year} onChange={(e) => setYear(e.target.value)} style={{ ...fieldStyle, color: year ? "var(--text)" : "var(--text-3)" }}>
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <label htmlFor="health-make" className="sr-only">Make</label>
          <input id="health-make" type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make (e.g. Jeep)" autoComplete="off" style={fieldStyle} />
          <label htmlFor="health-model" className="sr-only">Model</label>
          <input id="health-model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (e.g. Compass)" autoComplete="off" style={fieldStyle} />
          <label htmlFor="health-mileage" className="sr-only">Mileage</label>
          <input id="health-mileage" type="text" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/[^\d,]/g, ""))} placeholder="Mileage (e.g. 87,000)" autoComplete="off" style={fieldStyle} />
          <VinInput onDecode={(d) => { setYear(d.year); setMake(d.make); setModel(d.model); setVinData(d); }} />
          {showErrors && (
            <p role="alert" style={{ margin: 0, fontSize: "12px", color: "var(--red)" }}>Enter the year, make, model, and mileage (0–500,000).</p>
          )}
        </div>

        {error && (
          <div role="alert" style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,0.35)", color: "var(--red)", fontSize: "13px" }}>{error}</div>
        )}

        <button type="submit" disabled={loading} className="tap-target" style={{ width: "100%", height: "54px", backgroundColor: "var(--accent)", color: "white", fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
          {mode === "prebuy" ? "Check before I buy" : "Run health check"}
        </button>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-4)", margin: 0 }}>
          Free · uses federal NHTSA safety data + Carlos&apos;s platform knowledge
        </p>
      </form>
    </div>
  );
}
