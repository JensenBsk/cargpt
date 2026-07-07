import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, isOptionalString, isValidUuid } from "@/lib/validate";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ sessions: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sessions, error } = await supabase
    .from("obd_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[obd-sessions] select error:", error.message);
    return Response.json({ error: "Could not load OBD2 history" }, { status: 500 });
  }
  return Response.json({ sessions });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  const limited = rateLimit(request, "obd-sessions", 20);
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { carId, vin, dtcCodes, freezeFrame, liveData, adapterName, clearedCodes } = await request.json();

  if (carId !== undefined && carId !== null && !isValidUuid(carId)) return badRequest("Invalid carId");
  if (!isOptionalString(vin, 17) || !isOptionalString(adapterName, 100)) return badRequest("Invalid field");
  if (!Array.isArray(dtcCodes) || dtcCodes.length > 50) return badRequest("Invalid dtcCodes");
  for (const c of dtcCodes) {
    if (typeof c !== "object" || typeof c.code !== "string" || c.code.length > 8) {
      return badRequest("Invalid dtcCodes");
    }
  }
  if (JSON.stringify({ freezeFrame, liveData }).length > 20_000) return badRequest("Payload too large");

  const { data, error } = await supabase
    .from("obd_sessions")
    .insert({
      user_id: user.id,
      car_id: carId || null,
      vin: vin || null,
      dtc_codes: dtcCodes,
      freeze_frame: freezeFrame ?? null,
      live_data: liveData ?? null,
      adapter_name: adapterName || null,
      cleared_codes: !!clearedCodes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[obd-sessions] insert error:", error.message);
    return Response.json({ error: "Could not save session" }, { status: 500 });
  }
  return Response.json({ saved: true, id: data.id });
}
