// Technical Service Bulletins (NHTSA "manufacturer communications") for a
// vehicle — the fix procedures dealers already have. Two-step public API:
// vehicles/bySearch resolves year/make/model to NHTSA vehicle ids (one per
// trim), then vehicles/{id}/details returns the bulletins.

const API = "https://api.nhtsa.gov";

interface NhtsaComm {
  manufacturerCommunicationNumber: string;
  nhtsaIdNumber: number;
  subject: string | null;
  summary: string | null;
  communicationDate: string | null;
  components?: { name: string }[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const year = searchParams.get("year");

  if (!make || !model || !year || !/^\d{4}$/.test(year)) {
    return Response.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    const query = encodeURIComponent(`${year} ${make} ${model}`.toUpperCase());
    const searchRes = await fetch(
      `${API}/vehicles/bySearch?query=${query}&productDetail=minimal&data=none&max=4`,
      { next: { revalidate: 86400 } }
    );
    const search = await searchRes.json();
    const wantedModel = model.trim().toUpperCase();
    const ids: number[] = (search.results || [])
      .filter((v: { modelYear: number; make: string; vehicleModel: string }) =>
        String(v.modelYear) === year && v.vehicleModel?.toUpperCase() === wantedModel)
      .map((v: { vehicleId: number }) => v.vehicleId)
      .slice(0, 2); // trims share almost all bulletins — two covers 2WD/4WD splits

    if (ids.length === 0) return Response.json({ count: 0, tsbs: [] });

    const details = await Promise.all(
      ids.map((id) =>
        fetch(`${API}/vehicles/${id}/details?data=manufacturercommunications&productDetail=minimal`, {
          next: { revalidate: 86400 },
        })
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    const byNhtsaId = new Map<number, NhtsaComm>();
    for (const d of details) {
      const comms: NhtsaComm[] = d?.results?.[0]?.safetyIssues?.manufacturerCommunications ?? [];
      for (const c of comms) {
        if (c.nhtsaIdNumber && !byNhtsaId.has(c.nhtsaIdNumber)) byNhtsaId.set(c.nhtsaIdNumber, c);
      }
    }

    const tsbs = [...byNhtsaId.values()]
      .map((c) => ({
        number: c.manufacturerCommunicationNumber,
        nhtsaId: c.nhtsaIdNumber,
        summary: c.subject || c.summary || "",
        date: c.communicationDate,
        component: c.components?.[0]?.name ?? "",
      }))
      .filter((t) => t.summary)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    return Response.json({ count: tsbs.length, tsbs: tsbs.slice(0, 60) });
  } catch (err) {
    console.error("TSB fetch error:", err);
    return Response.json({ count: 0, tsbs: [] });
  }
}
