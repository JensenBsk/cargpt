import { createClient } from "@/lib/supabase/server";
import { LIMITS, badRequest, isOptionalString, isValidUuid, validateVehicle } from "@/lib/validate";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ cars: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cars, error } = await supabase
    .from("garage")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[garage] select error:", error.message);
    return Response.json({ error: "Could not load garage" }, { status: 500 });
  }
  return Response.json({ cars });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, make, model, vin, mods, hasTune, nickname } = await request.json();

  const vehicleError = validateVehicle(year, make, model);
  if (vehicleError) return vehicleError;
  if (!isOptionalString(vin, LIMITS.vin) || !isOptionalString(mods, LIMITS.mods) || !isOptionalString(nickname, LIMITS.nickname)) {
    return badRequest("Invalid field value.");
  }

  const { data: car, error } = await supabase
    .from("garage")
    .insert({
      user_id: user.id,
      year: parseInt(year),
      make,
      model,
      vin: vin || null,
      mods: mods || null,
      has_tune: hasTune || false,
      nickname: nickname || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[garage] insert error:", error.message);
    return Response.json({ error: "Could not save car" }, { status: 500 });
  }
  return Response.json({ car });
}

export async function DELETE(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!isValidUuid(id)) return badRequest("Invalid id");

  const { error } = await supabase
    .from("garage")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[garage] delete error:", error.message);
    return Response.json({ error: "Could not delete car" }, { status: 500 });
  }
  return Response.json({ success: true });
}
