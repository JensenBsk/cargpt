import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { diagnosisId, resolved, actualFix } = await request.json();

  if (!diagnosisId || resolved === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("diagnosis_feedback")
    .upsert({
      diagnosis_id: diagnosisId,
      user_id: user.id,
      resolved,
      actual_fix: actualFix || null,
    });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ saved: true });
}
