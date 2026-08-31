"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PLANS = [
  { id: "village", emoji: "🏡", label: "Village", pop: "< 2 000 hab.", price: "39€", note: "soit 468€/an" },
  { id: "bourg", emoji: "⛪", label: "Bourg", pop: "2 000 – 10 000 hab.", price: "49€", cents: "50", oldPrice: "99€", note: "1ère année, puis 99€/mois", highlight: true },
  { id: "ville", emoji: "🏙️", label: "Ville", pop: "> 10 000 hab.", price: "199€", note: "soit 2 388€/an" },
];

export default function MairieAbonnement({ communeId, communeNom, isCertified }: { communeId: string; communeNom: string; isCertified: boolean }) {
  const supabase = createClient();
  const [sub, setSub] = useState<any>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("checkout");
    if (p === "success") setMsg("✓ Paiement validé ! La certification s'active dans quelques secondes.");
    if (p === "cancel") setMsg("Paiement annulé, aucun prélèvement effectué.");
    supabase.from("commune_subscriptions").select("*").eq("commune_id", communeId).maybeSingle().then(({ data }) => setSub(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communeId]);

  async function subscribe(plan: string) {
    setPaying(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "mairie", plan, communeId }),
    });
    const j = await res.json();
    setPaying(null);
    if (j.url) window.location.href = j.url;
    else window.alert(j.error ?? "Paiement indisponible.");
  }

  async function portal() {
    const res = await fetch("/api/stripe/portal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: "/mairie" }),
    });
    const j = await res.json();
    if (j.url) window.location.href = j.url;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
      <h2 className="font-bold text-lg mb-1">💳 Abonnement de {communeNom}</h2>
      <p className="text-sm text-neutral-500 font-body mb-4">
        Facturation annuelle. Paiement par carte en ligne, ou par mandat administratif sur devis.
      </p>
      {msg && <p className="text-sm font-bold text-mint bg-mint/10 rounded-xl px-4 py-2.5 mb-4">{msg}</p>}

      {isCertified ? (
        <div className="bg-sky/5 border border-sky/20 rounded-2xl p-5 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sky">✓ Commune certifiée</p>
            <p className="text-xs text-neutral-500 font-body mt-0.5">
              {sub?.source === "stripe"
                ? `Pack ${sub.plan} · prochaine échéance ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("fr-FR") : ""}`
                : "Abonnement géré par mandat administratif / convention."}
            </p>
          </div>
          {sub?.source === "stripe" && (
            <button onClick={portal} className="text-xs font-bold px-4 py-2 rounded-full border border-neutral-200 hover:border-ink transition">
              Factures et moyen de paiement →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => subscribe(p.id)}
                disabled={!!paying}
                className={`text-left rounded-2xl p-5 border-2 transition disabled:opacity-60 ${p.highlight ? "border-sky bg-sky/5" : "border-neutral-100 hover:border-neutral-300"}`}
              >
                <p className="text-2xl">{p.emoji}</p>
                <p className="font-bold mt-1">{p.label}</p>
                <p className="text-[11px] font-bold text-neutral-400">{p.pop}</p>
                <p className="mt-2"><span className="text-xl font-extrabold text-sky">{p.price}{(p as any).cents && <sup className="text-xs ml-0.5">{(p as any).cents}</sup>}</span><span className="text-xs font-bold text-neutral-400">/mois</span>
                  {p.oldPrice && <span className="text-sm font-bold text-neutral-300 line-through ml-2">{p.oldPrice}</span>}</p>
                <p className="text-[10px] font-bold text-neutral-400">{p.note}</p>
                <p className="text-[11px] font-bold text-sky mt-2">{paying === p.id ? "Redirection..." : "Payer par carte →"}</p>
              </button>
            ))}
          </div>
          <div className="bg-neutral-50 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm">🏛️ Mandat administratif ou bon de commande ?</p>
              <p className="text-xs text-neutral-500 font-body mt-0.5">Nous établissons un devis et une convention, la certification est activée à réception.</p>
            </div>
            <a href="/contact?sujet=mairie" className="text-sm font-bold px-5 py-2.5 rounded-full bg-ink text-white hover:bg-ink/85 transition">
              Demander un devis
            </a>
          </div>
        </>
      )}
    </div>
  );
}
