import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, isOptionalString, isValidUuid } from "@/lib/validate";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const limited = rateLimit(request, "feedback", 20);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { diagnosisId, resolved, actualFix } = await request.json();

  if (!isValidUuid(diagnosisId) || typeof resolved !== "boolean" || !isOptionalString(actualFix, 500)) {
    return badRequest("Missing or invalid fields");
  }

  const record: Record<string, unknown> = {
    diagnosis_id: diagnosisId,
    resolved,
    actual_fix: actualFix || null,
  };
  if (user) record.user_id = user.id;

  const { error } = await supabase
    .from("diagnosis_feedback")
    .upsert(record, { onConflict: "diagnosis_id,user_id" });

  if (error) {
    console.error("[feedback] upsert error:", error.message);
    return Response.json({ error: "Could not save feedback" }, { status: 500 });
  }
  return Response.json({ saved: true });
}
