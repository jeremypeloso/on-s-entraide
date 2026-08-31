"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";

type Commune = { id: string; nom: string; code_postal: string | null; departement: string | null };
type Annonce = { id: string; title: string; statut: string; created_at: string; categories: { label: string; emoji: string } | null };

export default function ComptePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [residence, setResidence] = useState<Commune | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [isAgent, setIsAgent] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isAsso, setIsAsso] = useState(false);

  // --- Recherche commune de résidence ---
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [savingResidence, setSavingResidence] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, commune_residence_id, communes:commune_residence_id (id, nom, code_postal, departement)")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
        // @ts-expect-error jointure typée souplement
        if (profile.communes) setResidence(profile.communes);
      }

      const { data: mesAnnonces } = await supabase
        .from("annonces")
        .select("id, title, statut, created_at, categories (label, emoji)")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      // @ts-expect-error jointure typée souplement
      setAnnonces(mesAnnonces ?? []);

      const { data: agent } = await supabase
        .from("commune_agents")
        .select("commune_id")
        .eq("user_id", user.id)
        .limit(1);
      setIsAgent(!!agent && agent.length > 0);

      const { data: proProfile } = await supabase
        .from("pro_profiles")
        .select("id")
        .eq("id", user.id)
        .limit(1);
      setIsPro(!!proProfile && proProfile.length > 0);

      const { data: assoRow } = await supabase.from("associations").select("id").eq("user_id", user.id).limit(1);
      setIsAsso(!!assoRow && assoRow.length > 0);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCommunes = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const isPostal = /^\d{2,5}$/.test(q.trim());
    let req = supabase
      .from("communes")
      .select("id, nom, code_postal, departement")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(12);
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

  async function setCommuneResidence(c: Commune) {
    setSavingResidence(true);
    setOpenSuggest(false);
    setQuery("");
    const res = await fetch("/api/residence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communeId: c.id }),
    });
    setSavingResidence(false);
    if (res.ok) {
      setResidence(c);
      try { sessionStorage.removeItem("ose_commune"); } catch {}
    } else {
      const j = await res.json().catch(() => ({}));
      window.alert("Enregistrement impossible : " + (j.error ?? res.status));
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploadingAvatar(true);
    const url = await uploadPhoto(file, "avatars");
    if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      setAvatarUrl(url);
      try { sessionStorage.removeItem("ose_auth"); } catch {}
    }
    setUploadingAvatar(false);
  }

  async function supprimerAnnonce(id: string) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (!error) setAnnonces((prev) => prev.filter((a) => a.id !== id));
  }

  async function updateStatut(id: string, statut: string) {
    await supabase.from("annonces").update({ statut }).eq("id", id);
    setAnnonces((prev) => prev.map((a) => (a.id === id ? { ...a, statut } : a)));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Chargement de votre compte...</p>
      </main>
    );
  }

  const STATUT_STYLE: Record<string, string> = {
    disponible: "bg-mint/15 text-mint",
    reserve: "bg-sun/20 text-amber-600",
    termine: "bg-neutral-100 text-neutral-400",
  };
  const STATUT_LABEL: Record<string, string> = {
    disponible: "Disponible",
    reserve: "Réservé",
    termine: "Terminé",
  };

  const hasRole = isPro || isAsso || isAgent;

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* ===== En-tête compte ===== */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <label className="relative cursor-pointer group flex-shrink-0" title="Changer ma photo">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-neutral-100" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral via-pink to-lilac flex items-center justify-center text-white text-2xl font-extrabold">
                {(fullName || userEmail).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white shadow border border-neutral-200 flex items-center justify-center text-xs group-hover:scale-110 transition">
              {uploadingAvatar ? "…" : "📷"}
            </span>
            <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
          </label>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{fullName || "Votre compte"}</h1>
            <p className="text-sm text-neutral-400 font-body font-semibold">{userEmail}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm font-bold px-5 py-2.5 rounded-full border-2 border-neutral-200 text-neutral-500 hover:border-red-300 hover:text-red-500 transition"
          >
            Se déconnecter
          </button>
        </div>

        {/* ===== Commune de résidence ===== */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-1">🏡 Ma commune de résidence</h2>
          <p className="text-sm text-neutral-500 font-body mb-5">
            Elle active le module Vigilance de votre commune et définit votre page par défaut.
          </p>

          {residence ? (
            <div className="flex items-center justify-between gap-4 bg-mint/10 border border-mint/30 rounded-2xl px-5 py-4">
              <div>
                <p className="font-bold">{residence.nom}</p>
                <p className="text-xs text-neutral-400 font-body font-semibold">
                  {residence.code_postal} · {residence.departement}
                </p>
              </div>
              <button
                onClick={() => setResidence(null)}
                className="text-xs font-bold text-neutral-400 hover:text-coral transition"
              >
                Modifier
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cherchez votre commune ou code postal..."
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body"
              />
              {savingResidence && (
                <p className="text-xs text-neutral-400 font-bold mt-2 animate-pulse">Enregistrement...</p>
              )}
              {openSuggest && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-y-auto max-h-80 z-40">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setCommuneResidence(s)}
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

        {/* ===== Mon profil ===== */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-5">👤 Mon profil</h2>
          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">Nom</label>
            <div className="flex items-center gap-3 bg-neutral-100 rounded-xl px-4 py-3">
              <span className="flex-1 text-sm font-semibold text-neutral-500">{fullName || "—"}</span>
              <span className="text-base" title="Défini à l'inscription">🔒</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-body font-semibold mt-1.5">
              Votre nom est défini à l&apos;inscription et visible de vos voisins : c&apos;est la base
              de la confiance entre habitants. Pour le corriger, contactez-nous.
            </p>
          </div>
        </div>

        {/* ===== Mes annonces ===== */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">📋 Mes annonces</h2>
            <a
              href="/publier"
              className="text-sm font-bold text-coral hover:text-coral-dark transition"
            >
              ＋ Publier
            </a>
          </div>

          {annonces.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm text-neutral-400 font-body font-semibold">
                Vous n&apos;avez pas encore publié d&apos;annonce.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {annonces.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 border border-neutral-100 rounded-2xl px-5 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {a.categories?.emoji} {a.title}
                    </p>
                    <p className="text-xs text-neutral-400 font-body font-semibold">
                      Publiée le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0 w-fit ${STATUT_STYLE[a.statut] ?? ""}`}>
                    {STATUT_LABEL[a.statut] ?? a.statut}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    {a.statut === "disponible" && (
                      <button
                        onClick={() => updateStatut(a.id, "reserve")}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 hover:border-sun hover:text-amber-600 transition"
                      >
                        Marquer réservé
                      </button>
                    )}
                    {a.statut !== "termine" && (
                      <button
                        onClick={() => updateStatut(a.id, "termine")}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 hover:border-mint hover:text-mint transition"
                      >
                        Terminer
                      </button>
                    )}
                    <a
                      href={`/annonce/${a.id}/modifier`}
                      className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 hover:border-ink transition"
                    >
                      Modifier
                    </a>
                    <button
                      onClick={() => supprimerAnnonce(a.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-400 hover:border-red-300 hover:text-red-500 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Passerelles : seulement le(s) rôle(s) du compte, ou les 3 invitations ===== */}
        <div className="grid sm:grid-cols-2 gap-4">
          {(hasRole ? isPro : true) && (
          <a
            href={isPro ? "/pro/espace" : "/pro"}
            className="bg-gradient-to-br from-orange-50 to-white border-2 border-coral/20 rounded-3xl p-6 hover:border-coral/50 hover:shadow-lg transition group"
          >
            <p className="text-2xl mb-2">💼</p>
            <h3 className="font-bold group-hover:text-coral-dark transition">
              {isPro ? "Gérer mon espace pro" : "Vous êtes un professionnel ?"}
            </h3>
            <p className="text-sm text-neutral-500 font-body mt-1">
              {isPro
                ? "Profil, services, abonnement et communes couvertes."
                : "Activez votre profil pro et soyez visible sur votre zone d'intervention."}
            </p>
          </a>
          )}
          {(hasRole ? isAsso : true) && (
          <a
            href="/association/espace"
            className="bg-gradient-to-br from-lilac/10 to-white border-2 border-lilac/20 rounded-3xl p-6 hover:border-lilac/50 hover:shadow-lg transition group"
          >
            <p className="text-2xl mb-2">🎭</p>
            <h3 className="font-bold group-hover:text-lilac transition">{isAsso ? "Gérer mon association" : "Vous dirigez une association ?"}</h3>
            <p className="text-sm text-neutral-500 font-body mt-1">
              {isAsso ? "Page, événements et coordonnées." : "Créez sa page gratuitement et publiez vos événements dans l'agenda."}
            </p>
          </a>
          )}
          {(hasRole ? isAgent : true) && (
          <a
            href={isAgent ? "/mairie" : "/mairies"}
            className="bg-gradient-to-br from-sky/10 to-white border-2 border-sky/20 rounded-3xl p-6 hover:border-sky/50 hover:shadow-lg transition group"
          >
            <p className="text-2xl mb-2">🏛️</p>
            <h3 className="font-bold group-hover:text-sky transition">
              {isAgent ? "Gérer ma commune" : "Vous représentez une mairie ?"}
            </h3>
            <p className="text-sm text-neutral-500 font-body mt-1">
              {isAgent
                ? "Publiez et gérez les alertes officielles de votre commune."
                : "Certifiez votre commune et publiez vos alertes officielles."}
            </p>
          </a>
          )}
        </div>
      </div>
    </main>
  );
}
