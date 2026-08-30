import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import VerifiedBadge from "@/components/VerifiedBadge";

const RADIUS: Record<string, number> = { essentiel: 10, visibilite: 25, premium: 50 };

export default async function FicheProPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("pro_profiles")
    .select("*, profiles(full_name, avatar_url), communes:base_commune_id (nom, slug, departement)")
    .eq("id", id)
    .single();

  if (!pro || pro.subscription_status !== "active") notFound();

  const { data: services } = await supabase
    .from("pro_services")
    .select("*")
    .eq("pro_id", id);

  const { count: zoneCount } = await supabase
    .from("pro_zones")
    .select("*", { count: "exact", head: true })
    .eq("pro_id", id);

  const base = pro.communes;
  const radius = RADIUS[pro.subscription_plan ?? "essentiel"] ?? 10;
  const initial = pro.business_name.charAt(0).toUpperCase();

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-6">
        {base && (
          <a
            href={`/${base.slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-coral transition mb-6"
          >
            ← Retour à {base.nom}
          </a>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* ===== Colonne principale ===== */}
          <div className="md:col-span-2 space-y-6">
            {/* En-tête pro */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-8">
              <div className="flex items-start gap-5">
                {pro.profiles?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pro.profiles.avatar_url}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-contain bg-white border border-amber-200 p-1 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white border border-amber-200 text-amber-700 text-2xl font-extrabold flex items-center justify-center flex-shrink-0">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold flex items-center gap-2">
                    <span className="truncate">{pro.business_name}</span>
                    {pro.siret_verified && <VerifiedBadge size={20} />}
                  </h1>
                  {pro.tagline && (
                    <p className="text-sm font-semibold text-neutral-600 mt-1">{pro.tagline}</p>
                  )}
                  {pro.siret_verified && (
                    <p className="text-[11px] font-bold text-mint mt-2">
                      ✓ Pro vérifié — SIRET contrôlé par onsentraide.fr
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Présentation */}
            {pro.description && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
                <h2 className="font-bold text-lg mb-3">À propos</h2>
                <p className="text-neutral-600 font-body leading-relaxed whitespace-pre-line">
                  {pro.description}
                </p>
              </div>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
                <h2 className="font-bold text-lg mb-5">🛠️ Services et tarifs</h2>
                <div className="space-y-2.5">
                  {services.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-4 border border-neutral-100 rounded-2xl px-5 py-4"
                    >
                      <p className="font-bold text-sm">{s.label}</p>
                      <p className="text-sm font-bold text-coral-dark flex-shrink-0 text-right">
                        {s.price_from != null ? `dès ${s.price_from}€` : "Sur devis"}
                        {s.price_note && (
                          <span className="block text-[11px] text-neutral-400 font-semibold">
                            {s.price_note}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-300 font-body font-semibold mt-4">
                  Tarifs indicatifs communiqués par le professionnel. Demandez toujours un devis.
                </p>
              </div>
            )}

            {/* Zone */}
            {base && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
                <h2 className="font-bold text-lg mb-3">📍 Zone d&apos;intervention</h2>
                <p className="text-sm text-neutral-600 font-body">
                  Intervient dans un rayon de <strong>{radius} km</strong> autour de{" "}
                  <strong>{base.nom}</strong> ({base.departement})
                  {zoneCount ? <>, soit <strong>{zoneCount} communes couvertes</strong>.</> : "."}
                </p>
              </div>
            )}
          </div>

          {/* ===== Colonne contact ===== */}
          <aside className="space-y-5 md:sticky md:top-28">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
              <h3 className="font-bold mb-4">📞 Contacter</h3>
              <div className="space-y-3">
                {pro.telephone && (
                  <a
                    href={`tel:${pro.telephone.replace(/\s/g, "")}`}
                    className="block text-center bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition"
                  >
                    📞 {pro.telephone}
                  </a>
                )}
                {pro.email && (
                  <a
                    href={`mailto:${pro.email}`}
                    className="block text-center border-2 border-ink text-ink font-bold py-3.5 rounded-full hover:bg-ink hover:text-white transition text-sm"
                  >
                    ✉️ Envoyer un email
                  </a>
                )}
                {pro.site_web && (
                  <a
                    href={pro.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm font-bold text-sky hover:underline py-1"
                  >
                    🌐 {pro.site_web.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {!pro.telephone && !pro.email && !pro.site_web && (
                  <p className="text-sm text-neutral-400 font-body font-semibold text-center py-2">
                    Ce professionnel n&apos;a pas encore renseigné ses coordonnées.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-sky/10 border border-sky/20 rounded-3xl p-5">
              <h3 className="text-sm font-bold mb-2">💡 Bon réflexe</h3>
              <p className="text-xs text-neutral-500 font-body font-semibold leading-relaxed">
                Demandez un devis écrit avant toute intervention, et ne payez jamais
                l&apos;intégralité en avance.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
