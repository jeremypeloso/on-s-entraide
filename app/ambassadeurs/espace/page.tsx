"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONDITIONS_VERSION, PALIERS } from "@/lib/ambassadeurs";

type Amb = { id: string; commune: string; ref_code: string; statut: string; conditions_version: string | null; conditions_accepted_at: string | null };
type Stats = { habitants: number; pros: number; collectivites: number; points_total: number; points_debloques: number; points_depenses: number; points_disponibles: number };
type Rec = { id: string; points: number; montant: number; statut: string; created_at: string; sent_at: string | null };

const LABEL: Record<string, string> = { habitant: "Habitant", pro: "Pro", collectivite: "Collectivité" };

export default function EspaceAmbassadeurPage() {
  const router = useRouter();
  const [amb, setAmb] = useState<Amb | null>(null);
  const [prenom, setPrenom] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [derniers, setDerniers] = useState<{ type: string; created_at: string }[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [accepte, setAccepte] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/connexion"); return; }
    const { data: a } = await supabase.from("ambassadeurs").select("id, commune, ref_code, statut, conditions_version, conditions_accepted_at").eq("user_id", user.id).maybeSingle();
    if (!a) { router.push("/ambassadeurs#candidature"); return; }
    setAmb(a);
    const [{ data: p }, { data: s }, { data: d }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("ambassadeur_stats").select("*").eq("ambassadeur_id", a.id).maybeSingle(),
      supabase.from("parrainages").select("type, created_at").eq("ambassadeur_id", a.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("recompenses").select("id, points, montant, statut, created_at, sent_at").eq("ambassadeur_id", a.id).order("created_at", { ascending: false }),
    ]);
    setPrenom((p?.full_name ?? "").split(" ")[0]);
    setStats(s ?? { habitants: 0, pros: 0, collectivites: 0, points_total: 0, points_debloques: 0, points_depenses: 0, points_disponibles: 0 });
    setDerniers(d ?? []);
    setRecs(r ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function post(action: string, payload: any) {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/ambassadeurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
    const json = await res.json();
    setBusy(false);
    if (json.error) { setMsg({ ok: false, text: json.error }); return false; }
    return true;
  }

  if (loading || !amb) {
    return <main className="font-display min-h-[60vh] flex items-center justify-center"><p className="text-neutral-400 font-bold animate-pulse">Chargement…</p></main>;
  }

  // Conditions à (ré)accepter : jamais acceptées, ou version obsolète
  const conditionsOk = !!amb.conditions_accepted_at && amb.conditions_version === CONDITIONS_VERSION;
  if (!conditionsOk) {
    return (
      <main className="font-display bg-gradient-to-b from-orange-50 via-pink-50/50 to-white min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-ink/10 border border-neutral-100 p-8">
          <div className="text-4xl mb-3">📣</div>
          <h1 className="text-2xl font-extrabold">{amb.conditions_accepted_at ? "Les conditions ont changé" : `Bienvenue ${prenom || ""} !`}</h1>
          <p className="font-body text-neutral-600 mt-2">
            {amb.conditions_accepted_at
              ? "Merci de relire et d'accepter la nouvelle version des conditions du programme pour continuer."
              : "Vous avez été retenu comme ambassadeur de votre commune. Avant d'activer votre lien, merci de lire et d'accepter les conditions du programme."}
          </p>
          <label className="flex items-start gap-3 mt-6 font-body text-sm cursor-pointer">
            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1 accent-coral w-4 h-4" />
            <span>J'ai lu et j'accepte les <a href="/ambassadeurs/conditions" target="_blank" className="underline font-bold">conditions du programme ambassadeurs</a> (version {CONDITIONS_VERSION}).</span>
          </label>
          {msg && !msg.ok && <p className="text-sm font-bold text-red-500 mt-3">{msg.text}</p>}
          <button disabled={!accepte || busy} onClick={async () => { if (await post("accepter", { accepte: true })) load(); }}
            className="w-full mt-5 bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition disabled:opacity-40">
            {busy ? "Un instant…" : "Accepter et accéder à mon espace"}
          </button>
        </div>
      </main>
    );
  }

  const lien = `https://onseditout.fr/?ref=${amb.ref_code}`;
  const actif = amb.statut === "actif";
  const dispo = stats?.points_disponibles ?? 0;
  const bloques = (stats?.points_total ?? 0) - (stats?.points_debloques ?? 0);
  const enAttente = recs.find((r) => r.statut === "en_attente");

  return (
    <main className="font-display bg-neutral-100 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="text-sm font-bold text-neutral-400">📣 Ambassadeur · {amb.commune}</p>
        <h1 className="text-3xl font-extrabold mt-1">Bonjour {prenom || "vous"} 👋</h1>

        {!actif && (
          <p className="mt-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-body rounded-2xl px-5 py-4">
            {amb.statut === "candidat" ? "Votre candidature est en cours de validation. Votre lien sera actif dès confirmation." : "Votre compte ambassadeur est inactif. Contactez-nous si vous souhaitez le réactiver."}
          </p>
        )}

        {/* Lien */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm font-bold text-neutral-500">Votre lien de parrainage</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <code className="flex-1 min-w-[220px] bg-neutral-100 rounded-xl px-4 py-2.5 text-sm font-mono break-all">{lien}</code>
            <button onClick={() => { navigator.clipboard.writeText(lien); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-sm font-bold bg-ink text-white px-5 py-2.5 rounded-full hover:bg-ink/90 transition">{copied ? "✓ Copié" : "Copier"}</button>
          </div>
          <p className="font-body text-xs text-neutral-400 mt-3">Partagez-le dans les groupes Facebook de {amb.commune}, sur vos flyers, à vos commerçants. Toute inscription qui passe par ce lien vous est attribuée pendant 30 jours.</p>
        </div>

        {/* Points */}
        <div className="mt-5 bg-gradient-to-br from-coral to-coral-dark text-white rounded-2xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-bold">Points disponibles</p>
              <p className="font-body text-sm text-white/80 mt-1">{bloques > 0 ? `${bloques} points d'habitants en attente : ils se débloquent à chaque pro ou mairie que vous amenez.` : "Chaque habitant, pro ou mairie que vous amenez fait monter le compteur."}</p>
            </div>
            <p className="text-5xl font-extrabold leading-none">{dispo}</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[["👥 Habitants", stats?.habitants], ["💼 Pros", stats?.pros], ["🏛️ Mairies", stats?.collectivites]].map(([l, v]) => (
              <div key={String(l)} className="bg-white/15 rounded-xl py-3">
                <p className="text-2xl font-extrabold">{v ?? 0}</p>
                <p className="text-[11px] font-bold text-white/80">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Boutique */}
        <div className="mt-8">
          <h2 className="text-lg font-extrabold">🎁 Boutique cadeaux</h2>
          <p className="font-body text-sm text-neutral-500 mt-1">Échangez vos points contre une carte cadeau, envoyée par email sous quinze jours. Une demande à la fois.</p>
          {enAttente && (
            <p className="mt-3 bg-sky/10 border border-sky/30 text-sky text-sm font-bold rounded-2xl px-5 py-3">Votre carte de {enAttente.montant} € est en cours d'envoi.</p>
          )}
          {msg && <p className={`mt-3 text-sm font-bold ${msg.ok ? "text-mint" : "text-red-500"}`}>{msg.text}</p>}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PALIERS.map((p) => {
              const ok = actif && !enAttente && dispo >= p.points;
              return (
                <div key={p.points} className={`bg-white rounded-2xl border p-4 text-center ${ok ? "border-coral shadow-lg shadow-coral/10" : "border-neutral-200"}`}>
                  <p className="text-2xl font-extrabold">{p.montant} €</p>
                  <p className="text-xs font-bold text-neutral-400 mt-0.5">{p.points} pts</p>
                  <button disabled={!ok || busy}
                    onClick={async () => { if (window.confirm(`Échanger ${p.points} points contre une carte cadeau de ${p.montant} € ?`)) { if (await post("echanger", { points: p.points })) { setMsg({ ok: true, text: "Demande envoyée, vous recevrez votre carte par email." }); load(); } } }}
                    className={`mt-3 w-full text-xs font-bold py-2 rounded-full transition ${ok ? "bg-coral text-white hover:bg-coral-dark" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"}`}>
                    {ok ? "Échanger" : dispo >= p.points ? "Indisponible" : `Encore ${p.points - dispo} pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique */}
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-extrabold">Derniers parrainages</h2>
            {derniers.length === 0 ? (
              <p className="font-body text-sm text-neutral-500 mt-2">Aucun pour l'instant. Partagez votre lien pour commencer.</p>
            ) : (
              <ul className="mt-3 bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                {derniers.map((p, i) => (
                  <li key={i} className="flex justify-between px-5 py-3 text-sm">
                    <span className="font-bold">{LABEL[p.type] ?? p.type}</span>
                    <span className="text-neutral-400 font-body">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Mes cartes cadeaux</h2>
            {recs.length === 0 ? (
              <p className="font-body text-sm text-neutral-500 mt-2">Aucune demande pour l'instant.</p>
            ) : (
              <ul className="mt-3 bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                {recs.map((r) => (
                  <li key={r.id} className="flex justify-between items-center px-5 py-3 text-sm">
                    <span className="font-bold">{r.montant} € <span className="text-neutral-400 font-semibold">· {r.points} pts</span></span>
                    <span className={`text-xs font-bold ${r.statut === "envoyee" ? "text-mint" : r.statut === "annulee" ? "text-neutral-400" : "text-sky"}`}>
                      {r.statut === "envoyee" ? `Envoyée le ${new Date(r.sent_at!).toLocaleDateString("fr-FR")}` : r.statut === "annulee" ? "Annulée" : "En cours"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-10 text-xs font-bold text-neutral-400">
          Conditions {amb.conditions_version} acceptées le {new Date(amb.conditions_accepted_at!).toLocaleDateString("fr-FR")} · <a href="/ambassadeurs/conditions" className="underline">relire</a>
        </p>
      </div>
    </main>
  );
}
