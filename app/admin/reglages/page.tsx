"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, Card, Btn, Textarea, Loading, fmtDateTime } from "@/components/admin/ui";

export default function Page() {
  const { act, api } = useAdmin();
  const { data, loading } = useAdminData("settings");
  const [maintMsg, setMaintMsg] = useState("");
  const [stripe, setStripe] = useState<any>(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [emails, setEmails] = useState<any>(null);
  const [emailsBusy, setEmailsBusy] = useState(false);

  if (loading || !data) return <><PageHeader title="Réglages" /><Loading /></>;
  const m = data.data?.maintenance ?? { enabled: false, message: "" };

  return (
    <>
      <PageHeader title="Réglages" subtitle="Maintenance, diagnostic Stripe et test des emails." />
      <div className="space-y-4 max-w-2xl">
        <Card className="p-6" tone={m.enabled ? "alert" : undefined}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">🛠️ Mode maintenance</h3>
              <p className="text-sm text-neutral-500 font-body mt-1">Tous les visiteurs voient une page d'attente, les administrateurs continuent d'accéder au site. Prise d'effet sous 30 secondes.</p>
              <p className={`text-sm font-bold mt-3 ${m.enabled ? "text-red-600" : "text-mint"}`}>{m.enabled ? "● Maintenance active, le site est fermé au public" : "● Site en ligne"}</p>
            </div>
            <Btn tone={m.enabled ? "mint" : "danger"} size="md" onClick={() => act("set_maintenance", { enabled: !m.enabled, message: maintMsg || m.message }, m.enabled ? "Site remis en ligne" : "Maintenance activée")}>
              {m.enabled ? "Remettre en ligne" : "Activer"}
            </Btn>
          </div>
          <div className="mt-5">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">Message affiché aux visiteurs</label>
            <Textarea defaultValue={m.message} onChange={(e) => setMaintMsg(e.target.value)} maxLength={300} rows={3} placeholder="Nous améliorons le site pour vous. Revenez dans quelques instants !" />
            <div className="mt-2"><Btn onClick={() => act("set_maintenance", { enabled: m.enabled, message: maintMsg || m.message }, "Message enregistré")}>Enregistrer le message</Btn></div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg">💳 Vérifier Stripe</h3>
          <p className="text-sm text-neutral-500 font-body mt-1 mb-4">Contrôle la clé, le mode (test/live), les tarifs, les coupons, le webhook et les derniers événements reçus.</p>
          <Btn tone="dark" size="md" disabled={stripeBusy} onClick={async () => { setStripeBusy(true); setStripe(null); setStripe(await api("stripe_check")); setStripeBusy(false); }}>
            {stripeBusy ? "Vérification…" : "Lancer le diagnostic"}
          </Btn>
          {stripe && (
            <div className="mt-4 text-sm font-body space-y-3">
              {stripe.errors?.map((e: string, i: number) => <p key={i} className="text-red-600 font-bold">❌ {e}</p>)}
              {stripe.key && (
                <p className={stripe.key.ok ? "text-mint font-bold" : "text-red-600 font-bold"}>
                  {stripe.key.ok ? `✓ Clé valide · mode ${stripe.mode?.toUpperCase()} · compte ${stripe.key.account}` : "❌ Clé invalide"}
                  {stripe.key.ok && (stripe.key.chargesEnabled ? " · paiements activés" : " · ⚠️ paiements non activés")}
                </p>
              )}
              {stripe.mode === "test" && <p className="text-amber-700 font-bold bg-amber-50 rounded-xl px-3 py-2">⚠️ Mode TEST : aucun paiement réel ne sera encaissé.</p>}
              {[["Tarifs", stripe.prices], ["Coupons", stripe.coupons]].map(([label, items]: any) => (
                <div key={label}><p className="text-xs font-bold text-neutral-400 uppercase mb-1">{label}</p>
                  {items?.map((p: any) => <p key={p.label} className={p.ok ? "text-mint" : "text-red-600"}>{p.ok ? "✓" : "❌"} <span className="font-bold">{p.label}</span> · {p.info}</p>)}</div>
              ))}
              <div><p className="text-xs font-bold text-neutral-400 uppercase mb-1">Webhooks</p>
                {stripe.webhooks?.length === 0 && <p className="text-red-600">❌ Aucun webhook enregistré dans ce mode</p>}
                {stripe.webhooks?.map((w: any, i: number) => <p key={i} className={w.ok ? "text-mint" : "text-red-600"}>{w.ok ? "✓" : "❌"} {w.url} · {w.status} · {w.events} événements</p>)}</div>
              <div><p className="text-xs font-bold text-neutral-400 uppercase mb-1">Derniers événements</p>
                {stripe.events?.length === 0 && <p className="text-neutral-400">Aucun événement pour le moment.</p>}
                {stripe.events?.map((e: any, i: number) => <p key={i} className="text-neutral-600">{e.delivered ? "✓" : "⏳"} {e.type} <span className="text-neutral-400">· {fmtDateTime(e.created)}</span></p>)}</div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg">✉️ Tester les emails</h3>
          <p className="text-sm text-neutral-500 font-body mt-1 mb-4">Envoie les modèles (bienvenue, message, question, résumé quotidien, vigilance, commune certifiée) sur votre adresse, avec des données d'exemple.</p>
          <Btn tone="dark" size="md" disabled={emailsBusy} onClick={async () => { setEmailsBusy(true); setEmails(null); setEmails(await api("test_emails")); setEmailsBusy(false); }}>
            {emailsBusy ? "Envoi en cours…" : "Envoyer les emails de test"}
          </Btn>
          {emails && (
            <div className="mt-4 text-sm font-body space-y-1">
              {emails.error ? <p className="text-red-600 font-bold">{emails.error}</p> : (
                <>
                  <p className="text-xs font-bold text-neutral-400 mb-2">Envoyés à {emails.to}</p>
                  {Object.entries(emails.results ?? {}).map(([k, v]: any) => (
                    <p key={k} className={v.startsWith("✓") ? "text-mint" : "text-red-600"}><span className="font-bold capitalize">{k}</span> · {v}</p>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
