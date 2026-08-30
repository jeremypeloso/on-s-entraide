"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";

type Commune = { id: string; nom: string; slug: string; is_certified: boolean };
type Alerte = { id: string; title: string; body: string | null; starts_at: string | null; ends_at: string | null; created_at: string; photo_url: string | null };

export default function MairiePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [commune, setCommune] = useState<Commune | null>(null);
  const [alertes, setAlertes] = useState<Alerte[]>([]);

  // Formulaire nouvelle alerte
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coordonnées mairie
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [emailMairie, setEmailMairie] = useState("");
  const [horaires, setHoraires] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [savingCoord, setSavingCoord] = useState(false);
  const [coordSaved, setCoordSaved] = useState(false);
  const [blasonUrl, setBlasonUrl] = useState<string | null>(null);
  const [uploadingBlason, setUploadingBlason] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }
      setUserId(user.id);

      const { data: me } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      setBlasonUrl(me?.avatar_url ?? null);

      const { data: agent } = await supabase
        .from("commune_agents")
        .select("communes:commune_id (id, nom, slug, is_certified)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      // @ts-expect-error jointure typée souplement
      const c: Commune | null = agent?.communes ?? null;
      setCommune(c);

      if (c) {
        const { data } = await supabase
          .from("alertes_officielles")
          .select("*")
          .eq("commune_id", c.id)
          .order("created_at", { ascending: false });
        setAlertes(data ?? []);

        const { data: coord } = await supabase
          .from("mairie_coordonnees")
          .select("*")
          .eq("commune_id", c.id)
          .single();
        if (coord) {
          setAdresse(coord.adresse ?? "");
          setTelephone(coord.telephone ?? "");
          setEmailMairie(coord.email ?? "");
          setHoraires(coord.horaires ?? "");
          setSiteWeb(coord.site_web ?? "");
        }
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
      setError("Photo invalide (image de 5 Mo max).");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    if (!commune || title.trim().length < 3) return;
    setSubmitting(true);
    setError(null);

    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile, "alertes");
      if (!photoUrl) {
        setSubmitting(false);
        setError("L'envoi de la photo a échoué.");
        return;
      }
    }

    const { data, error } = await supabase
      .from("alertes_officielles")
      .insert({
        commune_id: commune.id,
        title: title.trim(),
        body: body.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        photo_url: photoUrl,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      setError("Publication impossible. Vérifiez que votre compte est bien rattaché à la commune.");
      return;
    }
    setAlertes((prev) => [data, ...prev]);
    setTitle(""); setBody(""); setStartsAt(""); setEndsAt("");
    setPhotoFile(null); setPhotoPreview(null);
  }

  async function onBlasonChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploadingBlason(true);
    const url = await uploadPhoto(file, "blasons");
    if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      setBlasonUrl(url);
    }
    setUploadingBlason(false);
  }

  async function saveCoordonnees(e: React.FormEvent) {
    e.preventDefault();
    if (!commune) return;
    setSavingCoord(true);
    setCoordSaved(false);
    const { error } = await supabase.from("mairie_coordonnees").upsert({
      commune_id: commune.id,
      adresse: adresse.trim() || null,
      telephone: telephone.trim() || null,
      email: emailMairie.trim() || null,
      horaires: horaires.trim() || null,
      site_web: siteWeb.trim() || null,
    });
    setSavingCoord(false);
    if (!error) {
      setCoordSaved(true);
      setTimeout(() => setCoordSaved(false), 3000);
    }
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from("alertes_officielles").delete().eq("id", id);
    if (!error) setAlertes((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Chargement...</p>
      </main>
    );
  }

  // --- Pas agent : présentation de l'offre ---
  if (!commune) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white rounded-3xl shadow-sm border border-neutral-100 p-10">
          <p className="text-4xl mb-4">🏛️</p>
          <h1 className="text-xl font-bold mb-2">Votre compte n&apos;est pas encore rattaché à une commune</h1>
          <p className="text-sm text-neutral-500 font-body mb-6">
            L&apos;accès mairie est activé après certification de votre commune
            (vérification d&apos;un justificatif officiel sous 48h).
          </p>
          <a
            href="/mairies"
            className="inline-block bg-sky text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-sky/25 hover:scale-105 transition"
          >
            Découvrir l&apos;offre communes
          </a>
        </div>
      </main>
    );
  }

  // --- Tableau de bord agent ---
  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* En-tête commune */}
        <div className="bg-gradient-to-br from-sky/10 to-lilac/10 border border-sky/20 rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <label className="relative w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-sky/40 hover:border-sky flex items-center justify-center cursor-pointer transition overflow-hidden flex-shrink-0 group" title="Blason de la commune">
            {blasonUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={blasonUrl} alt="Blason" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-[10px] font-bold text-sky text-center leading-tight px-1">
                {uploadingBlason ? "..." : "🛡️ Ajouter le blason"}
              </span>
            )}
            <span className="absolute inset-0 bg-ink/50 text-white text-[10px] font-bold items-center justify-center hidden group-hover:flex text-center px-1">
              {uploadingBlason ? "Envoi..." : "Changer"}
            </span>
            <input type="file" accept="image/*" onChange={onBlasonChange} className="hidden" />
          </label>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-neutral-400 mb-1">Espace mairie</p>
            <h1 className="text-2xl font-extrabold flex items-center gap-2 flex-wrap">
              {commune.nom}
              {commune.is_certified && (
                <span className="text-[11px] bg-sky text-white px-2.5 py-1 rounded-full">✓ Commune certifiée</span>
              )}
            </h1>
          </div>
          <a
            href={`/${commune.slug}`}
            className="text-sm font-bold px-5 py-2.5 rounded-full border-2 border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white transition text-center"
          >
            Voir la page publique →
          </a>
        </div>

        {/* Nouvelle alerte */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-1">📢 Publier une alerte officielle</h2>
          <p className="text-sm text-neutral-500 font-body mb-6">
            Elle apparaît immédiatement sur la page de la commune, signée du badge officiel.
          </p>

          <form onSubmit={publier} className="space-y-4 font-body">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="Titre — ex : 💧 Coupure d'eau rue des Tilleuls, mardi 9h-13h"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder="Détails utiles pour les habitants..."
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">Début (optionnel)</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">Fin (optionnel)</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                Photo (optionnelle, 5 Mo max)
              </label>
              {photoPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Aperçu" className="h-32 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink text-white text-xs font-bold shadow"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-200 hover:border-sky/50 rounded-xl px-4 py-5 text-sm font-bold text-neutral-400 cursor-pointer transition">
                  📷 Ajouter une photo
                  <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                </label>
              )}
            </div>

            {error && (
              <div className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || title.trim().length < 3}
              className="bg-sky text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-sky/25 hover:scale-[1.02] transition disabled:opacity-40 font-display"
            >
              {submitting ? "Publication..." : "Publier l'alerte"}
            </button>
          </form>
        </div>

        {/* Coordonnées mairie */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-1">🏛️ Coordonnées de la mairie</h2>
          <p className="text-sm text-neutral-500 font-body mb-6">
            Affichées dans le bandeau de votre page commune, visibles par tous les habitants.
          </p>
          <form onSubmit={saveCoordonnees} className="space-y-4 font-body">
            <input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Adresse — ex : 1 place de la Mairie, 78270 Limetz-Villez"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone — ex : 01 30 42 00 00"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
              <input
                type="email"
                value={emailMairie}
                onChange={(e) => setEmailMairie(e.target.value)}
                placeholder="Email — ex : contact@mairie.fr"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>
            <input
              value={horaires}
              onChange={(e) => setHoraires(e.target.value)}
              placeholder="Horaires — ex : Lun-Ven 9h-12h, Sam 9h-11h30"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <input
              value={siteWeb}
              onChange={(e) => setSiteWeb(e.target.value)}
              placeholder="Site web — ex : https://www.limetz-villez.fr"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-sky/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={savingCoord}
                className="bg-ink text-white font-bold px-7 py-3 rounded-full hover:bg-ink/85 transition disabled:opacity-40 font-display"
              >
                {savingCoord ? "Enregistrement..." : "Enregistrer"}
              </button>
              {coordSaved && <span className="text-sm font-bold text-mint">✓ Enregistré</span>}
            </div>
          </form>
        </div>

        {/* Alertes en ligne */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-5">🗂️ Alertes en ligne ({alertes.length})</h2>
          {alertes.length === 0 ? (
            <p className="text-sm text-neutral-300 font-bold py-6 text-center">
              Aucune alerte publiée pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {alertes.map((a) => (
                <div key={a.id} className="flex items-start gap-4 border border-neutral-100 rounded-2xl px-5 py-4">
                  {a.photo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={a.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{a.title}</p>
                    {a.body && <p className="text-xs text-neutral-500 font-body mt-0.5 line-clamp-2">{a.body}</p>}
                    <p className="text-[11px] font-bold text-neutral-300 mt-1.5">
                      Publiée le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      {a.starts_at && ` · 📅 ${new Date(a.starts_at).toLocaleDateString("fr-FR")}`}
                      {a.ends_at && ` → ${new Date(a.ends_at).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <button
                    onClick={() => supprimer(a.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-400 hover:border-red-300 hover:text-red-500 transition flex-shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
