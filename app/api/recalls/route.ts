export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const year = searchParams.get("year");

  if (!make || !model || !year) {
    return Response.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    const data = await res.json();

    const recalls = (data.results || []).map((r: {
      NHTSACampaignNumber: string;
      Subject: string;
      Summary: string;
      Consequence: string;
      Remedy: string;
      Component: string;
      ReportReceivedDate: string;
    }) => ({
      campaignNumber: r.NHTSACampaignNumber,
      subject: r.Subject,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      component: r.Component,
      date: r.ReportReceivedDate,
    }));

    return Response.json({ count: recalls.length, recalls });
  } catch (err) {
    console.error("Recalls fetch error:", err);
    return Response.json({ count: 0, recalls: [] });
  }
}
