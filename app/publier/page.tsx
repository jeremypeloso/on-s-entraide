"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";

type Categorie = { id: string; label: string; emoji: string };
type Commune = { id: string; nom: string; slug: string; code_postal: string | null; departement: string | null };

export default function PublierPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState<Commune | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche commune
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      // Catégories
      const { data: cats } = await supabase
        .from("categories")
        .select("id, label, emoji")
        .order("label");
      setCategories(cats ?? []);

      // Commune de résidence par défaut
      const { data: profile } = await supabase
        .from("profiles")
        .select("communes:commune_residence_id (id, nom, slug, code_postal, departement)")
        .eq("id", user.id)
        .single();
      // @ts-expect-error jointure typée souplement
      if (profile?.communes) setCommune(profile.communes);

      setChecking(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCommunes = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    const isPostal = /^\d{2,5}$/.test(q.trim());
    let req = supabase
      .from("communes")
      .select("id, nom, slug, code_postal, departement")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(5);
    req = isPostal ? req.ilike("code_postal", `${q.trim()}%`) : req.ilike("nom", `%${q.trim()}%`);
    const { data } = await req;
    setSuggestions(data ?? []);
    setOpenSuggest(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCommunes(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchCommunes]);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) return;
    if (file && file.size > 5 * 1024 * 1024) {
      setError("La photo dépasse 5 Mo.");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) { setError("Choisissez une thématique."); return; }
    if (!commune) { setError("Choisissez la commune de l'annonce."); return; }
    if (title.trim().length < 3) { setError("Le titre doit faire au moins 3 caractères."); return; }

    setSubmitting(true);

    let photoUrl: string | undefined;
    if (photoFile) {
      const url = await uploadPhoto(photoFile, "annonces");
      if (!url) {
        setSubmitting(false);
        setError("L'envoi de la photo a échoué. Réessayez ou publiez sans photo.");
        return;
      }
      photoUrl = url;
    }

    const res = await fetch("/api/annonces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        communeId: commune.id,
        categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        photoUrl,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Impossible de publier l'annonce. Réessayez.");
      return;
    }

    router.push(`/${commune.slug}`);
  }

  if (checking) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Publier une annonce ✨</h1>
          <p className="text-neutral-500 font-body">
            Une minute suffit. Votre annonce reste visible 30 jours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thématique */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-7">
            <h2 className="font-bold mb-4">1 · Quelle thématique ?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`rounded-2xl p-4 text-center border-2 transition ${
                    categoryId === c.id
                      ? "border-coral bg-orange-50 shadow-md"
                      : "border-neutral-100 bg-white hover:border-neutral-200"
                  }`}
                >
                  <span className="block text-2xl mb-1">{c.emoji}</span>
                  <span className="block text-xs font-bold">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenu */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-7 space-y-4">
            <h2 className="font-bold">2 · Votre annonce</h2>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Ex : Perceuse à prêter ce week-end"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                Description <span className="text-neutral-300">({description.length}/500)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Précisez les détails utiles : disponibilité, état, conditions..."
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                Photo <span className="text-neutral-300">(optionnelle, 5 Mo max)</span>
              </label>
              {photoPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Aperçu" className="h-36 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink text-white text-xs font-bold shadow"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-200 hover:border-coral/50 rounded-xl px-4 py-6 text-sm font-bold text-neutral-400 cursor-pointer transition">
                  📷 Ajouter une photo
                  <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Commune */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-7">
            <h2 className="font-bold mb-4">3 · Sur quelle commune ?</h2>
            {commune ? (
              <div className="flex items-center justify-between gap-4 bg-mint/10 border border-mint/30 rounded-2xl px-5 py-4">
                <div>
                  <p className="font-bold">{commune.nom}</p>
                  <p className="text-xs text-neutral-400 font-body font-semibold">
                    {commune.code_postal} · {commune.departement}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCommune(null)}
                  className="text-xs font-bold text-neutral-400 hover:text-coral transition"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cherchez une commune ou un code postal..."
                  className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body"
                />
                {openSuggest && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-40">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setCommune(s); setOpenSuggest(false); setQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition"
                      >
                        <span className="text-sm">🏡</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold truncate">{s.nom}</span>
                          <span className="block text-xs text-neutral-400 font-semibold">
                            {s.code_postal} · {s.departement}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-4 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.01] transition disabled:opacity-50 text-base"
          >
            {submitting ? "Publication..." : "🚀 Publier mon annonce"}
          </button>

          <p className="text-center text-xs text-neutral-400 font-body font-semibold">
            En publiant, vous vous engagez à respecter les règles de bonne entente entre voisins.
          </p>
        </form>
      </div>
    </main>
  );
}
