"use client";

import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, List, Row, Pill, Meta, IconBtn, Loading } from "@/components/admin/ui";

export default function Page() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("assos");
  const list = data?.data ?? [];
  return (
    <>
      <PageHeader title="Associations" subtitle="Vérifiez le RNA au Journal Officiel avant de valider." />
      {loading ? <Loading /> : (
        <List count={list.length} empty="Aucune association.">
          {list.map((a: any) => (
            <Row key={a.id}>
              <a href={`/association/${a.id}`} target="_blank" className="flex-1 min-w-[180px] font-bold text-sm hover:text-lilac">{a.nom}</a>
              <Meta>{a.communes?.nom}</Meta>
              <Meta>{a.profiles?.full_name}</Meta>
              {a.rna ? (
                <a href={`https://www.journal-officiel.gouv.fr/pages/associations-recherche/?q=${a.rna}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono font-bold text-sky hover:underline" title="Vérifier au Journal Officiel">{a.rna} ↗</a>
              ) : <Pill tone="red">RNA manquant</Pill>}
              <Pill tone={a.is_verified ? "lilac" : "amber"}
                onClick={() => act("asso_toggle_verif", { id: a.id, value: !a.is_verified }, a.is_verified ? "Validation retirée" : "Association validée")}>
                {a.is_verified ? "✓ Validée" : "⏳ À valider"}
              </Pill>
              <IconBtn title="Supprimer" onClick={() => { if (window.confirm("Supprimer cette association et ses événements ?")) act("asso_supprimer", { id: a.id }, "Association supprimée"); }}>🗑️</IconBtn>
            </Row>
          ))}
        </List>
      )}
    </>
  );
}
