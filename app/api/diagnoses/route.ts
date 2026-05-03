import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ diagnoses: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: diagnoses, error } = await supabase
    .from("diagnoses")
    .select("id, year, make, model, issue, created_at, diagnosis->driveSafety")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ diagnoses });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ saved: false });
  }

  const { year, make, model, issue, mods, hasTune, diagnosis, carId } = await request.json();

  const { data, error } = await supabase
    .from("diagnoses")
    .insert({
      user_id: user.id,
      car_id: carId || null,
      year: parseInt(year),
      make,
      model,
      issue,
      mods: mods || null,
      has_tune: hasTune || false,
      diagnosis,
    })
    .select("id")
    .single();

  if (error) return Response.json({ saved: false });
  return Response.json({ saved: true, id: data.id });
}
