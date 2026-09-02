"use client";

import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, List, Row, Pill, IconBtn, Meta, Loading } from "@/components/admin/ui";

export default function Page() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("annonces");
  const list = data?.data ?? [];
  return (
    <>
      <PageHeader title="Annonces" subtitle="Les 50 dernières annonces publiées, toutes communes confondues." />
      {loading ? <Loading /> : (
        <List count={list.length} empty="Aucune annonce.">
          {list.map((a: any) => (
            <Row key={a.id}>
              <span className="text-lg">{a.categories?.emoji}</span>
              <a href={`/annonce/${a.id}`} target="_blank" className="flex-1 min-w-[180px] font-bold text-sm truncate hover:text-coral">{a.title}</a>
              <Meta>{a.communes?.nom}</Meta>
              <Meta>{a.profiles?.full_name}</Meta>
              <Pill tone={a.statut === "disponible" ? "mint" : a.statut === "reserve" ? "amber" : "neutral"}>{a.statut}</Pill>
              {a.is_sponsored && <Pill tone="amber">Sponsorisée</Pill>}
              <IconBtn title="Supprimer" onClick={() => { if (window.confirm("Supprimer cette annonce ?")) act("annonce_supprimer", { id: a.id }, "Annonce supprimée"); }}>🗑️</IconBtn>
            </Row>
          ))}
        </List>
      )}
    </>
  );
}
