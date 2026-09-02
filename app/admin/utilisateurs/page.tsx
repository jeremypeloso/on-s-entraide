"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, List, Row, Pill, Avatar, Meta, Input, Btn, Loading, fmtDate, ApiError } from "@/components/admin/ui";

export default function Page() {
  const { act } = useAdmin();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<{ search?: string }>({});
  const { data, loading } = useAdminData("users", query);
  const list = data?.data ?? [];

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Les 50 derniers inscrits, ou une recherche par nom.">
        <form onSubmit={(e) => { e.preventDefault(); setQuery({ search }); }} className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom…" className="w-56" />
          <Btn tone="dark" size="md" type="submit">Chercher</Btn>
        </form>
      </PageHeader>
      {loading ? <Loading /> : (<>
        <ApiError error={data?.error} />
        <List count={list.length} empty="Aucun utilisateur trouvé.">
          {list.map((u: any) => (
            <Row key={u.id}>
              <Avatar name={u.full_name} />
              <span className="flex-1 min-w-[140px] font-bold text-sm">{u.full_name ?? "—"}</span>
              <Meta>{u.communes?.nom ?? "Pas de commune"}</Meta>
              <Meta>Inscrit le {fmtDate(u.created_at)}</Meta>
              {u.is_admin && <Pill tone="ink">Admin</Pill>}
              {u.ambassadeur_statut ? (
                <Pill tone="coral">📣 Ambassadeur</Pill>
              ) : (
                <Btn onClick={() => { if (window.confirm(`Nommer ${u.full_name ?? "cet utilisateur"} ambassadeur ? Il devra accepter les conditions du programme à sa première visite.`)) act("ambassadeur_nommer", { user_id: u.id }, "Ambassadeur nommé"); }}>
                  Nommer ambassadeur
                </Btn>
              )}
            </Row>
          ))}
        </List>
      </>)}
    </>
  );
}
