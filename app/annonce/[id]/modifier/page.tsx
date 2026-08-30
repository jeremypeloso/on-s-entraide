"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";

type Categorie = { id: string; label: string; emoji: string };

export default function ModifierAnnoncePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState("disponible");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [communeSlug, setCommuneSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data: annonce } = await supabase
        .from("annonces")
        .select("*, communes(slug)")
        .eq("id", id)
        .single();

      if (!annonce || annonce.author_id !== user.id) {
        // Pas l'auteur : retour à l'annonce
        router.push(`/annonce/${id}`);
        return;
      }

      setTitle(annonce.title);
      setDescription(annonce.description ?? "");
      setCategoryId(annonce.category_id);
      setStatut(annonce.statut);
      setPhotoUrl(annonce.photo_url);
      // @ts-expect-error jointure typée souplement
      setCommuneSlug(annonce.communes?.slug ?? "");

      const { data: cats } = await supabase
        .from("categories")
        .select("id, label, emoji")
        .order("label");
      setCategories(cats ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Le titre doit faire au moins 3 caractères.");
      return;
    }
    setSaving(true);
    setError(null);

    let finalPhoto = photoUrl;
    if (photoFile) {
      const url = await uploadPhoto(photoFile, "annonces");
      if (!url) {
        setSaving(false);
        setError("L'envoi de la photo a échoué.");
        return;
      }
      finalPhoto = url;
    }

    const { error } = await supabase
      .from("annonces")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        statut,
        photo_url: finalPhoto,
      })
      .eq("id", id);

    setSaving(false);
    if (error) {
      setError("Enregistrement impossible. Réessayez.");
      return;
    }
    router.push(`/annonce/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-6">
        <a
          href={`/annonce/${id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-coral transition mb-6"
        >
          ← Retour à l&apos;annonce
        </a>

        <h1 className="text-3xl font-extrabold mb-8">Modifier l&apos;annonce ✏️</h1>

        <form onSubmit={save} className="space-y-6">
          {/* Thématique */}
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-7">
            <h2 className="font-bold mb-4">Thématique</h2>
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
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
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
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Statut</label>
              <div className="flex gap-2">
                {[
                  { v: "disponible", l: "✓ Disponible" },
                  { v: "reserve", l: "⏳ Réservé" },
                  { v: "termine", l: "Terminé" },
                ].map((s) => (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => setStatut(s.v)}
                    className={`text-sm font-bold px-4 py-2.5 rounded-full border-2 transition ${
                      statut === s.v
                        ? "border-ink bg-ink text-white"
                        : "border-neutral-200 text-neutral-500 hover:border-ink/40"
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Photo</label>
              {photoPreview || photoUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview ?? photoUrl ?? ""}
                    alt="Photo"
                    className="h-36 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoUrl(null); }}
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

          {error && (
            <div className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-4 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.01] transition disabled:opacity-50 text-base"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </main>
  );
}
