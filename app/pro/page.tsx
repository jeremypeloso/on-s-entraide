const PLANS = [
  {
    name: "Essentiel",
    emoji: "🔨",
    price: "19€",
    period: "/mois",
    desc: "Pour démarrer et être trouvé par vos voisins.",
    highlight: false,
    features: [
      "Profil pro vérifié (SIRET contrôlé)",
      "Badge « Pro vérifié » sur votre profil",
      "Zone de visibilité : 10 km autour de votre adresse",
      "Services et tarifs affichés",
      "Avis clients authentifiés",
      "Messagerie et demandes de devis",
    ],
    cta: "Commencer",
  },
  {
    name: "Visibilité",
    emoji: "🚀",
    price: "39€",
    period: "/mois",
    desc: "Pour développer votre activité sur votre secteur.",
    highlight: true,
    features: [
      "Tout Essentiel, plus :",
      "Zone de visibilité : 25 km autour de votre adresse",
      "Encart « Pros du quartier » sur toutes les communes de votre zone",
      "1 annonce mise en avant dans le fil / mois",
      "Statistiques de vues et de contacts",
      "Réponse prioritaire du support",
    ],
    cta: "Choisir Visibilité",
  },
  {
    name: "Premium",
    emoji: "⭐",
    price: "79€",
    period: "/mois",
    desc: "Pour dominer votre zone d'intervention.",
    highlight: false,
    features: [
      "Tout Visibilité, plus :",
      "Zone de visibilité : 50 km autour de votre adresse",
      "Bandeau « Pro mis en avant » sur toutes les communes de votre zone",
      "Position prioritaire dans l'encart Pros",
      "Mises en avant illimitées dans le fil",
      "Accompagnement à la création du profil",
    ],
    cta: "Passer Premium",
  },
];

const PLACEMENTS = [
  {
    emoji: "🏙️",
    title: "Le bandeau de ville",
    desc: "Votre activité affichée en haut de la page de chaque commune de votre zone, vue par tous les visiteurs dès leur arrivée.",
    plan: "Premium",
  },
  {
    emoji: "📋",
    title: "L'encart Pros du quartier",
    desc: "Votre fiche dans la colonne dédiée aux professionnels, à côté du fil d'annonces des habitants.",
    plan: "Visibilité et Premium",
  },
  {
    emoji: "📰",
    title: "La mise en avant dans le fil",
    desc: "Votre annonce insérée dans le fil des habitants, clairement étiquetée « Sponsorisé », jamais en première position devant une urgence.",
    plan: "Tous les plans (à l'unité ou incluse)",
  },
];

const FAQ = [
  {
    q: "Comment fonctionne la vérification ?",
    a: "Avant l'activation de votre profil, nous contrôlons votre SIRET et votre identité. Le badge « Pro vérifié » n'est jamais vendu seul : il atteste d'un contrôle réel, c'est ce qui fait sa valeur auprès des habitants.",
  },
  {
    q: "Pourquoi mes annonces sont-elles étiquetées « Sponsorisé » ?",
    a: "La transparence est la base de la confiance sur la plateforme. Les habitants savent toujours qui est un professionnel et qui est un voisin. C'est aussi ce qui rend votre badge crédible : pas de publicité déguisée, donc votre présence est perçue positivement.",
  },
  {
    q: "Comment fonctionne la zone de visibilité ?",
    a: "Vous définissez votre adresse de départ (siège, atelier, domicile) et votre abonnement détermine le rayon autour : 10, 25 ou 50 km. Vous êtes automatiquement visible sur toutes les communes situées dans ce rayon, sans avoir à les sélectionner une par une. Vous pouvez déplacer votre point de départ à tout moment.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Non, tous les abonnements sont sans engagement, résiliables à tout moment. L'abonnement reste actif jusqu'à la fin de la période payée.",
  },
];

