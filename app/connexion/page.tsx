"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message
        );
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
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
            : "Après connexion, vous pourrez déclarer votre commune de résidence."}
        </p>
      </div>
    </main>
  );
}
