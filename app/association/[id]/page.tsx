import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { assoCat } from "@/lib/associations";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export default async function FicheAssociationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: asso } = await supabase
    .from("associations")
    .select("*, communes(nom, slug, departement)")
    .eq("id", id)
    .single();
  if (!asso) notFound();

  const { data: evenements } = await supabase
    .from("evenements")
    .select("*")
    .eq("association_id", id)
    .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(10);

  const cat = assoCat(asso.categorie);

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <a href={`/${asso.communes?.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-lilac transition mb-6">
          ← Retour à {asso.communes?.nom}
        </a>

        {!asso.is_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-sm font-bold text-amber-800 mb-6">
            ⏳ Association en attente de validation : cette page n&apos;est pas encore référencée publiquement.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-lilac/10 to-white border border-lilac/20 rounded-3xl p-6 sm:p-8">
              <div className="flex items-start gap-5">
                {asso.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={asso.logo_url} alt="" className="w-16 h-16 rounded-2xl object-contain bg-white border border-lilac/20 p-1 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white border border-lilac/20 flex items-center justify-center text-3xl flex-shrink-0">{cat.emoji}</div>
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold flex items-center gap-2 flex-wrap">
                    {asso.nom}
                    {asso.is_verified && <span className="text-[10px] font-bold bg-lilac text-white px-2 py-0.5 rounded-full">✓ Reconnue</span>}
                  </h1>
                  <p className="text-sm font-bold text-lilac mt-1">{cat.emoji} {cat.label} · {asso.communes?.nom}</p>
                </div>
              </div>
            </div>

            {asso.description && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
                <h2 className="font-bold text-lg mb-3">À propos</h2>
                <p className="text-neutral-600 font-body leading-relaxed whitespace-pre-line">{asso.description}</p>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
              <h2 className="font-bold text-lg mb-4">📅 Prochains événements</h2>
              {!evenements || evenements.length === 0 ? (
                <p className="text-sm text-neutral-400 font-body">Aucun événement programmé pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {evenements.map((e: any) => {
                    const d = new Date(e.starts_at);
                    return (
                      <div key={e.id} className="flex gap-4 border border-neutral-100 rounded-2xl p-4">
                        <div className="w-14 text-center bg-lilac/10 rounded-xl py-1.5 flex-shrink-0 self-start">
                          <p className="text-xl font-extrabold text-lilac leading-none">{String(d.getDate()).padStart(2, "0")}</p>
                          <p className="text-[10px] font-bold text-lilac">{MOIS[d.getMonth()]}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold">{e.titre}</p>
                          <p className="text-xs text-neutral-500 font-body">{[e.lieu, d.getHours() || d.getMinutes() ? `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}` : null].filter(Boolean).join(" · ")}</p>
                          {e.description && <p className="text-[13px] text-neutral-600 font-body mt-1 line-clamp-3">{e.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5 md:sticky md:top-28">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
              <h3 className="font-bold mb-4">📞 Contacter</h3>
              <div className="space-y-3">
                {asso.email && <a href={`mailto:${asso.email}`} className="block text-center bg-lilac text-white font-bold py-3.5 rounded-full shadow-lg shadow-lilac/25 hover:scale-[1.02] transition text-sm">✉️ Envoyer un email</a>}
                {asso.telephone && <a href={`tel:${asso.telephone.replace(/\s/g, "")}`} className="block text-center border-2 border-ink text-ink font-bold py-3.5 rounded-full hover:bg-ink hover:text-white transition text-sm">📞 {asso.telephone}</a>}
                {asso.site_web && <a href={asso.site_web.startsWith("http") ? asso.site_web : `https://${asso.site_web}`} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-bold text-sky hover:underline py-1">🌐 Site / page</a>}
                {!asso.email && !asso.telephone && !asso.site_web && <p className="text-sm text-neutral-400 font-body font-semibold text-center py-2">Coordonnées non renseignées.</p>}
              </div>
            </div>
            <div className="bg-lilac/5 border border-lilac/20 rounded-3xl p-5">
              <p className="text-sm font-bold mb-1">🎭 Vous dirigez une association ?</p>
              <p className="text-xs text-neutral-500 font-body font-semibold">Créez votre page gratuitement et publiez vos événements dans l&apos;agenda de votre commune.</p>
              <a href="/association/espace" className="inline-block mt-3 text-xs font-bold text-lilac">Créer ma page →</a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
