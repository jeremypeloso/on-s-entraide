import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CommentForm from "@/components/CommentForm";
import PhotoViewer from "@/components/PhotoViewer";
import AnnonceOwnerActions from "@/components/AnnonceOwnerActions";

const STATUT_STYLE: Record<string, string> = {
  disponible: "bg-mint/15 text-mint",
  reserve: "bg-sun/20 text-amber-600",
  termine: "bg-neutral-100 text-neutral-400",
};
const STATUT_LABEL: Record<string, string> = {
  disponible: "✓ Disponible",
  reserve: "⏳ Réservé",
  termine: "Terminé",
};

export default async function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: annonce } = await supabase
    .from("annonces")
    .select("*, categories(*), profiles(full_name, created_at, commune_residence_id, avatar_url), communes(nom, slug, code_postal, departement)")
    .eq("id", id)
    .single();

  if (!annonce) notFound();

  const { data: comments } = await supabase
    .from("annonce_comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("annonce_id", id)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Compte officiel ? (l'auteur est agent de la commune de l'annonce)
  const { data: officialCheck } = await supabase
    .from("commune_agents")
    .select("user_id")
    .eq("user_id", annonce.author_id)
    .eq("commune_id", annonce.commune_id)
    .limit(1);
  const isOfficial = !!officialCheck && officialCheck.length > 0;

  const author = annonce.profiles;
  const commune = annonce.communes;
  const isAuthorResident = author?.commune_residence_id === annonce.commune_id;
  const authorInitial = (author?.full_name ?? "?").charAt(0).toUpperCase();
  const publishedDate = new Date(annonce.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long",
  });
  const memberSince = author?.created_at
    ? new Date(author.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Fil d'ariane */}
        <a
          href={`/${commune?.slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-coral transition mb-6"
        >
          ← Retour à {commune?.nom}
        </a>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* ===== Colonne principale ===== */}
          <div className="md:col-span-2 space-y-6">
            {/* Annonce */}
            <article className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
              <div
                className="h-2"
                style={{ background: annonce.categories?.color_hex ?? "#FF6B5B" }}
              />

              <div className="p-5 sm:p-8">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-100">
                    {annonce.categories?.emoji} {annonce.categories?.label}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUT_STYLE[annonce.statut] ?? ""}`}>
                    {STATUT_LABEL[annonce.statut] ?? annonce.statut}
                  </span>
                  {annonce.is_sponsored && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                      Sponsorisé
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
                  {annonce.title}
                </h1>

                {annonce.description && (
                  <p className="text-neutral-600 font-body leading-relaxed whitespace-pre-line mb-6">
                    {annonce.description}
                  </p>
                )}

                {annonce.photo_url && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3">📎 Pièces jointes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <PhotoViewer url={annonce.photo_url} title={annonce.title} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-5 text-xs font-bold text-neutral-400 border-t border-neutral-100 pt-5">
                  <span>📍 {commune?.nom} ({commune?.code_postal})</span>
                  <span>🗓️ Publiée le {publishedDate}</span>
                </div>
              </div>
            </article>

            {/* Questions publiques */}
            <section className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
              <h2 className="font-bold text-lg mb-1">💬 Questions publiques</h2>
              <p className="text-sm text-neutral-400 font-body mb-6">
                Visibles par tous : posez les questions utiles avant de contacter
                (dimensions, disponibilité, conditions...).
              </p>

              {comments && comments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      {c.profiles?.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky to-lilac text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0">
                          {(c.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="bg-neutral-50 rounded-2xl px-4 py-3 flex-1">
                        <p className="text-xs font-bold mb-0.5">
                          {c.profiles?.full_name ?? "Un voisin"}
                          <span className="text-neutral-300 font-semibold ml-2">
                            {new Date(c.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </p>
                        <p className="text-sm text-neutral-600 font-body">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-300 font-bold mb-6">
                  Aucune question pour le moment.
                </p>
              )}

              {user ? (
                <CommentForm annonceId={annonce.id} />
              ) : (
                <a
                  href="/connexion"
                  className="inline-block text-sm font-bold text-coral hover:text-coral-dark transition"
                >
                  Connectez-vous pour poser une question →
                </a>
              )}
            </section>
          </div>

          {/* ===== Colonne latérale ===== */}
          <aside className="space-y-5 md:sticky md:top-28">
            {user?.id === annonce.author_id && (
              <AnnonceOwnerActions annonceId={annonce.id} communeSlug={commune?.slug ?? ""} />
            )}

            {/* Auteur */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6">
              <div className="flex items-center gap-4 mb-4">
                {author?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={author.avatar_url}
                    alt=""
                    className={isOfficial ? "w-14 h-14 rounded-2xl object-contain bg-white border border-neutral-100 p-1" : "w-14 h-14 rounded-2xl object-cover border border-neutral-100"}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral via-pink to-lilac text-white text-xl font-extrabold flex items-center justify-center">
                    {authorInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{author?.full_name ?? "Un voisin"}</p>
                  {isOfficial ? (
                    <p className="text-xs font-bold text-sky">🏛️ Compte officiel · {commune?.nom}</p>
                  ) : isAuthorResident ? (
                    <p className="text-xs font-bold text-mint">🏡 Habitant de {commune?.nom}</p>
                  ) : null}
                  {memberSince && !isOfficial && (
                    <p className="text-xs text-neutral-400 font-body font-semibold">
                      Membre depuis {memberSince}
                    </p>
                  )}
                </div>
              </div>

              {user ? (
                annonce.statut === "termine" ? (
                  <p className="text-center text-sm font-bold text-neutral-300 py-3">
                    Cette annonce est terminée
                  </p>
                ) : (
                  <div className="text-center">
                    <button
                      disabled
                      className="w-full bg-neutral-100 text-neutral-400 font-bold py-3.5 rounded-full cursor-not-allowed"
                    >
                      💬 Contacter {author?.full_name?.split(" ")[0] ?? ""}
                    </button>
                    <p className="text-[11px] text-neutral-400 font-body font-semibold mt-2">
                      La messagerie intégrée arrive très bientôt. En attendant,
                      posez une question publique !
                    </p>
                  </div>
                )
              ) : (
                <a
                  href="/connexion"
                  className="block text-center w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition"
                >
                  Se connecter pour contacter
                </a>
              )}
            </div>

            {/* Confiance */}
            <div className="bg-sky/10 border border-sky/20 rounded-3xl p-5">
              <h3 className="text-sm font-bold mb-2">🔒 Vos échanges protégés</h3>
              <ul className="text-xs text-neutral-500 font-body font-semibold space-y-1.5">
                <li>· L&apos;adresse exacte n&apos;est jamais publiée</li>
                <li>· Échangez d&apos;abord via la plateforme</li>
                <li>· Ne versez jamais d&apos;argent en avance</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
