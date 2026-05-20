import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ diagnoses: [] });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const { data: diagnoses, error } = await supabase
    .from("diagnoses")
    .select("id, year, make, model, issue, created_at, diagnosis->driveSafety")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ diagnoses });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ saved: false });
  }

  const { year, make, model, issue, mods, hasTune, diagnosis, carId } = await request.json();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("diagnoses")
    .insert({
      user_id: userId,
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
