import { notFound } from "next/navigation";
import AnnoncesList from "@/components/AnnoncesList";
import VerifiedBadge from "@/components/VerifiedBadge";
import { createClient } from "@/lib/supabase/server";

export default async function CommunePage({
  params,
}: {
  params: Promise<{ commune: string }>;
}) {
  const { commune: slug } = await params;
  const supabase = await createClient();

  const { data: commune, error } = await supabase
    .from("communes")
    .select("*")
    .eq("slug", slug)
    .single();

  console.log("SLUG:", slug, "| COMMUNE:", commune?.nom, "| ERROR:", error?.message);

  if (!commune) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isResident = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("commune_residence_id")
      .eq("id", user.id)
      .single();
    isResident = profile?.commune_residence_id === commune.id;
  }

  const { data: annonces } = await supabase
    .from("annonces")
    .select("*, categories(*), profiles(full_name)")
    .eq("commune_id", commune.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: alertes } = await supabase
    .from("alertes_officielles")
    .select("*")
    .eq("commune_id", commune.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Coordonnées mairie : affichées uniquement si la commune est certifiée
  let coordonnees: any = null;
  if (commune.is_certified) {
    const { data } = await supabase
      .from("mairie_coordonnees")
      .select("*")
      .eq("commune_id", commune.id)
      .single();
    coordonnees = data;
  }

  // Vigilance : seuls les résidents déclarés reçoivent les signalements (RLS l'impose déjà
  // côté base, cette condition évite même l'appel réseau pour un visiteur).
  let vigilanceSignalements: any[] = [];
  let vigilanceCount = 0;
  if (isResident) {
    const { data } = await supabase
      .from("vigilance_signalements")
      .select("*")
      .eq("commune_id", commune.id)
      .order("created_at", { ascending: false })
      .limit(10);
    vigilanceSignalements = data ?? [];

    const { count } = await supabase
      .from("vigilance_members")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", commune.id);
    vigilanceCount = count ?? 0;
  }

  const { data: prosRaw } = await supabase
    .from("pro_zones")
    .select("pro_profiles(*)")
    .eq("commune_id", commune.id);

  const prosActifs = (prosRaw ?? [])
    .map((z: any) => z.pro_profiles)
    .filter((p: any) => p && p.subscription_status === "active");
  const prosPremium = prosActifs.filter((p: any) => p.subscription_plan === "premium");
  const prosVisibilite = prosActifs.filter((p: any) => p.subscription_plan === "visibilite");
  const prosEssentiel = prosActifs.filter((p: any) => p.subscription_plan === "essentiel");

  return (
    <main className="font-display">

      <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="rounded-3xl bg-gradient-to-br from-mint/20 to-sky/20 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-neutral-500">
              {commune.departement}
            </p>
            <h1 className="text-3xl font-extrabold flex items-center gap-2 flex-wrap">
              {commune.nom}
              {commune.is_certified && (
                <span className="text-xs bg-sky text-white px-3 py-1 rounded-full">
                  ✓ Commune certifiée
                </span>
              )}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {commune.population} habitants · {commune.code_postal}
            </p>
          </div>

          {/* Coordonnées mairie — réservé aux communes certifiées (abonnées) */}
          {commune.is_certified && coordonnees && (
            <div className="bg-white/80 backdrop-blur rounded-2xl px-5 py-4 md:min-w-[280px] border border-sky/20">
              <p className="text-[11px] font-bold uppercase text-sky mb-2">🏛️ Votre mairie</p>
              <div className="space-y-1.5 text-[13px] font-semibold text-ink/80">
                {coordonnees.adresse && <p>📍 {coordonnees.adresse}</p>}
                {coordonnees.telephone && (
                  <p>📞 <a href={`tel:${coordonnees.telephone.replace(/\s/g, "")}`} className="hover:text-sky transition">{coordonnees.telephone}</a></p>
                )}
                {coordonnees.email && (
                  <p>✉️ <a href={`mailto:${coordonnees.email}`} className="hover:text-sky transition break-all">{coordonnees.email}</a></p>
                )}
                {coordonnees.horaires && <p>🕐 {coordonnees.horaires}</p>}
                {coordonnees.site_web && (
                  <p>🌐 <a href={coordonnees.site_web} target="_blank" rel="noopener noreferrer" className="hover:text-sky transition break-all">{coordonnees.site_web.replace(/^https?:\/\//, "")}</a></p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pros Premium : bandeau sous l'en-tête commune */}
      {prosPremium.length > 0 && (
        <div className="mb-8 -mt-4">
          <div className={`grid gap-3 ${prosPremium.length === 1 ? "grid-cols-1" : prosPremium.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {prosPremium.map((p: any) => (
              <a
                key={p.id}
                href={`/pro/${p.id}`}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-amber-300 transition"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-lg flex-shrink-0">
                  🔨
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{p.business_name}</span>
                    {p.siret_verified && <VerifiedBadge />}
                  </p>
                  {p.tagline && (
                    <p className="text-xs text-neutral-500 truncate">{p.tagline}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
                  Pro mis en avant
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {annonces && annonces.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="text-2xl font-bold mb-2">{commune.nom} vient d'ouvrir</h2>
          <p className="text-neutral-500 mb-6">
            Aucune annonce pour l'instant. Soyez le premier à publier.
          </p>
          <a
            href="/publier"
            className="inline-block bg-coral text-white px-6 py-3 rounded-full font-bold"
          >
            ✨ Publier la première annonce
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <AnnoncesList annonces={(annonces as any) ?? []} />

          {/* Pros Essentiel : section sous le fil d'annonces */}
          {prosEssentiel.length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold mb-1">🛠️ Les pros près de chez vous</h4>
              <p className="text-[11px] font-bold text-amber-700/60 mb-3">Professionnels vérifiés · Sponsorisé</p>
              <div className="divide-y divide-amber-200/60">
                {prosEssentiel.map((p: any) => (
                  <a key={p.id} href={`/pro/${p.id}`} className="py-3 flex items-center gap-3 hover:bg-white/60 rounded-xl px-2 -mx-2 transition">
                    <div className="w-9 h-9 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-sm flex-shrink-0">💼</div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{p.business_name}</span>
                        {p.siret_verified && <VerifiedBadge />}
                      </p>
                      {p.tagline && <p className="text-xs text-neutral-500 truncate">{p.tagline}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold mb-1">📢 Alertes officielles</h4>
            {commune.is_certified && (
              <p className="text-[11px] font-bold text-sky mb-3">✓ Publiées par la mairie</p>
            )}
            {alertes?.map((al: any) => (
              <details key={al.id} className="py-1 border-b last:border-0 group">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-2 py-2">
                  <span className="text-sm font-semibold leading-snug">{al.title}</span>
                  <span className="text-sky text-base leading-none flex-shrink-0 transition group-open:rotate-45">＋</span>
                </summary>
                <div className="pb-3">
                  {al.photo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={al.photo_url} alt="" className="w-full rounded-xl object-cover mb-2 max-h-44" />
                  )}
                  {al.body && (
                    <p className="text-[13px] text-neutral-500 leading-relaxed mb-2">{al.body}</p>
                  )}
                  {(al.starts_at || al.ends_at) && (
                    <p className="text-[11px] font-bold text-neutral-400">
                      {al.starts_at && `📅 Du ${new Date(al.starts_at).toLocaleDateString("fr-FR")}`}
                      {al.ends_at && ` au ${new Date(al.ends_at).toLocaleDateString("fr-FR")}`}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-neutral-300 mt-1">
                    Publiée le {new Date(al.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </details>
            ))}
            {(!alertes || alertes.length === 0) && (
              <p className="text-sm text-neutral-400">Aucune alerte pour le moment.</p>
            )}
          </div>

          {/* Vigilance : rendu conditionnel strict, RLS bloque déjà les données côté serveur */}
          {isResident ? (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
              <h4 className="font-bold mb-3">👀 Vigilance de quartier</h4>
              <p className="text-xs font-bold text-red-800 mb-3">
                {vigilanceCount} habitants membres de la vigilance
              </p>
              {vigilanceSignalements.map((s) => (
                <div key={s.id} className="text-sm py-2 border-b last:border-0">
                  <p className="font-semibold">{s.title}</p>
                </div>
              ))}
              <div className="mt-3 text-xs bg-red-600 text-white rounded-xl p-3">
                🚨 En cas d'urgence réelle, composez le 17 ou le 112. Ce réseau ne
                remplace jamais les secours.
              </div>
            </div>
          ) : (
            <div className="bg-neutral-100 rounded-2xl p-5 text-center">
              <h4 className="font-bold mb-2">👀 Vigilance de quartier</h4>
              <p className="text-xs text-neutral-500">
                🔒 Réservé aux habitants déclarés de {commune.nom}.
              </p>
            </div>
          )}

          {/* Pros Visibilité : encart sidebar sous la vigilance */}
          {prosVisibilite.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 shadow-sm border border-amber-200">
              <h4 className="font-bold mb-1">🔨 Pros du quartier</h4>
              <p className="text-[11px] font-bold text-amber-700/60 mb-3">Sponsorisé</p>
              {prosVisibilite.map((p: any) => (
                <a key={p.id} href={`/pro/${p.id}`} className="block py-2.5 border-b last:border-0 hover:bg-white/60 rounded-xl px-2 -mx-2 transition">
                  <p className="font-bold text-sm flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{p.business_name}</span>
                    {p.siret_verified && <VerifiedBadge />}
                  </p>
                  {p.tagline && <p className="text-xs text-neutral-500 mt-0.5">{p.tagline}</p>}
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
      </div>
    </main>
  );
}
