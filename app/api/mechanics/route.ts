import { rateLimit } from "@/lib/rateLimit";
import { isValidZip } from "@/lib/validate";

export async function GET(request: Request) {
  const limited = rateLimit(request, "mechanics", 20);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");
  const make = (searchParams.get("make") || "").slice(0, 40);

  if (!zip || !isValidZip(zip)) return Response.json({ error: "Valid 5-digit ZIP required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return Response.json({ shops: [], missing: true });

  const isBrand = ["bmw", "mercedes", "audi", "porsche", "volvo", "lexus", "acura", "infiniti"].includes(
    make.toLowerCase()
  );
  const query = isBrand
    ? `${make} specialist auto repair near ${zip}`
    : `auto repair shop near ${zip}`;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    const shops = (data.results || []).slice(0, 3).map((p: {
      name: string;
      rating?: number;
      user_ratings_total?: number;
      formatted_address?: string;
      place_id: string;
      geometry?: { location: { lat: number; lng: number } };
    }) => ({
      name: p.name,
      rating: p.rating,
      reviewCount: p.user_ratings_total,
      address: p.formatted_address,
      placeId: p.place_id,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));

    return Response.json({ shops });
  } catch (err) {
    console.error("Mechanics fetch error:", err);
    return Response.json({ shops: [] });
  }
}
