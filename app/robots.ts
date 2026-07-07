import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Shared diagnoses are user content behind unguessable tokens;
        // API routes have no crawlable value.
        disallow: ["/api/", "/r/", "/auth/"],
      },
    ],
    sitemap: "https://mchaniccarlos.com/sitemap.xml",
  };
}