export default function ProPage() {
  return (
    <main className="font-display">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-ink py-20">
        <div className="blob w-80 h-80 bg-lilac -top-20 -right-16 opacity-20" />
        <div className="blob w-64 h-64 bg-coral -bottom-16 -left-10 opacity-20" style={{ animationDelay: "3s" }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/15 px-4 py-1.5 rounded-full mb-5">
            💼 Espace pro
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Vos futurs clients habitent{" "}
            <span className="bg-gradient-to-r from-sun via-coral to-pink bg-clip-text text-transparent">
              juste à côté
            </span>
          </h1>
          <p className="text-white/70 font-body text-lg max-w-xl mx-auto">
            Artisans, auto-entrepreneurs, services de proximité : soyez visible sur les
            communes où vous intervenez, au moment où les habitants cherchent un coup de main.
          </p>
        </div>
      </section>

      {/* ===== Abonnements ===== */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="inline-flex text-xs font-bold text-coral-dark bg-orange-100 px-4 py-1.5 rounded-full mb-4">
              💳 Sans engagement
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Choisissez votre visibilité</h2>
            <p className="text-neutral-500 font-body">
              Un tarif simple, un badge qui inspire confiance, des habitants qui cherchent
              exactement ce que vous proposez.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-8 border-2 transition ${
                  p.highlight
                    ? "bg-gradient-to-b from-orange-50 to-white border-coral shadow-xl shadow-coral/15 md:-translate-y-3"
                    : "bg-white border-neutral-150 border-neutral-200 shadow-md"
                }`}
              >
                {p.highlight && (
                  <span className="inline-block text-[11px] font-bold text-white bg-gradient-to-r from-coral to-coral-dark px-3 py-1 rounded-full mb-4">
                    ⭐ Le plus choisi
                  </span>
                )}
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-neutral-500 font-body mt-1 mb-5">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-sm font-bold text-neutral-400">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 font-body">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm font-semibold text-ink/80">
                      <span className="text-mint flex-shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/pro/espace"
                  className={`block text-center font-bold py-3.5 rounded-full transition ${
                    p.highlight
                      ? "bg-gradient-to-br from-coral to-coral-dark text-white shadow-lg shadow-coral/25 hover:scale-[1.02]"
                      : "border-2 border-ink text-ink hover:bg-ink hover:text-white"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-neutral-400 font-body font-semibold mt-8">
            Besoin d'un rayon plus large ou d'une offre multi-agences ?{" "}
            <a href="/contact" className="text-coral-dark underline">Contactez-nous</a>
          </p>
        </div>
      </section>

      {/* ===== Emplacements ===== */}
      <section className="bg-orange-50 py-20 border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="inline-flex text-xs font-bold text-coral-dark bg-white px-4 py-1.5 rounded-full mb-4">
              📍 Où apparaissez-vous ?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Trois emplacements, zéro ambiguïté</h2>
            <p className="text-neutral-500 font-body">
              Votre présence est toujours clairement identifiée « Pro » : c'est ce qui
              protège la confiance des habitants, et donc la valeur de votre visibilité.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLACEMENTS.map((pl) => (
              <div key={pl.title} className="bg-white rounded-3xl p-7 shadow-md border border-neutral-100">
                <div className="text-3xl mb-4">{pl.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{pl.title}</h3>
                <p className="text-sm text-neutral-500 font-body mb-4">{pl.desc}</p>
                <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  {pl.plan}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Lancé en 48h</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: 1, bg: "bg-coral", t: "Créez votre compte", d: "Email, mot de passe, c'est parti." },
              { n: 2, bg: "bg-sun", t: "Complétez votre profil", d: "Activité, services, tarifs, adresse de départ." },
              { n: 3, bg: "bg-mint", t: "Vérification SIRET", d: "Nous contrôlons votre entreprise sous 48h." },
              { n: 4, bg: "bg-lilac", t: "Vous êtes visible", d: "Badge activé, les habitants vous trouvent." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-3xl p-6 shadow-md border border-neutral-100 text-center">
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
      <section className="bg-mint/10 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-white rounded-2xl shadow-sm border border-neutral-100 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-6 py-5 font-bold text-[15px]">
                  {f.q}
                  <span className="text-coral transition group-open:rotate-45 text-xl leading-none">＋</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-neutral-500 font-body leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA mairies ===== */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky to-lilac rounded-[36px] px-10 py-14 text-center">
            <div className="relative z-10">
              <h2 className="text-white text-2xl md:text-4xl font-bold mb-3">
                Vous représentez une mairie ? 🏛️
              </h2>
              <p className="text-white/90 mb-8 font-body">
                Publiez vos alertes officielles et obtenez le badge « Commune certifiée »
                pour informer directement vos habitants.
              </p>
              <a
                href="/mairies"
                className="inline-block bg-white text-ink font-bold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition"
              >
                Découvrir l&apos;offre communes
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
