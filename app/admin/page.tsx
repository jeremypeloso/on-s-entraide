"use client";

import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminContext";
import { PageHeader, Card } from "@/components/admin/ui";

export default function AdminHome() {
  const { counts: c } = useAdmin();

  const todo = [
    { n: c.signalements, label: "signalement(s) d'annonce", href: "/admin/moderation", icon: "🚩" },
    { n: c.avisSignales, label: "avis signalé(s)", href: "/admin/moderation?tab=avis", icon: "⭐" },
    { n: c.contacts, label: "message(s) à traiter", href: "/admin/messages", icon: "📬" },
    { n: c.assosAttente, label: "association(s) à valider", href: "/admin/associations", icon: "🎭" },
    { n: c.ambCandidats, label: "candidature(s) ambassadeur", href: "/admin/ambassadeurs", icon: "📣" },
    { n: c.cartesAttente, label: "carte(s) cadeau à envoyer", href: "/admin/ambassadeurs", icon: "🎁" },
  ].filter((t) => (t.n ?? 0) > 0);

  const kpis = [
    { label: "Habitants inscrits", value: c.users, sub: "comptes créés", color: "from-coral to-pink" },
    { label: "Annonces actives", value: c.annoncesActives, sub: `${c.annonces ?? 0} au total`, color: "from-sun to-coral" },
    { label: "Pros abonnés", value: c.prosActifs, sub: `${c.pros ?? 0} inscrits`, color: "from-mint to-sky" },
    { label: "Communes certifiées", value: c.certifiees, sub: "mairies abonnées", color: "from-sky to-lilac" },
    { label: "Ambassadeurs actifs", value: c.ambActifs, sub: `${c.ambCandidats ?? 0} en attente`, color: "from-lilac to-pink" },
    { label: "Questions publiques", value: c.comments, sub: "sous les annonces", color: "from-ink to-lilac" },
  ];

  return (
    <>
      <PageHeader title="Bonjour 👋" subtitle={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} />

      {todo.length > 0 ? (
        <Card className="p-5 mb-6" tone="warn">
          <p className="text-sm font-extrabold mb-3">À traiter aujourd'hui</p>
          <div className="flex flex-wrap gap-2">
            {todo.map((t) => (
              <Link key={t.label} href={t.href} className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-full px-4 py-2 text-sm font-bold hover:border-ink transition">
                <span>{t.icon}</span><span className="text-coral-dark">{t.n}</span> {t.label}
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-5 mb-6"><p className="text-sm font-bold text-mint">🎉 Tout est à jour, rien à traiter.</p></Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 relative overflow-hidden">
            <span className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${k.color}`} />
            <p className="text-3xl font-extrabold mt-1">{k.value ?? 0}</p>
            <p className="text-sm font-bold mt-1">{k.label}</p>
            <p className="text-xs font-body text-neutral-400 mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
