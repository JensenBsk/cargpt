// Owner complaints filed with NHTSA for a vehicle, aggregated into the
// trouble areas owners actually report — the third leg of the "what the
// dealer knows" intel next to recalls and TSBs.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const year = searchParams.get("year");

  if (!make || !model || !year || !/^\d{4}$/.test(year)) {
    return Response.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    const counts = new Map<string, number>();
    for (const r of data.results || []) {
      for (const raw of String(r.components || "").split(",")) {
        const name = raw.trim();
        if (!name || name === "UNKNOWN OR OTHER") continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const topComponents = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return Response.json({ count: data.count ?? 0, topComponents });
  } catch (err) {
    console.error("Complaints fetch error:", err);
    return Response.json({ count: 0, topComponents: [] });
  }
}
