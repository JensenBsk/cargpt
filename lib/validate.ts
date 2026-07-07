// Server-side input validation shared by API routes.
// Every user-supplied field that reaches Anthropic or Supabase goes through here.

const CURRENT_YEAR = new Date().getFullYear();

export const LIMITS = {
  issue: 4000,
  quote: 4000,
  message: 2000,
  mods: 600,
  makeModel: 60,
  nickname: 60,
  vin: 17,
  historyMessages: 24,
  historyMessageChars: 6000,
  // ~4.5MB of raw image after base64 decoding (base64 inflates ~4/3)
  imageBase64Chars: 6_500_000,
  refinement: 2000,
  audioTranscript: 2000,
  tsbContext: 3000,
  obdDatalog: 2500,
} as const;

export function isValidYear(year: unknown): boolean {
  const n = Number(year);
  return Number.isInteger(n) && n >= 1950 && n <= CURRENT_YEAR + 2;
}

export function isValidZip(zip: unknown): boolean {
  return typeof zip === "string" && /^\d{5}$/.test(zip);
}

export function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= maxLen;
}

export function isOptionalString(v: unknown, maxLen: number): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.length <= maxLen);
}

export function isValidUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

/** data-URL or bare base64 image payload, size-capped. */
export function isValidImagePayload(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v !== "string" || v.length === 0 || v.length > LIMITS.imageBase64Chars) return false;
  const base64 = v.includes(",") ? v.split(",")[1] : v;
  return /^[A-Za-z0-9+/=\s]+$/.test(base64.slice(0, 1000));
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Sanitize a client-supplied conversation history before forwarding to the
 * model: only user/assistant roles, string content, bounded count and size.
 * Returns null when the shape is invalid.
 */
export function sanitizeHistory(history: unknown): ChatMessage[] | null {
  if (history === undefined || history === null) return [];
  if (!Array.isArray(history)) return null;
  if (history.length > LIMITS.historyMessages) return null;
  const out: ChatMessage[] = [];
  for (const m of history) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.length > LIMITS.historyMessageChars) return null;
    out.push({ role, content });
  }
  return out;
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

/** Validate the common vehicle triple. Returns an error Response or null. */
export function validateVehicle(year: unknown, make: unknown, model: unknown): Response | null {
  if (!isValidYear(year)) return badRequest("Enter a valid model year.");
  if (!isNonEmptyString(make, LIMITS.makeModel)) return badRequest("Enter a valid make.");
  if (!isNonEmptyString(model, LIMITS.makeModel)) return badRequest("Enter a valid model.");
  return null;
}
