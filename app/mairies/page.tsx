const PLANS = [
  {
    name: "Village",
    emoji: "🏡",
    pop: "Moins de 2 000 habitants",
    price: "39€",
    period: "/mois",
    highlight: false,
    features: [
      "Badge « Commune certifiée ✓ »",
      "Alertes officielles illimitées",
      "Alertes épinglées en haut de la page commune",
      "Compte mairie multi-agents (2 comptes)",
    ],
  },
  {
    name: "Bourg",
    emoji: "⛪",
    pop: "2 000 à 10 000 habitants",
    price: "49€",
    oldPrice: "99€",
    period: "/mois",
    launchNote: "Offre de lancement : 49€/mois la première année, puis 99€/mois.",
    highlight: true,
    features: [
      "Tout Village, plus :",
      "Notifications aux habitants abonnés",
      "Statistiques de lecture des alertes",
      "Compte mairie multi-agents (5 comptes)",
      "Support prioritaire",
    ],
  },
  {
    name: "Ville",
    emoji: "🏙️",
    pop: "Plus de 10 000 habitants",
    price: "199€",
    period: "/mois",
    highlight: false,
    features: [
      "Tout Bourg, plus :",
      "Alertes par quartier",
      "Comptes agents illimités",
      "Accompagnement au lancement",
      "Interlocuteur dédié",
    ],
  },
];

const FEATURES = [
  {
    emoji: "📢",
    title: "Vos alertes officielles, au bon endroit",
    desc: "Travaux, coupures d'eau, arrêtés, événements : vos informations apparaissent en tête de la page de votre commune, distinctes des annonces des habitants et signées de votre badge officiel.",
  },
  {
    emoji: "✓",
    title: "Le badge « Commune certifiée »",
    desc: "Bleu institutionnel, activé uniquement après vérification d'un justificatif officiel de la mairie. Il ne s'achète pas en libre-service : c'est ce qui garantit aux habitants que l'information vient bien de vous.",
  },
  {
    emoji: "🔔",
    title: "Un canal direct, sans algorithme",
    desc: "Contrairement aux réseaux sociaux, 100% de vos habitants inscrits voient vos alertes. Pas de portée limitée, pas de publicité au milieu, pas de compte à animer quotidiennement.",
  },
  {
    emoji: "👀",
    title: "Un module vigilance encadré",
    desc: "Les signalements non urgents de vos habitants (dépôts sauvages, éclairage en panne, dégradations) sont réservés aux résidents vérifiés, avec rappel permanent des numéros d'urgence 17, 15 et 112.",
  },
  {
    emoji: "🤝",
    title: "Là où vos habitants sont déjà",
    desc: "Vos administrés utilisent la plateforme pour s'entraider au quotidien. Vos informations les touchent dans leur usage naturel, sans leur demander d'installer une énième application.",
  },
  {
    emoji: "📊",
    title: "La preuve que ça sert",
    desc: "Statistiques de lecture par alerte : vous savez combien d'habitants ont vu chaque information, un indicateur concret à présenter en conseil municipal.",
  },
];

const FAQ = [
  {
    q: "Comment obtenir le badge « Commune certifiée » ?",
    a: "Après souscription, nous demandons un justificatif officiel (courrier signé du maire ou du secrétariat général, email en @mairie-xxx.fr, ou délibération). Le badge est activé sous 48h après vérification. Aucune activation automatique : c'est la condition de sa crédibilité.",
  },
  {
    q: "La page de notre commune existe déjà ?",
    a: "Oui. Les 34 969 communes françaises ont chacune leur page dès aujourd'hui. Sans certification, elle affiche les annonces des habitants. La certification vous donne la main sur les alertes officielles et le badge.",
  },
  {
    q: "Qui peut publier des alertes officielles ?",
    a: "Uniquement les comptes agents rattachés à votre mairie après certification. Chaque alerte est signée du badge officiel, impossible à imiter par un particulier.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "L'abonnement est annuel, résiliable chaque année. Nous proposons deux mois offerts pour tout engagement de deux ans.",
  },
  {
    q: "Et par rapport à Panneau Pocket ou IntraMuros ?",
    a: "Ces outils diffusent l'information descendante. Onseditout y ajoute la vie locale : vos habitants y sont déjà pour s'entraider entre voisins, vos alertes s'insèrent dans un usage quotidien plutôt que dans une application dédiée ouverte occasionnellement.",
  },
];

