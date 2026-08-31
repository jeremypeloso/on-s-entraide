import type { MetadataRoute } from "next";
import { createClient as createSupabase } from "@supabase/supabase-js";

// Client anonyme sans cookies : le sitemap est calculé au build, hors requête HTTP
function db() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

const SITE = "https://onseditout.fr";
const CHUNK = 5000;

// Next appelle generateSitemaps pour connaître les tranches, puis sitemap({ id }) pour chacune.
// URL résultantes : /sitemap/0.xml, /sitemap/1.xml, ...
export async function generateSitemaps() {
  const supabase = db();
  const { count } = await supabase.from("communes").select("*", { count: "exact", head: true });
  const n = Math.max(1, Math.ceil((count ?? 0) / CHUNK));
  return Array.from({ length: n }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const supabase = db();
  const entries: MetadataRoute.Sitemap = [];

  if (id === 0) {
    for (const p of ["", "/pro", "/mairies", "/contact", "/a-propos", "/cgu", "/mentions-legales", "/confidentialite"]) {
      entries.push({ url: `${SITE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 });
    }
  }

  const from = id * CHUNK;
  const { data } = await supabase
    .from("communes")
    .select("slug, is_certified, population")
    .order("population", { ascending: false, nullsFirst: false })
    .range(from, from + CHUNK - 1);

  for (const c of data ?? []) {
    entries.push({
      url: `${SITE}/${c.slug}`,
      changeFrequency: "daily",
      priority: c.is_certified ? 0.9 : (c.population ?? 0) > 5000 ? 0.7 : 0.5,
    });
  }
  return entries;
}