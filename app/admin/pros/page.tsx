"use client";

import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, List, Row, Pill, Meta, Loading } from "@/components/admin/ui";

export default function Page() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("pros");
  const list = data?.data ?? [];
  return (
    <>
      <PageHeader title="Pros" subtitle="Artisans et commerçants inscrits. Vérifiez le SIRET avant d'activer le badge." />
      {loading ? <Loading /> : (
        <List count={list.length} empty="Aucun pro inscrit.">
          {list.map((p: any) => (
            <Row key={p.id}>
              <a href={`/pro/${p.id}`} target="_blank" className="flex-1 min-w-[160px] font-bold text-sm hover:text-coral">{p.business_name}</a>
              <Meta><span className="font-mono">{p.siret ?? "—"}</span></Meta>
              {p.email && <Meta>{p.email}</Meta>}
              <Pill tone="neutral">{p.subscription_plan ?? "aucun plan"}</Pill>
              <Pill tone={p.subscription_status === "active" ? "mint" : "neutral"}
                onClick={() => act("pro_set_status", { id: p.id, value: p.subscription_status === "active" ? "inactive" : "active" }, p.subscription_status === "active" ? "Abonnement désactivé" : "Abonnement activé")}>
                {p.subscription_status === "active" ? "Abonné" : p.subscription_status === "past_due" ? "Impayé" : "Inactif"}
              </Pill>
              <Pill tone={p.siret_verified ? "sky" : "amber"}
                onClick={() => act("pro_toggle_verif", { id: p.id, value: !p.siret_verified }, p.siret_verified ? "Vérification retirée" : "SIRET marqué vérifié")}>
                {p.siret_verified ? "✓ Vérifié" : "⏳ À vérifier"}
              </Pill>
            </Row>
          ))}
        </List>
      )}
    </>
  );
}
