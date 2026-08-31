"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "stats" | "moderation" | "avis" | "annonces" | "users" | "pros" | "assos" | "mairies" | "contacts" | "reglages";

const TABS: { id: Tab; label: string }[] = [
  { id: "stats", label: "📊 Vue d'ensemble" },
  { id: "moderation", label: "🚩 Modération" },
  { id: "avis", label: "⭐ Avis signalés" },
  { id: "annonces", label: "📋 Annonces" },
  { id: "users", label: "👥 Utilisateurs" },
  { id: "pros", label: "💼 Pros" },
  { id: "assos", label: "🎭 Associations" },
  { id: "mairies", label: "🏛️ Mairies" },
  { id: "contacts", label: "📬 Messages" },
  { id: "reglages", label: "⚙️ Réglages" },
];

async function api(action: string, payload?: any) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("stats");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [certifSlug, setCertifSlug] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentSlug, setAgentSlug] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [maintMsg, setMaintMsg] = useState("");
  const [emailTest, setEmailTest] = useState<any>(null);
  const [emailTesting, setEmailTesting] = useState(false);

  // Contrôle d'accès
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!p?.is_admin) { router.push("/"); return; }
      setChecking(false);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (t: Tab, extra?: any) => {
    setLoading(true);
    const actionMap: Record<Tab, string> = {
      stats: "stats", moderation: "signalements", avis: "avis_signales", annonces: "annonces",
      users: "users", pros: "pros", assos: "assos", mairies: "communes_certifiees", contacts: "contacts", reglages: "settings",
    };
    const res = await api(actionMap[t], extra);
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!checking) load(tab);
  }, [tab, checking, load]);

  async function act(action: string, payload: any, msg: string) {
    const res = await api(action, payload);
    if (res.error) { setFeedback(`⚠️ ${res.error}`); }
    else { setFeedback(`✓ ${msg}`); load(tab); }
    setTimeout(() => setFeedback(null), 3500);
  }

  if (checking) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Vérification des accès...</p>
      </main>
    );
  }

  return (
    <main className="font-display bg-neutral-100 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-extrabold">🎛️ Administration</h1>
          {feedback && (
            <span className="text-sm font-bold bg-white border border-neutral-200 rounded-full px-4 py-2">{feedback}</span>
          )}
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[13px] font-bold px-4 py-2.5 rounded-full whitespace-nowrap transition ${
                tab === t.id ? "bg-ink text-white shadow" : "bg-white text-ink/70 border border-neutral-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm font-bold text-neutral-400 animate-pulse py-8 text-center">Chargement...</p>}

        {/* ===== VUE D'ENSEMBLE ===== */}
        {!loading && tab === "stats" && data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Utilisateurs", value: data.users, emoji: "👥" },
              { label: "Annonces (total)", value: data.annonces, emoji: "📋" },
              { label: "Annonces actives", value: data.annoncesActives, emoji: "✅" },
              { label: "Pros inscrits", value: data.pros, emoji: "💼" },
              { label: "Pros abonnés actifs", value: data.prosActifs, emoji: "💳" },
              { label: "Communes certifiées", value: data.certifiees, emoji: "🏛️" },
              { label: "Signalements en attente", value: data.signalements, emoji: "🚩", alert: (data.signalements ?? 0) > 0 },
              { label: "Messages non traités", value: data.contacts, emoji: "📬", alert: (data.contacts ?? 0) > 0 },
              { label: "Avis signalés", value: data.avisSignales, emoji: "⭐", alert: (data.avisSignales ?? 0) > 0 },
              { label: "Associations à valider", value: data.assosAttente, emoji: "🎭", alert: (data.assosAttente ?? 0) > 0 },
              { label: "Questions publiques", value: data.comments, emoji: "💬" },
            ].map((s: any) => (
              <div
                key={s.label}
                className={`bg-white rounded-2xl p-5 border ${s.alert ? "border-red-200 bg-red-50" : "border-neutral-200"}`}
              >
                <p className="text-2xl mb-1">{s.emoji}</p>
                <p className="text-3xl font-extrabold">{s.value ?? 0}</p>
                <p className="text-xs font-bold text-neutral-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ===== MODÉRATION ===== */}
        {!loading && tab === "moderation" && data?.data && (
          <div className="space-y-3">
            {data.data.length === 0 && (
              <p className="text-center text-sm font-bold text-neutral-400 py-10">🎉 Aucun signalement en attente.</p>
            )}
            {data.data.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-500 uppercase">{s.motif}</p>
                    <p className="font-bold text-sm mt-1">
                      {s.annonces ? (
                        <a href={`/annonce/${s.annonces.id}`} target="_blank" className="hover:text-coral underline">
                          {s.annonces.title}
                        </a>
                      ) : "Annonce déjà supprimée"}
                    </p>
                    <p className="text-xs text-neutral-400 font-body font-semibold mt-0.5">
                      Auteur : {s.annonces?.profiles?.full_name ?? "?"} · Signalé par {s.reporter?.full_name ?? "?"} le{" "}
                      {new Date(s.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {s.commentaire && (
                      <p className="text-sm text-neutral-600 font-body mt-2 bg-neutral-50 rounded-xl px-3 py-2">
                        « {s.commentaire} »
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {s.annonces && (
                      <button
                        onClick={() => act("signalement_traiter", { annonceId: s.annonces.id }, "Annonce supprimée")}
                        className="text-xs font-bold px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                      >
                        Supprimer l&apos;annonce
                      </button>
                    )}
                    <button
                      onClick={() => act("signalement_rejeter", { id: s.id }, "Signalement rejeté")}
                      className="text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-ink transition"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== AVIS SIGNALÉS ===== */}
        {!loading && tab === "avis" && data?.data && (
          <div className="space-y-3">
            {data.data.length === 0 && <p className="text-center text-sm font-bold text-neutral-400 py-10">🎉 Aucun avis signalé.</p>}
            {data.data.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-500 uppercase">{s.motif}</p>
                    <p className="text-xs font-bold text-neutral-400 mt-0.5">Signalé par <a href={`/pro/${s.pro_id}`} target="_blank" className="underline">{s.pro?.business_name}</a></p>
                    {s.commentaire && <p className="text-xs text-neutral-500 font-body mt-1">« {s.commentaire} »</p>}
                    {s.pro_reviews ? (
                      <div className="mt-3 bg-neutral-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold">{s.pro_reviews.profiles?.full_name ?? "?"} · {"★".repeat(s.pro_reviews.rating)}{"☆".repeat(5 - s.pro_reviews.rating)} · {new Date(s.pro_reviews.created_at).toLocaleDateString("fr-FR")}</p>
                        <p className="text-sm text-neutral-600 font-body mt-1">{s.pro_reviews.body ?? "(sans commentaire)"}</p>
                      </div>
                    ) : <p className="text-xs text-neutral-400 mt-2">Avis déjà supprimé</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {s.pro_reviews && (
                      <button onClick={() => act("avis_supprimer", { reviewId: s.pro_reviews.id }, "Avis supprimé")}
                        className="text-xs font-bold px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition">Supprimer l&apos;avis</button>
                    )}
                    <button onClick={() => act("avis_signalement_rejeter", { id: s.id }, "Signalement rejeté, avis conservé")}
                      className="text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-ink transition">Conserver l&apos;avis</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ANNONCES ===== */}
        {!loading && tab === "annonces" && data?.data && (
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {data.data.map((a: any) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span>{a.categories?.emoji}</span>
                <a href={`/annonce/${a.id}`} target="_blank" className="flex-1 min-w-[180px] font-bold text-sm truncate hover:text-coral">
                  {a.title}
                </a>
                <span className="text-xs font-bold text-neutral-400">{a.communes?.nom}</span>
                <span className="text-xs font-bold text-neutral-400">{a.profiles?.full_name}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  a.statut === "disponible" ? "bg-mint/15 text-mint" : a.statut === "reserve" ? "bg-sun/20 text-amber-600" : "bg-neutral-100 text-neutral-400"
                }`}>{a.statut}</span>
                {a.is_sponsored && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">Spons.</span>}
                <button
                  onClick={() => { if (window.confirm("Supprimer cette annonce ?")) act("annonce_supprimer", { id: a.id }, "Annonce supprimée"); }}
                  className="text-xs font-bold text-neutral-300 hover:text-red-500 transition"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== UTILISATEURS ===== */}
        {!loading && tab === "users" && data?.data && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load("users", { search })}
                placeholder="Rechercher un nom..."
                className="flex-1 max-w-sm bg-white border border-neutral-200 rounded-full px-5 py-2.5 text-sm font-semibold outline-none focus:border-ink transition font-body"
              />
              <button onClick={() => load("users", { search })} className="bg-ink text-white text-sm font-bold px-5 py-2.5 rounded-full">
                Chercher
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
              {data.data.map((u: any) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white text-xs font-extrabold flex items-center justify-center">
                    {(u.full_name ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-[140px] font-bold text-sm">{u.full_name ?? "—"}</span>
                  <span className="text-xs font-bold text-neutral-400">{u.communes?.nom ?? "Pas de commune"}</span>
                  <span className="text-xs font-bold text-neutral-300">
                    Inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  {u.is_admin && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-ink text-white">ADMIN</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PROS ===== */}
        {!loading && tab === "pros" && data?.data && (
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {data.data.map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <a href={`/pro/${p.id}`} target="_blank" className="flex-1 min-w-[160px] font-bold text-sm hover:text-coral">
                  {p.business_name}
                </a>
                <span className="text-xs font-bold text-neutral-400 font-mono">{p.siret ?? "—"}</span>
                <span className="text-xs font-bold text-neutral-400">{p.subscription_plan ?? "—"}</span>
                <button
                  onClick={() => act("pro_set_status", { id: p.id, value: p.subscription_status === "active" ? "inactive" : "active" },
                    p.subscription_status === "active" ? "Abonnement désactivé" : "Abonnement activé")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${
                    p.subscription_status === "active" ? "bg-mint/15 text-mint" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {p.subscription_status === "active" ? "Actif" : "Inactif"}
                </button>
                <button
                  onClick={() => act("pro_toggle_verif", { id: p.id, value: !p.siret_verified },
                    p.siret_verified ? "Vérification retirée" : "SIRET marqué vérifié")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${
                    p.siret_verified ? "bg-sky/15 text-sky" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.siret_verified ? "✓ Vérifié" : "⏳ À vérifier"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== ASSOCIATIONS ===== */}
        {!loading && tab === "assos" && data?.data && (
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {data.data.length === 0 && <p className="text-center text-sm font-bold text-neutral-400 py-10">Aucune association.</p>}
            {data.data.map((a: any) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <a href={`/association/${a.id}`} target="_blank" className="flex-1 min-w-[180px] font-bold text-sm hover:text-lilac">{a.nom}</a>
                <span className="text-xs font-bold text-neutral-400">{a.communes?.nom}</span>
                <span className="text-xs font-bold text-neutral-400">{a.profiles?.full_name}</span>
                {a.rna ? (
                  <a href={`https://www.journal-officiel.gouv.fr/pages/associations-recherche/?q=${a.rna}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono font-bold text-sky hover:underline" title="Vérifier au Journal Officiel">{a.rna} ↗</a>
                ) : <span className="text-xs font-bold text-red-400">RNA manquant</span>}
                <button
                  onClick={() => act("asso_toggle_verif", { id: a.id, value: !a.is_verified }, a.is_verified ? "Validation retirée" : "Association validée")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${a.is_verified ? "bg-lilac/15 text-lilac" : "bg-amber-100 text-amber-700"}`}
                >
                  {a.is_verified ? "✓ Validée" : "⏳ À valider"}
                </button>
                <button onClick={() => { if (window.confirm("Supprimer cette association et ses événements ?")) act("asso_supprimer", { id: a.id }, "Association supprimée"); }}
                  className="text-xs font-bold text-neutral-300 hover:text-red-500 transition">🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* ===== MAIRIES ===== */}
        {!loading && tab === "mairies" && data && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <h3 className="font-bold text-sm mb-1">Certifier / retirer une commune (par slug)</h3>
                <p className="text-[11px] text-neutral-400 font-body font-semibold mb-3">Pour les mairies payant par mandat administratif. Celles payant par carte sont certifiées automatiquement par Stripe.</p>
                <div className="flex gap-2">
                  <input
                    value={certifSlug}
                    onChange={(e) => setCertifSlug(e.target.value)}
                    placeholder="ex : limetz-villez"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none font-body"
                  />
                  <button
                    onClick={() => act("commune_toggle_certif", { slug: certifSlug.trim() }, "Certification basculée")}
                    className="bg-sky text-white text-xs font-bold px-4 rounded-xl"
                  >
                    Basculer
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <h3 className="font-bold text-sm mb-3">Rattacher un agent mairie</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="email du compte"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none font-body"
                  />
                  <input
                    value={agentSlug}
                    onChange={(e) => setAgentSlug(e.target.value)}
                    placeholder="slug commune"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none font-body"
                  />
                  <button
                    onClick={() => act("agent_ajouter", { email: agentEmail.trim(), slug: agentSlug.trim() }, "Agent rattaché")}
                    className="bg-sky text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                  >
                    Rattacher
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">Communes certifiées ({data.certif?.length ?? 0})</h3>
              <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                {data.certif?.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <a href={`/${c.slug}`} target="_blank" className="flex-1 font-bold text-sm hover:text-sky">
                      {c.nom}
                    </a>
                    <span className="text-xs font-bold text-neutral-400">{c.departement}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky text-white">✓ Certifiée</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">Agents rattachés</h3>
              <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                {data.agents?.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex-1 font-bold text-sm">{a.profiles?.full_name}</span>
                    <span className="text-xs font-bold text-neutral-400">{a.communes?.nom}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-100">{a.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== RÉGLAGES ===== */}
        {!loading && tab === "reglages" && data?.data && (() => {
          const m = data.data.maintenance ?? { enabled: false, message: "" };
          return (
            <div className="space-y-4 max-w-2xl">
              {/* Test des emails */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h3 className="font-bold text-lg">✉️ Tester les emails</h3>
                <p className="text-sm text-neutral-500 font-body mt-1 mb-4">
                  Envoie les 6 modèles (bienvenue, message, question, résumé quotidien, vigilance, commune certifiée) sur votre adresse, avec des données d&apos;exemple.
                </p>
                <button
                  onClick={async () => { setEmailTesting(true); setEmailTest(null); const r = await api("test_emails"); setEmailTest(r); setEmailTesting(false); }}
                  disabled={emailTesting}
                  className="text-sm font-bold px-5 py-2.5 rounded-full bg-ink text-white hover:bg-ink/85 transition disabled:opacity-50"
                >
                  {emailTesting ? "Envoi en cours..." : "Envoyer les 6 emails de test"}
                </button>
                {emailTest && (
                  <div className="mt-4 text-sm font-body space-y-1">
                    {emailTest.error ? <p className="text-red-600 font-bold">{emailTest.error}</p> : (
                      <>
                        <p className="text-xs font-bold text-neutral-400 mb-2">Envoyés à {emailTest.to}</p>
                        {Object.entries(emailTest.results ?? {}).map(([k, v]: any) => (
                          <p key={k} className={v.startsWith("✓") ? "text-mint" : "text-red-600"}><span className="font-bold capitalize">{k}</span> · {v}</p>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border p-6 ${m.enabled ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">🛠️ Mode maintenance</h3>
                    <p className="text-sm text-neutral-500 font-body mt-1">
                      Quand il est actif, tous les visiteurs voient une page d&apos;attente. Les administrateurs continuent d&apos;accéder au site normalement. Prise d&apos;effet sous 30 secondes.
                    </p>
                    <p className={`text-sm font-bold mt-3 ${m.enabled ? "text-red-600" : "text-mint"}`}>
                      {m.enabled ? "● Maintenance ACTIVE — le site est fermé au public" : "● Site en ligne"}
                    </p>
                  </div>
                  <button
                    onClick={() => act("set_maintenance", { enabled: !m.enabled, message: maintMsg || m.message }, m.enabled ? "Site remis en ligne" : "Maintenance activée")}
                    className={`flex-shrink-0 text-sm font-bold px-5 py-3 rounded-full transition ${m.enabled ? "bg-mint text-white hover:bg-mint/90" : "bg-red-500 text-white hover:bg-red-600"}`}
                  >
                    {m.enabled ? "Remettre en ligne" : "Activer la maintenance"}
                  </button>
                </div>
                <div className="mt-5">
                  <label className="block text-xs font-bold text-neutral-500 mb-1.5">Message affiché aux visiteurs</label>
                  <textarea
                    defaultValue={m.message}
                    onChange={(e) => setMaintMsg(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Nous améliorons le site pour vous. Revenez dans quelques instants !"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-ink transition font-body resize-none"
                  />
                  <button
                    onClick={() => act("set_maintenance", { enabled: m.enabled, message: maintMsg || m.message }, "Message enregistré")}
                    className="mt-2 text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-ink transition"
                  >
                    Enregistrer le message
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== MESSAGES CONTACT ===== */}
        {!loading && tab === "contacts" && data?.data && (
          <div className="space-y-3">
            {data.data.length === 0 && (
              <p className="text-center text-sm font-bold text-neutral-400 py-10">Aucun message.</p>
            )}
            {data.data.map((m: any) => (
              <div key={m.id} className={`bg-white rounded-2xl border p-5 ${m.traite ? "border-neutral-200 opacity-60" : "border-coral/30"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-coral-dark uppercase">{m.sujet}</p>
                    <p className="font-bold text-sm mt-1">
                      {m.nom ?? "Anonyme"} · <a href={`mailto:${m.email}`} className="text-sky hover:underline">{m.email}</a>
                    </p>
                    <p className="text-sm text-neutral-600 font-body mt-2 whitespace-pre-line">{m.message}</p>
                    <p className="text-[11px] font-bold text-neutral-300 mt-2">
                      {new Date(m.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {!m.traite && (
                    <button
                      onClick={() => act("contact_traiter", { id: m.id }, "Message marqué traité")}
                      className="text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-mint hover:text-mint transition flex-shrink-0"
                    >
                      ✓ Traité
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
