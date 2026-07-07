// Model routing: Sonnet for vision/complex jobs, Haiku for everything else.
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
  if (params.hasImage || params.hasEnginePhoto) return "claude-sonnet-4-6";
  if (params.hasAudioTranscript) return "claude-sonnet-4-6";
  if (params.isModified || params.hasMultipleCodes) return "claude-sonnet-4-6";
  if ((params.followUpLength ?? 0) > 150) return "claude-sonnet-4-6";
  if (params.isFollowUp) return "claude-haiku-4-5-20251001";
  return "claude-haiku-4-5-20251001";
}
