"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Amb = { id: string; nom: string; commune: string; ref_code: string; statut: string };
type Stats = { habitants: number; pros: number; collectivites: number };
type Parr = { type: string; created_at: string };

const LABEL: Record<string, string> = { habitant: "Habitant", pro: "Pro", collectivite: "Collectivité" };

export default function EspaceAmbassadeurPage() {
  const router = useRouter();
  const [amb, setAmb] = useState<Amb | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [derniers, setDerniers] = useState<Parr[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      const { data: a } = await supabase.from("ambassadeurs").select("id, nom, commune, ref_code, statut").eq("user_id", user.id).maybeSingle();
      if (!a) { router.push("/ambassadeurs#candidature"); return; }
      setAmb(a);
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("ambassadeur_stats").select("*").eq("ambassadeur_id", a.id).maybeSingle(),
        supabase.from("parrainages").select("type, created_at").eq("ambassadeur_id", a.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setStats(s ?? { habitants: 0, pros: 0, collectivites: 0 });
      setDerniers(p ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !amb) {
    return <main className="font-display min-h-[60vh] flex items-center justify-center"><p className="text-neutral-400 font-bold animate-pulse">Chargement…</p></main>;
  }

  const lien = `https://onseditout.fr/?ref=${amb.ref_code}`;
  const actif = amb.statut === "actif";

  return (
    <main className="font-display bg-neutral-100 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="text-sm font-bold text-neutral-400">📣 Ambassadeur · {amb.commune}</p>
        <h1 className="text-3xl font-extrabold mt-1">Bonjour {amb.nom.split(" ")[0]} 👋</h1>

        {!actif && (
          <p className="mt-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-body rounded-2xl px-5 py-4">
            {amb.statut === "candidat"
              ? "Votre candidature est en cours de validation. Votre lien de parrainage sera actif dès confirmation."
              : "Votre compte ambassadeur est inactif. Contactez-nous si vous souhaitez le réactiver."}
          </p>
        )}

        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm font-bold text-neutral-500">Votre lien de parrainage</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <code className="flex-1 min-w-[220px] bg-neutral-100 rounded-xl px-4 py-2.5 text-sm font-mono break-all">{lien}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(lien); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-sm font-bold bg-ink text-white px-5 py-2.5 rounded-full hover:bg-ink/90 transition"
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
          <p className="font-body text-xs text-neutral-400 mt-3">Partagez-le dans les groupes Facebook de {amb.commune}, sur vos flyers ou à vos commerçants. Toute inscription qui passe par ce lien vous est attribuée pendant 30 jours.</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
          {[["👥 Habitants", stats?.habitants], ["💼 Pros", stats?.pros], ["🏛️ Collectivités", stats?.collectivites]].map(([l, v]) => (
            <div key={String(l)} className="bg-white rounded-2xl border border-neutral-200 p-5 text-center">
              <p className="text-3xl font-extrabold">{v ?? 0}</p>
              <p className="text-xs font-bold text-neutral-500 mt-1">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-gradient-to-br from-coral to-coral-dark text-white rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">Mois d'abonnement offerts cumulés</p>
            <p className="font-body text-sm text-white/80">Un mois par pro parrainé, à faire valoir sur votre propre abonnement pro.</p>
          </div>
          <p className="text-4xl font-extrabold">{stats?.pros ?? 0}</p>
        </div>

        <div className="mt-8">
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
      </div>
    </main>
  );
}