export default function MairiesPage() {
  return (
    <main className="font-display">
      {/* ===== Hero institutionnel ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky to-lilac py-20">
        <div className="blob w-80 h-80 bg-white -top-24 -right-16 opacity-10" />
        <div className="blob w-64 h-64 bg-ink -bottom-16 -left-10 opacity-10" style={{ animationDelay: "3s" }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 px-4 py-1.5 rounded-full mb-5">
            🏛️ Offre communes &amp; mairies
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Informez vos habitants là où ils s&apos;entraident déjà
          </h1>
          <p className="text-white/85 font-body text-lg max-w-xl mx-auto mb-8">
            La page de votre commune existe déjà sur onseditout.fr. Prenez-en les commandes :
            publiez vos alertes officielles avec le badge « Commune certifiée ✓ ».
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-ink font-bold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition"
          >
            Demander une démonstration
          </a>
        </div>
      </section>

      {/* ===== Aperçu badge ===== */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-sky/10 to-lilac/10 border-2 border-sky/20 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 bg-white rounded-2xl shadow-md px-6 py-5 text-center">
              <p className="text-xs font-bold uppercase text-neutral-400 mb-1">Dordogne</p>
              <p className="text-xl font-extrabold flex items-center gap-2 justify-center">
                Saint-Astier
                <span className="text-[11px] bg-sky text-white px-2.5 py-1 rounded-full">✓ Commune certifiée</span>
              </p>
            </div>
            <p className="text-sm text-neutral-500 font-body leading-relaxed">
              Le badge bleu apparaît sur la page de votre commune, sur chacune de vos alertes
              et dans les résultats de recherche. Les habitants identifient immédiatement
              l&apos;information officielle.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Fonctionnalités ===== */}
      <section className="bg-orange-50 py-20 border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Ce que la certification apporte à votre commune
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-3xl p-7 shadow-md border border-neutral-100">
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Tarifs par taille ===== */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="inline-flex text-xs font-bold text-sky bg-sky/10 px-4 py-1.5 rounded-full mb-4">
              💳 Facturation annuelle · Mandat administratif accepté
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Un tarif adapté à votre taille</h2>
            <p className="text-neutral-500 font-body">
              Simple et prévisible pour votre budget communal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-8 border-2 transition ${
                  p.highlight
                    ? "bg-gradient-to-b from-sky/10 to-white border-sky shadow-xl shadow-sky/15 md:-translate-y-3"
                    : "bg-white border-neutral-200 shadow-md"
                }`}
              >
                {p.highlight && (
                  <span className="inline-block text-[11px] font-bold text-white bg-sky px-3 py-1 rounded-full mb-3">
                    🎉 Offre de lancement
                  </span>
                )}
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mt-1 mb-5">{p.pop}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-sm font-bold text-neutral-400">{p.period}</span>
                  {(p as any).oldPrice && (
                    <span className="text-lg font-bold text-neutral-300 line-through">{(p as any).oldPrice}</span>
                  )}
                </div>
                {(p as any).launchNote ? (
                  <p className="text-[11px] font-bold text-sky bg-sky/10 rounded-xl px-3 py-2 mb-4">
                    {(p as any).launchNote}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}
                <ul className="space-y-2.5 mb-8 font-body">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm font-semibold text-ink/80">
                      <span className="text-sky flex-shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/contact"
                  className={`block text-center font-bold py-3.5 rounded-full transition ${
                    p.highlight
                      ? "bg-sky text-white shadow-lg shadow-sky/25 hover:scale-[1.02]"
                      : "border-2 border-ink text-ink hover:bg-ink hover:text-white"
                  }`}
                >
                  Nous contacter
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-neutral-400 font-body font-semibold mt-8">
            Intercommunalités, communautés de communes ou métropoles :{" "}
            <a href="/contact" className="text-sky underline">offre groupée sur devis</a>
          </p>
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="bg-mint/10 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Certifiée en 48h</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, bg: "bg-sky", t: "Demandez la certification", d: "Un échange rapide pour présenter l'outil à vos équipes." },
              { n: 2, bg: "bg-lilac", t: "Justificatif officiel", d: "Courrier signé, email officiel de la mairie ou délibération : nous vérifions sous 48h." },
              { n: 3, bg: "bg-mint", t: "Vous publiez", d: "Badge activé, vos agents publient les alertes, vos habitants sont informés." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-3xl p-7 shadow-md border border-neutral-100 text-center">
                <div className={`w-11 h-11 rounded-2xl ${s.bg} text-white font-bold flex items-center justify-center -rotate-6 mx-auto mb-4`}>
                  {s.n}
                </div>
                <h3 className="font-semibold mb-1.5">{s.t}</h3>
                <p className="text-sm text-neutral-500 font-body">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-white rounded-2xl shadow-sm border border-neutral-200 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-6 py-5 font-bold text-[15px]">
                  {f.q}
                  <span className="text-sky transition group-open:rotate-45 text-xl leading-none">＋</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-neutral-500 font-body leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="bg-white pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden bg-ink rounded-[36px] px-10 py-14 text-center">
            <div className="blob w-64 h-64 bg-sky -top-20 -left-10 opacity-20" />
            <div className="relative z-10">
              <h2 className="text-white text-2xl md:text-4xl font-bold mb-3">
                La page de votre commune vous attend
              </h2>
              <p className="text-white/70 mb-8 font-body">
                Cherchez votre commune sur la page d&apos;accueil pour voir ce que vos habitants y font déjà.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href="/contact"
                  className="inline-block bg-sky text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-sky/30 hover:scale-105 transition"
                >
                  Demander une démonstration
                </a>
                <a
                  href="/"
                  className="inline-block bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-full hover:bg-white/20 transition"
                >
                  Voir ma commune
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
