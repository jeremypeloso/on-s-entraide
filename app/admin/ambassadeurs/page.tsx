"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, Card, List, Row, Pill, Avatar, Meta, Btn, IconBtn, Input, Section, Tabs, Loading, fmtDate, ApiError } from "@/components/admin/ui";
import { BAREME, PALIERS } from "@/lib/ambassadeurs";

export default function Page() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("ambassadeurs");
  const [tab, setTab] = useState<"actifs" | "candidats" | "inactifs">("actifs");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const ambs: any[] = data?.data ?? [];
  const recs: any[] = data?.recompenses ?? [];
  const attente = recs.filter((r) => r.statut === "en_attente");
  const historique = recs.filter((r) => r.statut !== "en_attente");
  const candidats = ambs.filter((a) => a.statut === "candidat");
  const list = ambs.filter((a) => a.statut === (tab === "actifs" ? "actif" : tab === "candidats" ? "candidat" : "inactif"));

  return (
    <>
      <PageHeader title="Ambassadeurs" subtitle={`Barème : ${BAREME.habitant} pts par habitant (bloqués), ${BAREME.pro} pts par pro (+${BAREME.deblocageParPro} débloqués), ${BAREME.collectivite} pts par mairie (+${BAREME.deblocageParCollectivite} débloqués). Paliers : ${PALIERS.map((p) => `${p.points} pts = ${p.montant} €`).join(", ")}.`} />

      {loading ? <Loading /> : (<>
        <ApiError error={data?.error} />
        <>
          {/* Cartes cadeaux à envoyer */}
          <Section title="Cartes cadeaux à envoyer" count={attente.length} className="mb-8">
            {attente.length === 0 ? (
              <Card className="px-6 py-8 text-center text-sm font-bold text-neutral-400">Aucune demande en attente.</Card>
            ) : (
              <div className="space-y-3">
                {attente.map((r) => (
                  <Card key={r.id} tone="warn" className="p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <Avatar name={r.full_name} gradient="from-sun to-coral" />
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-bold text-sm">{r.full_name ?? "—"} <span className="text-neutral-400 font-semibold">· {r.commune}</span></p>
                        <p className="text-xs font-bold text-neutral-400 mt-0.5">
                          {r.email ? <a href={`mailto:${r.email}`} className="text-sky hover:underline">{r.email}</a> : "email inconnu"} · demandé le {fmtDate(r.created_at)}
                        </p>
                      </div>
                      <p className="text-2xl font-extrabold">{r.montant} €</p>
                      <Meta>{r.points} pts</Meta>
                      <Btn tone="primary" onClick={() => { setNoteFor(noteFor === r.id ? null : r.id); setNote(""); }}>🎁 Marquer envoyée</Btn>
                      <IconBtn title="Annuler la demande (points rendus)" onClick={() => { if (window.confirm("Annuler cette demande ? Les points seront rendus à l'ambassadeur.")) act("recompense_annuler", { id: r.id }, "Demande annulée, points rendus"); }}>✕</IconBtn>
                    </div>
                    {noteFor === r.id && (
                      <div className="mt-4 border-t border-amber-200/60 pt-4 flex flex-col sm:flex-row gap-2">
                        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note pour l'email (code de la carte, enseigne…) — facultatif" className="flex-1" />
                        <Btn tone="mint" size="md" onClick={async () => { if (await act("recompense_envoyee", { id: r.id, note }, "Carte marquée envoyée, l'ambassadeur est prévenu par email")) setNoteFor(null); }}>Confirmer l'envoi</Btn>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {/* Ambassadeurs */}
          <Section title="Ambassadeurs" className="mb-8">
            <Tabs value={tab} onChange={setTab} items={[
              { id: "actifs", label: "Actifs", count: ambs.filter((a) => a.statut === "actif").length },
              { id: "candidats", label: "Candidatures", count: candidats.length },
              { id: "inactifs", label: "Inactifs" },
            ]} />
            <List count={list.length} empty={tab === "candidats" ? "Aucune candidature en attente." : "Personne ici."}>
              {list.map((a) => {
                const s = a.stats ?? {};
                return (
                  <div key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Avatar name={a.full_name} gradient="from-coral to-lilac" />
                      <div className="flex-1 min-w-[160px]">
                        <p className="font-bold text-sm">{a.full_name ?? "—"} <span className="text-neutral-400 font-semibold">· {a.commune}</span></p>
                        <p className="text-xs font-bold text-neutral-400 mt-0.5">
                          {a.email ? <a href={`mailto:${a.email}`} className="text-sky hover:underline">{a.email}</a> : "—"} · <span className="font-mono">{a.ref_code}</span> · depuis le {fmtDate(a.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5" title="Habitants · Pros · Mairies">
                        <Pill tone="neutral">👥 {s.habitants ?? 0}</Pill>
                        <Pill tone="neutral">💼 {s.pros ?? 0}</Pill>
                        <Pill tone="neutral">🏛️ {s.collectivites ?? 0}</Pill>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold leading-none">{s.points_disponibles ?? 0} <span className="text-xs text-neutral-400">pts dispo.</span></p>
                        <p className="text-[11px] font-bold text-neutral-400 mt-1">{(s.points_total ?? 0) - (s.points_debloques ?? 0)} bloqués · {s.points_depenses ?? 0} dépensés</p>
                      </div>
                      {a.conditions_accepted_at
                        ? <Pill tone="mint" title={`Conditions ${a.conditions_version} acceptées le ${fmtDate(a.conditions_accepted_at)}`}>✓ Conditions</Pill>
                        : <Pill tone="amber" title="N'a pas encore accepté les conditions du programme">⏳ Conditions</Pill>}
                      {a.statut === "candidat" ? (
                        <Btn tone="primary" onClick={() => act("ambassadeur_set_statut", { id: a.id, value: "actif" }, "Ambassadeur activé")}>Valider</Btn>
                      ) : (
                        <Btn onClick={() => act("ambassadeur_set_statut", { id: a.id, value: a.statut === "actif" ? "inactif" : "actif" }, a.statut === "actif" ? "Ambassadeur désactivé" : "Ambassadeur réactivé")}>
                          {a.statut === "actif" ? "Désactiver" : "Réactiver"}
                        </Btn>
                      )}
                      <IconBtn title="Supprimer" onClick={() => { if (window.confirm("Supprimer cet ambassadeur, ses parrainages et ses demandes ?")) act("ambassadeur_supprimer", { id: a.id }, "Ambassadeur supprimé"); }}>🗑️</IconBtn>
                    </div>
                    {a.motivation && <p className="mt-2 text-xs font-body text-neutral-500 pl-[52px]">« {a.motivation} »</p>}
                  </div>
                );
              })}
            </List>
          </Section>

          {/* Historique */}
          <Section title="Historique des cartes" count={historique.length}>
            <List count={historique.length} empty="Aucune carte envoyée pour l'instant.">
              {historique.map((r) => (
                <Row key={r.id}>
                  <span className="flex-1 min-w-[160px] font-bold text-sm">{r.full_name ?? "—"}</span>
                  <span className="font-extrabold">{r.montant} €</span>
                  <Meta>{r.points} pts</Meta>
                  <Meta>{r.sent_at ? `envoyée le ${fmtDate(r.sent_at)}` : `demandée le ${fmtDate(r.created_at)}`}</Meta>
                  {r.note && <Meta>{r.note}</Meta>}
                  <Pill tone={r.statut === "envoyee" ? "mint" : "neutral"}>{r.statut === "envoyee" ? "Envoyée" : "Annulée"}</Pill>
                </Row>
              ))}
            </List>
          </Section>
        </>
      </>)}
    </>
  );
}
