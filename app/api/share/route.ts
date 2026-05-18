import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { diagnosis, year, make, model, issue } = body;

  if (!diagnosis || !year || !make || !model) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use service role key to bypass RLS; fall back to anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey);

  // Get authenticated user from the request cookies (doesn't block insert)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* not signed in — fine */ }

  const token = Math.random().toString(36).substring(2, 10);

  // Ensure diagnosis_json is an object, not a string
  const diagnosisJson =
    typeof diagnosis === "string" ? JSON.parse(diagnosis) : diagnosis;

  const { data, error } = await db
    .from("shared_diagnoses")
    .insert({
      token,
      diagnosis_json: diagnosisJson,
      car_year: year,
      car_make: make,
      car_model: model,
      code_or_symptom: issue || "",
      created_by: userId,
    })
    .select("token")
    .single();

  if (error) {
    console.error("[share] Insert failed:", error.message, error.details, error.hint);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ token: data.token });
}

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey);

  const { data, error } = await db
    .from("shared_diagnoses")
    .select("view_count")
    .eq("token", token)
    .single();

  if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ views: data.view_count });
}
