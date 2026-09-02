"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { PageHeader, Card, List, Row, Pill, Meta, Input, Btn, Section, Loading } from "@/components/admin/ui";

export default function Page() {
  const { act } = useAdmin();
  const { data, loading } = useAdminData("communes_certifiees");
  const [certifSlug, setCertifSlug] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentSlug, setAgentSlug] = useState("");

  return (
    <>
      <PageHeader title="Mairies" subtitle="Communes certifiées et agents rattachés. Les mairies payant par carte sont certifiées automatiquement par Stripe." />

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-1">Certifier / retirer une commune</h3>
          <p className="text-[11px] text-neutral-400 font-body font-semibold mb-3">Par slug, pour les mairies payant par mandat administratif.</p>
          <form onSubmit={(e) => { e.preventDefault(); act("commune_toggle_certif", { slug: certifSlug.trim() }, "Certification basculée"); }} className="flex gap-2">
            <Input value={certifSlug} onChange={(e) => setCertifSlug(e.target.value)} placeholder="ex : limetz-villez" className="flex-1" />
            <Btn tone="dark" size="md" type="submit">Basculer</Btn>
          </form>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-1">Rattacher un agent mairie</h3>
          <p className="text-[11px] text-neutral-400 font-body font-semibold mb-3">L'agent doit déjà avoir un compte sur le site.</p>
          <form onSubmit={(e) => { e.preventDefault(); act("agent_ajouter", { email: agentEmail.trim(), slug: agentSlug.trim() }, "Agent rattaché"); }} className="flex flex-col sm:flex-row gap-2">
            <Input value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} placeholder="email du compte" className="flex-1" />
            <Input value={agentSlug} onChange={(e) => setAgentSlug(e.target.value)} placeholder="slug commune" className="flex-1" />
            <Btn tone="dark" size="md" type="submit">Rattacher</Btn>
          </form>
        </Card>
      </div>

      {loading ? <Loading /> : (
        <>
          <Section title="Communes certifiées" count={data?.certif?.length ?? 0} className="mb-8">
            <List count={data?.certif?.length ?? 0} empty="Aucune commune certifiée.">
              {data?.certif?.map((c: any) => (
                <Row key={c.id}>
                  <a href={`/${c.slug}`} target="_blank" className="flex-1 font-bold text-sm hover:text-sky">{c.nom}</a>
                  <Meta>{c.departement}</Meta>
                  <Pill tone="sky">✓ Certifiée</Pill>
                </Row>
              ))}
            </List>
          </Section>
          <Section title="Agents rattachés" count={data?.agents?.length ?? 0}>
            <List count={data?.agents?.length ?? 0} empty="Aucun agent rattaché.">
              {data?.agents?.map((a: any, i: number) => (
                <Row key={i}>
                  <span className="flex-1 font-bold text-sm">{a.profiles?.full_name}</span>
                  <Meta>{a.communes?.nom}</Meta>
                  <Pill>{a.role}</Pill>
                </Row>
              ))}
            </List>
          </Section>
        </>
      )}
    </>
  );
}
