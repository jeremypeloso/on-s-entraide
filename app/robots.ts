import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/compte", "/maintenance", "/pro/espace", "/association/espace", "/mairie"] },
    ],
    sitemap: Array.from({ length: 8 }, (_, i) => `https://onseditout.fr/sitemap/${i}.xml`),
    host: "https://onseditout.fr",
  };
}
