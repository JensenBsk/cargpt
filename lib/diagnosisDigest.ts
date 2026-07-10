// Compact plain-text form of a diagnosis for chat context. The follow-up
// chat used to seed history with JSON.stringify(diagnosis); rich diagnoses
// crossed the server's per-message limit and every chat call bounced with
// "Invalid conversation history". This digest keeps everything Carlos needs
// to answer follow-ups at a fraction of the size, and reads like something
// an assistant actually said.

import type { Diagnostic } from "@/types/diagnostic";

const clip = (s: string | undefined | null, max: number) =>
  !s ? "" : s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;

export function diagnosisDigest(diag: Diagnostic): string {
  const lines: string[] = [];

  lines.push(clip(diag.whatsWrong, 400));
  lines.push(`Safety: ${diag.driveSafety.verdict} — ${clip(diag.driveSafety.reason, 200)}`);

  const causes = (diag.rankedCauses ?? []).slice(0, 5)
    .map((c) => `${c.rank}. ${c.cause} (${c.likelihood}${c.confidence != null ? `, ${c.confidence}%` : ""})`);
  if (causes.length) lines.push(`Ranked causes:\n${causes.join("\n")}`);

  const steps = (diag.diagnosticSteps ?? []).slice(0, 6)
    .map((s) => `${s.step}. ${clip(s.action, 90)}${s.tools && s.tools !== "None" ? ` [${clip(s.tools, 40)}]` : ""}`);
  if (steps.length) lines.push(`Diagnostic steps:\n${steps.join("\n")}`);

  const costs = (diag.costEstimates ?? []).slice(0, 4)
    .map((e) => `${clip(e.fix, 60)}: ${e.total}`);
  if (costs.length) lines.push(`Cost estimates: ${costs.join("; ")}`);

  const parts = (diag.partsNeeded ?? []).slice(0, 4)
    .map((p) => `${clip(p.partName, 60)}${p.oemPartNumber ? ` (OEM ${p.oemPartNumber})` : ""}`);
  if (parts.length) lines.push(`Parts: ${parts.join("; ")}`);

  if (diag.mechanicEscalation?.needed) {
    lines.push(`Mechanic recommended: ${clip(diag.mechanicEscalation.reason, 200)}`);
  }

  // Hard ceiling far below the server's per-message limit.
  return clip(lines.join("\n\n"), 3500);
}
