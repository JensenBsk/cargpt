import { createClient } from "@supabase/supabase-js";

// Weekly cron: for every car saved in a garage, check NHTSA for recalls
// published in the last 8 days (7-day cadence + 1 day overlap, so no state
// table is needed) and push to that car's owner via OneSignal.
//
// Vercel cron invokes with GET. Fail closed without CRON_SECRET.

export const maxDuration = 60;

function parseNhtsaDate(raw: string | undefined): number | null {
  if (!raw) return null;
  // NHTSA serves either ISO (2026-06-24) or DD/MM/YYYY (24/06/2026)
  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) return iso;
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return Date.parse(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!url || !serviceKey) return Response.json({ sent: 0, reason: "Supabase not configured" });
  if (!restApiKey || !appId) return Response.json({ sent: 0, reason: "OneSignal not configured" });

  const supabase = createClient(url, serviceKey);
  const { data: cars, error } = await supabase
    .from("garage")
    .select("user_id, year, make, model")
    .limit(2000);
  if (error || !cars?.length) return Response.json({ sent: 0, cars: 0 });

  // One NHTSA lookup per distinct vehicle, fanned out to every owner.
  const byVehicle = new Map<string, { year: string; make: string; model: string; users: Set<string> }>();
  for (const c of cars) {
    if (!c.year || !c.make || !c.model || !c.user_id) continue;
    const key = `${c.year}|${String(c.make).toLowerCase()}|${String(c.model).toLowerCase()}`;
    const entry = byVehicle.get(key) ?? { year: String(c.year), make: c.make, model: c.model, users: new Set<string>() };
    entry.users.add(c.user_id);
    byVehicle.set(key, entry);
  }

  const windowMs = 8 * 86400_000;
  const now = Date.now();
  let sent = 0;

  for (const v of byVehicle.values()) {
    try {
      const res = await fetch(
        `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&modelYear=${v.year}`
      );
      const data = await res.json();
      const fresh = (data.results ?? []).filter((r: { ReportReceivedDate?: string }) => {
        const t = parseNhtsaDate(r.ReportReceivedDate);
        return t !== null && now - t < windowMs;
      });
      if (!fresh.length) continue;

      const subject: string = fresh[0].Subject ?? "Safety recall issued";
      const carName = `${v.year} ${v.make} ${v.model}`;
      for (const userId of v.users) {
        const push = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${restApiKey}` },
          body: JSON.stringify({
            app_id: appId,
            filters: [{ field: "tag", key: "user_id", relation: "=", value: userId }],
            headings: { en: `New recall on your ${carName}` },
            contents: { en: `${subject} — the repair is free at any dealer. Tap for details.` },
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://mchaniccarlos.com"}/diagnose?tab=garage`,
          }),
        });
        if (push.ok) sent++;
      }
    } catch {
      // One vehicle failing must not kill the sweep.
    }
  }

  return Response.json({ sent, vehicles: byVehicle.size });
}
