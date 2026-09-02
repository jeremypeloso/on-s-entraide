"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, Card, Btn, Loading, Tabs, fmtDate } from "@/components/admin/ui";

function Signalements() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("signalements");
  if (loading || !data) return <Loading />;
  const list = data.data ?? [];
  if (list.length === 0) return <Card className="px-6 py-14 text-center text-sm font-bold text-neutral-400">🎉 Aucun signalement en attente.</Card>;
  return (
    <div className="space-y-3">
      {list.map((s: any) => (
        <Card key={s.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-red-500 uppercase">{s.motif}</p>
              <p className="font-bold text-sm mt-1">
                {s.annonces ? <a href={`/annonce/${s.annonces.id}`} target="_blank" className="hover:text-coral underline">{s.annonces.title}</a> : "Annonce déjà supprimée"}
              </p>
              <p className="text-xs text-neutral-400 font-body font-semibold mt-0.5">
                Auteur : {s.annonces?.profiles?.full_name ?? "?"} · Signalé par {s.reporter?.full_name ?? "?"} le {fmtDate(s.created_at)}
              </p>
              {s.commentaire && <p className="text-sm text-neutral-600 font-body mt-2 bg-neutral-50 rounded-xl px-3 py-2">« {s.commentaire} »</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {s.annonces && <Btn tone="danger" onClick={() => act("signalement_traiter", { annonceId: s.annonces.id }, "Annonce supprimée")}>Supprimer l'annonce</Btn>}
              <Btn onClick={() => act("signalement_rejeter", { id: s.id }, "Signalement rejeté")}>Rejeter</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Avis() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("avis_signales");
  if (loading || !data) return <Loading />;
  const list = data.data ?? [];
  if (list.length === 0) return <Card className="px-6 py-14 text-center text-sm font-bold text-neutral-400">🎉 Aucun avis signalé.</Card>;
  return (
    <div className="space-y-3">
      {list.map((s: any) => (
        <Card key={s.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-red-500 uppercase">{s.motif}</p>
              <p className="text-xs font-bold text-neutral-400 mt-0.5">Signalé par <a href={`/pro/${s.pro_id}`} target="_blank" className="underline">{s.pro?.business_name}</a></p>
              {s.commentaire && <p className="text-xs text-neutral-500 font-body mt-1">« {s.commentaire} »</p>}
              {s.pro_reviews ? (
                <div className="mt-3 bg-neutral-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold">{s.pro_reviews.profiles?.full_name ?? "?"} · {"★".repeat(s.pro_reviews.rating)}{"☆".repeat(5 - s.pro_reviews.rating)} · {fmtDate(s.pro_reviews.created_at)}</p>
                  <p className="text-sm text-neutral-600 font-body mt-1">{s.pro_reviews.body ?? "(sans commentaire)"}</p>
                </div>
              ) : <p className="text-xs text-neutral-400 mt-2">Avis déjà supprimé</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {s.pro_reviews && <Btn tone="danger" onClick={() => act("avis_supprimer", { reviewId: s.pro_reviews.id }, "Avis supprimé")}>Supprimer l'avis</Btn>}
              <Btn onClick={() => act("avis_signalement_rejeter", { id: s.id }, "Signalement rejeté, avis conservé")}>Conserver l'avis</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Inner() {
  const params = useSearchParams();
  const { counts } = useAdmin();
  const [tab, setTab] = useState<"annonces" | "avis">(params.get("tab") === "avis" ? "avis" : "annonces");
  return (
    <>
      <PageHeader title="Modération" subtitle="Signalements des habitants sur les annonces et les avis pros." />
      <Tabs value={tab} onChange={setTab} items={[
        { id: "annonces", label: "Annonces signalées", count: counts.signalements },
        { id: "avis", label: "Avis signalés", count: counts.avisSignales },
      ]} />
      {tab === "annonces" ? <Signalements /> : <Avis />}
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Inner /></Suspense>;
}
