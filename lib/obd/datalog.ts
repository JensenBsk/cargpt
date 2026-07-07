// Datalog capture summary — turns 30 seconds of live PID samples into the
// compact, factual digest a mechanic would read off a scan tool. No
// interpretation here: Carlos does the judging in the diagnosis prompt;
// this stays a faithful instrument readout (and is unit-testable).

import type { LiveData } from "./elm327";

export interface DatalogSample extends LiveData {
  /** ms since capture start */
  t: number;
}

interface MetricSpec {
  key: keyof LiveData;
  label: string;
  unit: string;
  decimals: number;
  /** include a stability readout (min–max spread matters at idle) */
  spread?: boolean;
}

const METRICS: MetricSpec[] = [
  { key: "rpm", label: "RPM", unit: "", decimals: 0, spread: true },
  { key: "coolantTempC", label: "Coolant", unit: "°C", decimals: 0 },
  { key: "shortFuelTrimPct", label: "Short fuel trim", unit: "%", decimals: 1, spread: true },
  { key: "longFuelTrimPct", label: "Long fuel trim", unit: "%", decimals: 1 },
  { key: "mafGs", label: "MAF airflow", unit: " g/s", decimals: 1 },
  { key: "engineLoadPct", label: "Engine load", unit: "%", decimals: 0 },
  { key: "throttlePct", label: "Throttle", unit: "%", decimals: 0 },
  { key: "intakeTempC", label: "Intake air", unit: "°C", decimals: 0 },
  { key: "speedKmh", label: "Speed", unit: " km/h", decimals: 0, spread: true },
];

function fmt(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

/**
 * Summarize a capture into a readable digest. Returns null when the samples
 * carry no usable PIDs (adapter fell over mid-capture).
 */
export function summarizeDatalog(samples: DatalogSample[], phaseLabel = "engine running"): string | null {
  if (samples.length === 0) return null;
  const durationSec = Math.max(1, Math.round((samples[samples.length - 1].t - samples[0].t) / 1000));

  const lines: string[] = [];
  for (const m of METRICS) {
    const vals = samples.map((s) => s[m.key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (vals.length === 0) continue;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    let line = `${m.label}: avg ${fmt(avg, m.decimals)}${m.unit}`;
    if (m.spread && max - min > Math.abs(avg) * 0.02 + 0.05) {
      line += ` (ranged ${fmt(min, m.decimals)}–${fmt(max, m.decimals)}${m.unit})`;
    }
    // Coolant trend tells warm-up story
    if (m.key === "coolantTempC" && vals.length >= 2 && Math.abs(vals[vals.length - 1] - vals[0]) >= 2) {
      line += `, ${fmt(vals[0], 0)}→${fmt(vals[vals.length - 1], 0)}${m.unit} over the capture`;
    }
    lines.push(line);
  }

  if (lines.length === 0) return null;
  return `${durationSec}s capture, ${samples.length} samples, ${phaseLabel}:\n${lines.join("\n")}`;
}
