// Model routing. Primary diagnoses always get Sonnet: Haiku is fine at
// generic OBD patterns but confidently wrong on platform specifics (real
// case: told an Audi S3 owner to replace a fuel filter the 8V doesn't
// have, and to drop the tank for a pump that lives under the rear seat).
// Accuracy is the product — the ~$0.03/diagnosis delta is worth it.
// Haiku only handles short follow-up chat, where the existing diagnosis
// anchors it.
// Lives in lib (not a route file) — Next.js route modules may only export
// HTTP handlers and route segment config.

export function selectModel(params: {
  hasImage?: boolean;
  isModified?: boolean;
  hasMultipleCodes?: boolean;
  isFollowUp?: boolean;
  followUpLength?: number;
  hasAudioTranscript?: boolean;
  hasEnginePhoto?: boolean;
}): string {
  if (params.isFollowUp && (params.followUpLength ?? 0) <= 150) {
    return "claude-haiku-4-5-20251001";
  }
  return "claude-sonnet-4-6";
}
