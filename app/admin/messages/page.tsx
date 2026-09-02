"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, Card, Btn, IconBtn, Textarea, Tabs, Loading, fmtDateTime } from "@/components/admin/ui";

export default function Page() {
  const { act, api, notify } = useAdmin();
  const { data, loading, reload } = useAdminData("contacts");
  const [view, setView] = useState<"a_traiter" | "archives">("a_traiter");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [noAccount, setNoAccount] = useState<string | null>(null);

  const all = data?.data ?? [];
  const list = all.filter((m: any) => (view === "archives" ? m.traite : !m.traite));
  const nb = all.filter((m: any) => !m.traite).length;

  async function envoyer(m: any) {
    const r = await api("contact_repondre", { id: m.id, body: replyBody });
    if (r.ok) { setReplyFor(null); setReplyBody(""); notify("Réponse envoyée dans la messagerie, l'utilisateur est prévenu par email"); reload(); }
    else if (r.noAccount) setNoAccount(m.id);
    else notify(r.error, "error");
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Formulaire de contact du site. Répondez via la messagerie interne quand l'expéditeur a un compte." />
      <Tabs value={view} onChange={setView} items={[{ id: "a_traiter", label: "À traiter", count: nb }, { id: "archives", label: "Archivés" }]} />
      {loading ? <Loading /> : list.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm font-bold text-neutral-400">{view === "archives" ? "Aucun message archivé." : "🎉 Aucun message à traiter."}</Card>
      ) : (
        <div className="space-y-3">
          {list.map((m: any) => (
            <Card key={m.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-coral-dark uppercase">{m.sujet}</p>
                  <p className="font-bold text-sm mt-1">{m.nom ?? "Anonyme"} · <a href={`mailto:${m.email}`} className="text-sky hover:underline">{m.email}</a></p>
                  <p className="text-sm text-neutral-600 font-body mt-2 whitespace-pre-line">{m.message}</p>
                  <p className="text-[11px] font-bold text-neutral-300 mt-2">{fmtDateTime(m.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Btn tone="dark" onClick={() => { setReplyFor(replyFor === m.id ? null : m.id); setReplyBody(""); setNoAccount(null); }}>💬 Répondre</Btn>
                  <Btn onClick={() => act("contact_traiter", { id: m.id, value: !m.traite }, m.traite ? "Message remis à traiter" : "Message archivé")}>{m.traite ? "↩ Remettre à traiter" : "✓ Archiver"}</Btn>
                  <IconBtn title="Supprimer" onClick={() => { if (window.confirm("Supprimer définitivement ce message ?")) act("contact_supprimer", { id: m.id }, "Message supprimé"); }}>🗑️</IconBtn>
                </div>
              </div>

              {m.thread?.length > 0 && (
                <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase">Conversation · <a href={`/messages/${m.conversation_id}`} className="text-sky normal-case">ouvrir dans la messagerie →</a></p>
                  {m.thread.map((t: any, i: number) => (
                    <div key={i} className={`flex ${t.mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm font-body ${t.mine ? "bg-coral text-white" : "bg-neutral-100 text-ink"}`}>
                        <p className="whitespace-pre-line">{t.body}</p>
                        <p className={`text-[10px] mt-1 ${t.mine ? "text-white/70" : "text-neutral-400"}`}>{t.mine ? "Vous" : m.nom ?? m.email} · {fmtDateTime(t.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyFor === m.id && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={4} maxLength={2000} placeholder={`Bonjour ${m.nom ?? ""},\n\n`} />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Btn tone="primary" disabled={replyBody.trim().length < 2} onClick={() => envoyer(m)}>Envoyer via la messagerie</Btn>
                    <button onClick={() => setReplyFor(null)} className="text-xs font-bold text-neutral-400 px-2">Annuler</button>
                  </div>
                  {noAccount === m.id && (
                    <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
                      Cet expéditeur n'a pas de compte sur le site : la messagerie interne est impossible.{" "}
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: votre message à On se dit tout (${m.sujet})`)}&body=${encodeURIComponent(replyBody)}`} className="underline">Répondre par email →</a>
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
