import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ cars: [] });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const { data: cars, error } = await supabase
    .from("garage")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ cars });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "DB not configured" }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, make, model, vin, mods, hasTune, nickname } = await request.json();

  if (!year || !make || !model) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: car, error } = await supabase
    .from("garage")
    .insert({
      user_id: userId,
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

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ car });
}

export async function DELETE(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ error: "DB not configured" }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  const supabase = createClient();

  const { error } = await supabase
    .from("garage")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
