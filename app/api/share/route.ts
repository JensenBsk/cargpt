import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { diagnosis, year, make, model, issue } = await request.json();

  if (!diagnosis || !year || !make || !model) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { userId } = await auth();
  const token = Math.random().toString(36).substring(2, 10);
  const diagnosisJson = typeof diagnosis === "string" ? JSON.parse(diagnosis) : diagnosis;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_diagnoses")
    .insert({
      token,
      diagnosis_json: diagnosisJson,
      car_year: year,
      car_make: make,
      car_model: model,
      code_or_symptom: issue || "",
      created_by: userId ?? null,
    })
    .select("token")
    .single();

  if (error) {
    console.error("[share] insert error:", error.message, error.details);
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

  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_diagnoses")
    .select("view_count")
    .eq("token", token)
    .single();

  if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ views: data.view_count });
}
