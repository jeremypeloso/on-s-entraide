"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";
import EvenementsManager from "@/components/EvenementsManager";
import { ASSO_CATEGORIES } from "@/lib/associations";
import DangerZone from "@/components/DangerZone";



type Asso = {
  id: string; nom: string; categorie: string; description: string | null; email: string | null; telephone: string | null;
  site_web: string | null; logo_url: string | null; is_verified: boolean; commune_id: string; rna: string | null;
  communes: { nom: string; slug: string } | null;
};
type CommuneSug = { id: string; nom: string; code_postal: string | null; departement: string | null };

export default function EspaceAssociationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [asso, setAsso] = useState<Asso | null>(null);

  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [rna, setRna] = useState("");
  const [commune, setCommune] = useState<CommuneSug | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSug[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("associations")
        .select("*, communes(nom, slug)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        setAsso(data);
        setNom(data.nom); setCategorie(data.categorie); setDescription(data.description ?? "");
        setEmail(data.email ?? ""); setTelephone(data.telephone ?? ""); setSiteWeb(data.site_web ?? ""); setRna(data.rna ?? "");
        setCommune({ id: data.commune_id, nom: data.communes?.nom ?? "", code_postal: null, departement: null });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCommunes = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    const isPostal = /^\d{2,5}$/.test(q.trim());
    let req = supabase.from("communes").select("id, nom, code_postal, departement").order("population", { ascending: false, nullsFirst: false }).limit(12);
    req = isPostal ? req.ilike("code_postal", `${q.trim()}%`) : req.ilike("nom", `%${q.trim()}%`);
    const { data } = await req;
    setSuggestions(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCommunes(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchCommunes]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (nom.trim().length < 2 || !categorie || !commune) { setError("Nom, catégorie et commune sont requis."); return; }
    const rnaClean = rna.trim().toUpperCase().replace(/\s/g, "");
    if (!/^W\d{9}$/.test(rnaClean)) { setError("Le numéro RNA est requis : il commence par W suivi de 9 chiffres (ex : W781234567). Il figure sur votre récépissé de déclaration en préfecture."); return; }
    setSaving(true); setError(null); setSaved(false);
    const payload = {
      user_id: userId, commune_id: commune.id, nom: nom.trim(), categorie, rna: rnaClean,
      description: description.trim() || null, email: email.trim() || null,
      telephone: telephone.trim() || null, site_web: siteWeb.trim() || null,
    };
    const { data, error } = asso
      ? await supabase.from("associations").update(payload).eq("id", asso.id).select("*, communes(nom, slug)").single()
      : await supabase.from("associations").insert(payload).select("*, communes(nom, slug)").single();
    setSaving(false);
    if (error) { setError("Enregistrement impossible : " + error.message); return; }
    setAsso(data); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !asso || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploadingLogo(true);
    const url = await uploadPhoto(file, "logos-assos");
    if (url) {
      await supabase.from("associations").update({ logo_url: url }).eq("id", asso.id);
      setAsso({ ...asso, logo_url: url });
    }
    setUploadingLogo(false);
  }

  const input = "w-full bg-neutral-50 border-2 border-transparent focus:border-lilac/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body";

  if (loading) return <main className="font-display min-h-[60vh] flex items-center justify-center"><p className="text-neutral-400 font-bold animate-pulse">Chargement...</p></main>;

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-gradient-to-br from-lilac/10 to-white border border-lilac/20 rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase text-neutral-400 mb-1">Espace association</p>
          {asso && (
            <label className="flex items-center gap-4 mb-4 cursor-pointer group w-fit">
              {asso.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={asso.logo_url} alt="" className="w-16 h-16 rounded-2xl object-contain bg-white border border-neutral-200 p-1" />
              ) : (
                <span className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-neutral-300 group-hover:border-lilac flex items-center justify-center text-2xl transition">🎭</span>
              )}
              <span className="text-xs font-bold text-neutral-500 group-hover:text-lilac transition">
                {uploadingLogo ? "Envoi..." : asso.logo_url ? "Changer le logo" : "Ajouter votre logo"}
              </span>
              <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
            </label>
          )}
          <h1 className="text-2xl font-extrabold flex items-center gap-2 flex-wrap">
            {asso ? asso.nom : "Créez la page de votre association"}
            {asso && (asso.is_verified
              ? <span className="text-[10px] font-bold bg-lilac text-white px-2 py-0.5 rounded-full">✓ Association reconnue</span>
              : <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">⏳ En attente de validation</span>)}
          </h1>
          {asso && (asso.is_verified
            ? <p className="text-sm text-neutral-500 font-body mt-1">Gratuit. Vos événements apparaissent dans l&apos;agenda de {asso.communes?.nom}. <a href={`/association/${asso.id}`} className="text-lilac font-bold">Voir ma page publique →</a></p>
            : <p className="text-sm text-amber-800 font-body mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">⏳ Votre association est en attente de validation (RNA {asso.rna}). Vous pouvez déjà préparer vos événements : ils seront publiés automatiquement dès la validation.</p>)}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
          <h2 className="font-bold text-lg mb-5">🎭 {asso ? "Mon association" : "Votre association"}</h2>
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de l'association" className={input} />
              <input value={rna} onChange={(e) => setRna(e.target.value)} placeholder="N° RNA — W781234567" className={input} disabled={!!asso?.is_verified} />
            </div>
            <p className="text-[11px] text-neutral-400 font-body font-semibold -mt-2">
              Le numéro RNA (Répertoire National des Associations) est vérifié par notre équipe sous 48h.
              Votre page et vos événements ne sont publics qu&apos;après validation.
            </p>
            <div className="flex flex-wrap gap-2">
              {ASSO_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategorie(c.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-full border-2 transition ${categorie === c.id ? "border-lilac bg-lilac/10 text-lilac" : "border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            {/* Commune */}
            {commune ? (
              <div className="inline-flex items-center gap-2 bg-mint/10 border border-mint/30 text-sm font-bold px-4 py-2 rounded-full">
                🏡 {commune.nom}
                <button type="button" onClick={() => setCommune(null)} className="text-neutral-400 hover:text-lilac">✎</button>
              </div>
            ) : (
              <div className="relative max-w-md">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Commune de l'association..." className={input} />
                {suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-y-auto max-h-80 z-40">
                    {suggestions.map((s) => (
                      <button key={s.id} type="button" onClick={() => { setCommune(s); setQuery(""); setSuggestions([]); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-lilac/5 transition">
                        <span>🏡</span>
                        <span className="min-w-0"><span className="block text-sm font-bold truncate">{s.nom}</span><span className="block text-xs text-neutral-400 font-semibold">{s.code_postal} · {s.departement}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} placeholder="Présentation : activités, public, horaires, adhésion..." className={`${input} resize-none`} />
            <div className="grid sm:grid-cols-3 gap-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email de contact" className={input} />
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className={input} />
              <input value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} placeholder="Site ou page Facebook" className={input} />
            </div>
            {error && <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-body">{error}</p>}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving} className="bg-lilac text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-lilac/25 hover:scale-[1.02] transition disabled:opacity-40">
                {saving ? "..." : asso ? "Enregistrer" : "Créer ma page"}
              </button>
              {saved && <span className="text-sm font-bold text-mint">✓ Enregistré</span>}
            </div>
          </form>
        </div>

        {asso && (
          <>
            <EvenementsManager
              communeId={asso.commune_id}
              communeNom={asso.communes?.nom ?? ""}
              organisateurType="association"
              organisateurNom={asso.nom}
              associationId={asso.id}
            />
            <DangerZone
              scope="association"
              title="Supprimer la page de mon association"
              description="La page et tous ses événements seront supprimés. Votre compte habitant est conservé."
              confirmWord="SUPPRIMER"
              buttonLabel="Supprimer la page de l'association"
              redirectTo="/compte"
            />
          </>
        )}
      </div>
    </main>
  );
}
