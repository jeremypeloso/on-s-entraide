import { notFound } from "next/navigation";
import CommuneTabs from "@/components/CommuneTabs";
import { createClient } from "@/lib/supabase/server";

export default async function CommunePage({
  params,
}: {
  params: Promise<{ commune: string }>;
}) {
  const { commune: slug } = await params;
  const supabase = await createClient();

  const { data: commune } = await supabase
    .from("communes")
    .select("id, nom, slug, departement, code_postal, population, is_certified")
    .eq("slug", slug)
    .single();

  if (!commune) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let isResident = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("commune_residence_id")
      .eq("id", user.id)
      .single();
    isResident = profile?.commune_residence_id === commune.id;
  }

  const [
    { data: annonces },
    { data: alertes },
    { data: evenements },
    { data: prosRaw },
    { data: associations },
  ] = await Promise.all([
    supabase
      .from("annonces")
      .select("*, categories(*), profiles(full_name)")
      .eq("commune_id", commune.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("alertes_officielles")
      .select("*")
      .eq("commune_id", commune.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("evenements")
      .select("*")
      .eq("commune_id", commune.id)
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(30),
    supabase
      .from("pro_zones")
      .select("pro_profiles(*)")
      .eq("commune_id", commune.id),
    supabase
      .from("associations")
      .select("id, nom, categorie, description, logo_url, is_verified")
      .eq("commune_id", commune.id)
      .eq("is_verified", true)
      .order("nom"),
  ]);

  // Événements : ceux des associations non validées restent privés
  const assosOk = new Set((associations ?? []).map((a: any) => a.id));
  const evenementsPublics = (evenements ?? []).filter(
    (e: any) => e.organisateur_type !== "association" || assosOk.has(e.association_id)
  );

  // Coordonnées mairie : uniquement pour les communes certifiées
  let coordonnees: any = null;
  if (commune.is_certified) {
    const { data } = await supabase
      .from("mairie_coordonnees")
      .select("*")
      .eq("commune_id", commune.id)
      .single();
    coordonnees = data;
  }

  const seen = new Set<string>();
  const prosActifs = (prosRaw ?? [])
    .map((z: any) => z.pro_profiles)
    .filter((p: any) => {
      if (!p || p.subscription_status !== "active" || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  // Notes moyennes des pros affichés
  const proIds = prosActifs.map((p: any) => p.id);
  if (proIds.length > 0) {
    const { data: rv } = await supabase.from("pro_reviews").select("pro_id, rating").in("pro_id", proIds);
    const agg: Record<string, { s: number; n: number }> = {};
    for (const r of rv ?? []) {
      agg[r.pro_id] = agg[r.pro_id] ?? { s: 0, n: 0 };
      agg[r.pro_id].s += r.rating; agg[r.pro_id].n += 1;
    }
    for (const p of prosActifs) {
      const a = agg[p.id];
      p.rating_avg = a ? a.s / a.n : null;
      p.rating_count = a ? a.n : 0;
    }
  }

  return (
    <CommuneTabs
      commune={commune}
      coordonnees={coordonnees}
      annonces={annonces ?? []}
      prosPremium={prosActifs.filter((p: any) => p.subscription_plan === "premium")}
      prosVisibilite={prosActifs.filter((p: any) => p.subscription_plan === "visibilite")}
      prosEssentiel={prosActifs.filter((p: any) => p.subscription_plan === "essentiel")}
      alertes={alertes ?? []}
      evenements={evenementsPublics}
      associations={associations ?? []}
      isResident={isResident}
    />
  );
}
