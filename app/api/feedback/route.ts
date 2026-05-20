import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const { userId } = await auth();
  const { diagnosisId, resolved, actualFix } = await request.json();

  if (!diagnosisId || resolved === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const record: Record<string, unknown> = {
    diagnosis_id: diagnosisId,
    resolved,
    actual_fix: actualFix || null,
  };
  if (userId) record.user_id = userId;

  const supabase = createClient();
  const { error } = await supabase.from("diagnosis_feedback").upsert(record);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ saved: true });
}
