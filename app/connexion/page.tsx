"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // Commune de résidence à l'inscription (facultative, modifiable ensuite dans Mon compte)
  type Commune = { id: string; nom: string; code_postal: string | null; departement: string | null };
  const [commune, setCommune] = useState<Commune | null>(null);
  const [communeQuery, setCommuneQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = communeQuery.trim();
    if (q.length < 2) { setSuggestions([]); setOpenSuggest(false); return; }
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const isPostal = /^\d{2,5}$/.test(q);
      let req = supabase.from("communes").select("id, nom, code_postal, departement").order("population", { ascending: false, nullsFirst: false }).limit(8);
      req = isPostal ? req.ilike("code_postal", `${q}%`) : req.ilike("nom", `%${q}%`);
      const { data } = await req;
      setSuggestions(data ?? []);
      setOpenSuggest(true);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [communeQuery]);

  async function declareResidence(communeId: string) {
    try {
      await fetch("/api/residence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ communeId }) });
    } catch {}
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message
        );
        return;
      }
      // Commune choisie à l'inscription mais pas encore enregistrée (confirmation email) : on la déclare maintenant
      const pendingCommune = data.user?.user_metadata?.commune_id as string | undefined;
      if (pendingCommune) {
        const { data: prof } = await supabase.from("profiles").select("commune_residence_id").eq("id", data.user!.id).maybeSingle();
        if (!prof?.commune_residence_id) await declareResidence(pendingCommune);
      }
      router.push("/");
      router.refresh();
    } else {
      if (!commune) {
        setLoading(false);
        setError("Choisissez votre commune de résidence dans la liste.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, commune_id: commune.id } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      // Créer le profil applicatif lié au compte auth
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName });
      }
      if (data.session) await declareResidence(commune.id);
      if (data.session) {
        // Parrainage ambassadeur (cookie osdt_ref posé par un lien ?ref=AMB-XXXXX)
        fetch("/api/ambassadeurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "parrainage" }) }).catch(() => {});
      }
      if (data.session) {
        // Confirmation email désactivée : connecté directement
        router.push("/");
        router.refresh();
      } else {
        // Confirmation email activée sur le projet Supabase
        setInfo("Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.");
      }
    }
  }

  return (
    <main className="font-display min-h-[calc(100vh-88px)] flex items-center justify-center bg-gradient-to-b from-orange-50 via-pink-50/50 to-white px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink/10 border border-neutral-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-1">
          {mode === "login" ? "Bon retour parmi vos voisins 👋" : "Rejoignez vos voisins 🏡"}
        </h1>
        <p className="text-sm text-neutral-500 font-body text-center mb-7">
          {mode === "login"
            ? "Connectez-vous pour retrouver votre commune."
            : "Créez votre compte gratuit en une minute."}
        </p>

        {/* Onglets connexion / inscription */}
        <div className="flex bg-neutral-100 rounded-full p-1 mb-7">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setInfo(null); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition ${
              mode === "login" ? "bg-white shadow text-ink" : "text-neutral-500"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition ${
              mode === "signup" ? "bg-white shadow text-ink" : "text-neutral-500"
            }`}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Prénom et nom</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Sophie Martin"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="relative">
              <label className="block text-xs font-bold text-neutral-500 mb-1.5">Ma commune de résidence</label>
              {commune ? (
                <div className="flex items-center justify-between bg-mint/10 border-2 border-mint/30 rounded-xl px-4 py-3 text-sm font-semibold">
                  <span>🏡 {commune.nom}{commune.code_postal ? ` (${commune.code_postal})` : ""}</span>
                  <button type="button" onClick={() => { setCommune(null); setCommuneQuery(""); }} className="text-xs font-bold text-neutral-400 hover:text-red-500">Changer</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={communeQuery}
                    onChange={(e) => setCommuneQuery(e.target.value)}
                    onFocus={() => suggestions.length && setOpenSuggest(true)}
                    onBlur={() => setTimeout(() => setOpenSuggest(false), 150)}
                    placeholder="Nom ou code postal, puis choisissez dans la liste"
                    autoComplete="off"
                    required
                    className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                  />
                  {openSuggest && suggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                      {suggestions.map((c) => (
                        <li key={c.id}>
                          <button type="button" onMouseDown={() => { setCommune(c); setOpenSuggest(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 flex justify-between">
                            <span>{c.nom}</span>
                            <span className="text-neutral-400 text-xs">{c.code_postal}{c.departement ? ` · ${c.departement}` : ""}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.fr"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={mode === "signup" ? "8 caractères minimum" : "Votre mot de passe"}
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
          </div>

          {error && (
            <div className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {info && (
            <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition font-display disabled:opacity-50"
          >
            {loading
              ? "Un instant..."
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="text-xs text-neutral-400 font-body font-semibold text-center mt-6">
          {mode === "signup"
            ? "En créant un compte, vous acceptez nos conditions d'utilisation."
            : "Vous pourrez toujours changer votre commune dans Mon compte."}
        </p>
      </div>
    </main>
  );
}
