// Import de toutes les communes de France dans Supabase
// Source : API officielle geo.api.gouv.fr (données INSEE/DGCL)
// Usage : node scripts/import-communes.mjs
// Requiert dans .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// --- Charger .env.local à la main (pas de dépendance dotenv) ---
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  console.log("Pas de .env.local trouvé, on suppose les variables déjà exportées.");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

// Service role : bypasse le RLS, réservé aux scripts serveur
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function slugify(s) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const DEPARTEMENTS = {}; // rempli via l'API pour avoir les noms

async function main() {
  console.log("📡 Récupération des départements...");
  const depsRes = await fetch("https://geo.api.gouv.fr/departements?fields=nom,code,codeRegion");
  const deps = await depsRes.json();
  for (const d of deps) DEPARTEMENTS[d.code] = d.nom;

  const regsRes = await fetch("https://geo.api.gouv.fr/regions?fields=nom,code");
  const regs = await regsRes.json();
  const REGIONS = Object.fromEntries(regs.map((r) => [r.code, r.nom]));

  console.log("📡 Récupération des communes (ça prend quelques secondes)...");
  const res = await fetch(
    "https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,population,centre,codeDepartement,codeRegion&format=json"
  );
  const communes = await res.json();
  console.log(`✅ ${communes.length} communes récupérées.`);

  // --- Gestion des slugs en doublon (communes homonymes) ---
  const slugCount = {};
  for (const c of communes) {
    const s = slugify(c.nom);
    slugCount[s] = (slugCount[s] || 0) + 1;
  }

  const rows = communes.map((c) => {
    let slug = slugify(c.nom);
    // Homonymes : suffixer avec le code département (ex: saint-martin-32)
    if (slugCount[slug] > 1) slug = `${slug}-${c.codeDepartement}`;
    return {
      code_insee: c.code,
      nom: c.nom,
      slug,
      code_postal: c.codesPostaux?.[0] ?? null,
      departement: DEPARTEMENTS[c.codeDepartement] ?? c.codeDepartement,
      region: REGIONS[c.codeRegion] ?? null,
      population: c.population ?? null,
      lat: c.centre?.coordinates?.[1] ?? null,
      lng: c.centre?.coordinates?.[0] ?? null,
    };
  });

  // Vérifier l'unicité finale des slugs (sécurité)
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.slug)) {
      r.slug = `${r.slug}-${r.code_insee}`;
    }
    seen.add(r.slug);
  }

  // --- Insertion par lots de 500 (upsert sur code_insee) ---
  console.log("⬆️  Insertion dans Supabase par lots de 500...");
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("communes")
      .upsert(batch, { onConflict: "code_insee", ignoreDuplicates: false });
    if (error) {
      console.error(`❌ Erreur lot ${i}-${i + batch.length}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r   ${inserted}/${rows.length} communes`);
  }

  console.log("\n🎉 Import terminé.");

  // --- Renseigner la géométrie PostGIS ---
  console.log("🗺️  Mise à jour de la géométrie PostGIS...");
  const { error: geomError } = await supabase.rpc("update_communes_geom");
  if (geomError) {
    console.log(
      "⚠️  RPC update_communes_geom absente. Exécute ce SQL manuellement dans Supabase :\n" +
        "   update communes set geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography where lat is not null;"
    );
  } else {
    console.log("✅ Géométrie renseignée.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
