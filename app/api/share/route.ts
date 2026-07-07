import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, validateVehicle } from "@/lib/validate";

// 96 bits of entropy, URL-safe — share tokens must not be guessable.
function generateShareToken(): string {
  return randomBytes(12).toString("base64url");
}

const MAX_DIAGNOSIS_JSON_BYTES = 100_000;

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Sharing unavailable" }, { status: 503 });
  }

  const limited = rateLimit(request, "share", 10);
  if (limited) return limited;

  const { diagnosis, year, make, model, issue } = await request.json();

  if (!diagnosis) return badRequest("Missing diagnosis");
  const vehicleError = validateVehicle(year, make, model);
  if (vehicleError) return vehicleError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const token = generateShareToken();
  let diagnosisJson: unknown;
  try {
    diagnosisJson = typeof diagnosis === "string" ? JSON.parse(diagnosis) : diagnosis;
  } catch {
    return badRequest("Invalid diagnosis payload");
  }
  if (JSON.stringify(diagnosisJson).length > MAX_DIAGNOSIS_JSON_BYTES) {
    return badRequest("Diagnosis payload too large");
  }

  const { data, error } = await supabase
    .from("shared_diagnoses")
    .insert({
      token,
      diagnosis_json: diagnosisJson,
      car_year: year,
      car_make: make,
      car_model: model,
      code_or_symptom: typeof issue === "string" ? issue.slice(0, 500) : "",
      created_by: user?.id ?? null,
    })
    .select("token")
    .single();

  if (error) {
    console.error("[share] insert error:", error.message, error.details);
    return Response.json({ error: "Could not create share link. Please try again." }, { status: 500 });
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shared_diagnoses")
    .select("view_count")
    .eq("token", token)
    .single();

  if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ views: data.view_count });
}
