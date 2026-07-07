// Vehicle health scoring — the deterministic half of the health report.
// The AI supplies judgment (maintenance status, platform weak points); this
// module turns those plus hard NHTSA data into a number the user can trust,
// with a visible breakdown so the score never feels like vibes.

export interface WeakPointInput {
  severity: "minor" | "moderate" | "major";
}

export interface HealthInputs {
  mileage: number;
  openRecalls: number;
  complaintCount: number;
  overdueCount: number; // maintenance items past due
  dueSoonCount: number;
  weakPoints: WeakPointInput[];
}

export interface ScoreFactor {
  label: string;
  delta: number; // 0 or negative
}

export interface HealthScore {
  score: number; // 20–100
  label: "Excellent" | "Strong" | "Fair" | "Needs attention" | "At risk";
  color: string; // design-token var for the label/dial
  factors: ScoreFactor[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function computeHealthScore(i: HealthInputs): HealthScore {
  const factors: ScoreFactor[] = [];

  // Unrepaired safety recalls are the single worst signal — free to fix,
  // dangerous to ignore.
  const recallHit = -clamp(i.openRecalls * 12, 0, 36);
  factors.push({ label: i.openRecalls === 0 ? "No open safety recalls" : `${i.openRecalls} open safety recall${i.openRecalls > 1 ? "s" : ""}`, delta: recallHit });

  // Mileage: gentle until 60k, then a steady slope. 150k ≈ -18.
  const mileageHit = i.mileage <= 60_000 ? 0 : -clamp(Math.round((i.mileage - 60_000) / 5_000), 0, 24);
  factors.push({ label: `${Math.round(i.mileage / 1000)}k miles on the clock`, delta: mileageHit });

  // Owner-complaint volume for this exact year/model (coarse tiers — NHTSA
  // has no sales denominators, so this is signal, not science).
  const complaintHit = i.complaintCount > 400 ? -12 : i.complaintCount > 150 ? -8 : i.complaintCount > 50 ? -4 : 0;
  factors.push({ label: `${i.complaintCount} owner complaints filed with NHTSA`, delta: complaintHit });

  // Maintenance discipline.
  const overdueHit = -clamp(i.overdueCount * 5, 0, 20);
  if (i.overdueCount > 0) factors.push({ label: `${i.overdueCount} maintenance item${i.overdueCount > 1 ? "s" : ""} overdue`, delta: overdueHit });
  else factors.push({ label: "Maintenance up to date", delta: 0 });
  const dueSoonHit = -clamp(i.dueSoonCount * 2, 0, 6);
  if (i.dueSoonCount > 0) factors.push({ label: `${i.dueSoonCount} item${i.dueSoonCount > 1 ? "s" : ""} coming due`, delta: dueSoonHit });

  // Platform weak points active at this mileage.
  const weakHit = -clamp(
    i.weakPoints.reduce((sum, w) => sum + (w.severity === "major" ? 7 : w.severity === "moderate" ? 4 : 2), 0),
    0,
    21
  );
  if (i.weakPoints.length > 0) factors.push({ label: `${i.weakPoints.length} known trouble spot${i.weakPoints.length > 1 ? "s" : ""} for this platform`, delta: weakHit });

  const score = clamp(100 + recallHit + mileageHit + complaintHit + overdueHit + dueSoonHit + weakHit, 20, 100);

  const [label, color]: [HealthScore["label"], string] =
    score >= 90 ? ["Excellent", "var(--green)"]
    : score >= 80 ? ["Strong", "var(--green)"]
    : score >= 68 ? ["Fair", "var(--accent)"]
    : score >= 55 ? ["Needs attention", "var(--amber)"]
    : ["At risk", "var(--red)"];

  return { score, label, color, factors };
}
