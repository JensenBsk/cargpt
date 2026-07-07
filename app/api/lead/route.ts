import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, isOptionalString } from "@/lib/validate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const limited = rateLimit(request, "lead", 10);
  if (limited) return limited;

  const { email, source, vehicle } = await request.json();

  if (typeof email !== "string" || email.length > 254 || !EMAIL_RE.test(email.trim())) {
    return badRequest("Enter a valid email address");
  }
  const src = ["report", "landing", "pricing"].includes(source) ? source : "report";
  if (!isOptionalString(vehicle, 80)) return badRequest("Invalid vehicle");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ saved: false });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      email: email.trim().toLowerCase(),
      source: src,
      vehicle: vehicle || null,
    });
    // Duplicate email+source = already subscribed = success from the user's view.
    if (error && error.code !== "23505") {
      console.error("[lead]", error.message);
      return Response.json({ saved: false });
    }
    return Response.json({ saved: true });
  } catch {
    return Response.json({ saved: false });
  }
}
