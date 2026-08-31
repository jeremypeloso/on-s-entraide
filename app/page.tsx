import CitySearch from "@/components/CitySearch";

const CARDS = [
  { emoji: "🚗", cat: "Transport", color: "sky", title: "Covoiturage vers Vernon, jeudi 8h", desc: "2 places libres, retour possible le soir même.", ville: "Limetz-Villez", meta: "il y a 4 min" },
  { emoji: "🔧", cat: "Objets", color: "coral", title: "Perceuse à prêter ce week-end", desc: "Disponible samedi et dimanche, à récupérer sur place.", ville: "Bonnières-sur-Seine", meta: "il y a 12 min" },
  { emoji: "🐱", cat: "Garde", color: "sun", title: "Recherche gardien de chat, 5 jours en août", desc: "Deux visites par jour, nourriture fournie.", ville: "Vernon", meta: "il y a 26 min" },
  { emoji: "🪛", cat: "Services", color: "mint", title: "Coup de main pour monter une étagère", desc: "Outillage sur place, une heure suffit.", ville: "Vétheuil", meta: "il y a 1 h" },
  { emoji: "🍅", cat: "Alimentaire", color: "pink", title: "Surplus de tomates du jardin, à donner", desc: "Environ 3 kg, récupération ce soir avant 20h.", ville: "Limetz-Villez", meta: "il y a 2 h" },
  { emoji: "📢", cat: "Alertes", color: "lilac", title: "Coupure d'eau rue des Tilleuls demain", desc: "De 9h à 13h, information officielle de la mairie.", ville: "Limetz-Villez", meta: "il y a 3 h" },
  { emoji: "🚗", cat: "Transport", color: "sky", title: "Trajet gare de Mantes, chaque matin", desc: "Départ 7h30, place pour un passager régulier.", ville: "Freneuse", meta: "il y a 4 h" },
  { emoji: "🐾", cat: "Garde", color: "sun", title: "Promenade de chien cette semaine", desc: "Disponible en fin de journée, secteur centre.", ville: "Bonnières-sur-Seine", meta: "il y a 5 h" },
];

const CATEGORIES = [
  { emoji: "🔧", label: "Objets", desc: "Dons, prêts, échanges", dot: "bg-coral" },
  { emoji: "🪛", label: "Services", desc: "Bricolage, jardinage, cours", dot: "bg-mint" },
  { emoji: "🚗", label: "Transport", desc: "Covoiturage, dépannage", dot: "bg-sky" },
  { emoji: "🐾", label: "Garde", desc: "Enfants, animaux, plantes", dot: "bg-sun" },
  { emoji: "🍅", label: "Alimentaire", desc: "Surplus, invendus, jardin", dot: "bg-pink" },
  { emoji: "📢", label: "Alertes locales", desc: "Travaux, disparitions, infos", dot: "bg-lilac" },
  { emoji: "💼", label: "Pro ponctuel", desc: "Freelance, dépannage", dot: "bg-amber-400" },
  { emoji: "👀", label: "Vigilance", desc: "Réservé aux résidents", dot: "bg-red-400" },
];

const colorMap: Record<string, string> = {
  sky: "border-sky text-sky",
  coral: "border-coral text-coral",
  sun: "border-sun text-sun",
  mint: "border-mint text-mint",
  pink: "border-pink text-pink",
  lilac: "border-lilac text-lilac",
};

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4 ${
        light ? "text-white bg-white/15" : "text-coral-dark bg-orange-100"
      }`}
    >
      {children}
    </span>
  );
}

function AnnonceCard({ c }: { c: (typeof CARDS)[number] }) {
  return (
    <div
      className={`bg-white rounded-3xl p-5 w-[300px] h-[240px] flex-shrink-0 flex flex-col shadow-lg shadow-ink/5 border border-neutral-100 border-t-4 ${colorMap[c.color]}`}
    >
      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg mb-3">
        {c.emoji}
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wide">{c.cat}</span>
      <h4 className="font-semibold text-[15px] leading-snug mt-1 mb-1 text-ink line-clamp-2">{c.title}</h4>
      <p className="text-[13px] text-neutral-500 line-clamp-2">{c.desc}</p>
      <div className="flex justify-between text-[11px] font-bold text-neutral-400 mt-auto pt-3">
        <span>📍 {c.ville}</span>
        <span>{c.meta}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="font-display">

      {/* ============ HERO — photo de village français + titre + recherche ============ */}
      <section className="relative overflow-hidden">
        {/* Photo de fond : petit village français (Unsplash, libre d'utilisation) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero.webp')",
          }}
        />
        {/* Voile sombre dégradé pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/35 to-ink/60" />

        <div className="max-w-3xl mx-auto text-center relative z-10 px-6 pt-32 pb-32">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] mb-4 text-white drop-shadow-lg">
            Un coup de main,{" "}
            <span className="bg-gradient-to-r from-sun via-coral to-pink bg-clip-text text-transparent">
              à deux clics
            </span>{" "}
            de chez vous.
          </h1>
          <p className="text-white/80 font-body text-lg mb-10 drop-shadow">
            Tout ce qui se passe dans votre commune, au même endroit.
          </p>
          <CitySearch />
        </div>
      </section>

      {/* ============ DERNIÈRES ANNONCES — bande crème, carrousel défilant ============ */}
      <section id="annonces" className="bg-orange-50 py-16 overflow-hidden border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-6 mb-10 text-center">
          <Eyebrow>🔥 En ce moment</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-bold">Les dernières annonces</h2>
        </div>

        {/* Piste dupliquée pour un défilement infini sans coupure */}
        <div className="relative">
          <div className="marquee-track px-6">
            {[...CARDS, ...CARDS].map((c, i) => (
              <AnnonceCard key={`${c.title}-${i}`} c={c} />
            ))}
          </div>
          {/* Fondus latéraux, assortis au fond crème */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-orange-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-orange-50 to-transparent" />
        </div>
      </section>

      {/* ============ COMMENT ÇA MARCHE — bande blanche épurée ============ */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <Eyebrow>⚡ Simple et rapide</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Trois étapes, aucun scroll infini</h2>
            <p className="text-neutral-500 font-body">
              Pas besoin de fouiller douze groupes différents ni de retenir qui a répondu quoi en commentaire.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, bg: "bg-coral", shadow: "shadow-coral/30", title: "Publiez en une minute", desc: "Choisissez une thématique, décrivez votre besoin : votre commune voit votre annonce." },
              { n: 2, bg: "bg-mint", shadow: "shadow-mint/30", title: "Trouvez près de chez vous", desc: "Filtrez par thème, distance et disponibilité réelle." },
              { n: 3, bg: "bg-lilac", shadow: "shadow-lilac/30", title: "Rencontrez en confiance", desc: "Identités réelles, questions publiques sous chaque annonce, signalement communautaire." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-3xl p-8 shadow-md border border-neutral-100">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} shadow-lg ${s.shadow} text-white text-lg font-bold flex items-center justify-center -rotate-6 mb-5`}>
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-500 font-body">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATÉGORIES — bande sombre, identité forte ============ */}
      <section id="categories" className="bg-ink py-24 relative overflow-hidden">
        <div className="blob w-80 h-80 bg-lilac top-0 -right-20 opacity-20" />
        <div className="blob w-64 h-64 bg-coral -bottom-16 -left-10 opacity-20" style={{ animationDelay: "3s" }} />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-14">
            <Eyebrow light>🗂️ Huit façons de s&apos;entraider</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              Une thématique pour chaque coup de main
            </h2>
            <p className="text-white/60 font-body">
              Chaque annonce est rangée au bon endroit, filtrable et localisée. Rien ne se perd dans le flux.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((c) => (
              <div
                key={c.label}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[160px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{c.emoji}</div>
                  <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                </div>
                <div>
                  <h4 className="font-semibold mt-4 text-white">{c.label}</h4>
                  <span className="text-xs text-white/50 font-semibold font-body">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPARATIF — bande crème chaleureuse ============ */}
      <section id="comparaison" className="bg-mint/10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <Eyebrow>🤔 Pourquoi pas juste un groupe Facebook</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Le même esprit d&apos;entraide, sans le chaos</h2>
            <p className="text-neutral-500 font-body">
              Les groupes locaux ont prouvé que le besoin existe. On garde l&apos;esprit, on corrige ce qui coince.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white/70 rounded-3xl p-8 border border-neutral-200">
              <h3 className="font-bold mb-5">😩 Un groupe Facebook</h3>
              <ul className="space-y-3 text-sm font-semibold font-body">
                {["Fil chronologique, impossible à filtrer", "Aucun statut : dispo ou déjà pris", "Réputation nulle part", "Dépend de l'algorithme"].map((t) => (
                  <li key={t} className="flex gap-2 border-b border-ink/10 pb-3 last:border-0">
                    <span className="text-neutral-400">✕</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-coral/10 border-2 border-coral/20 md:-translate-y-3">
              <h3 className="font-bold mb-5">🚀 Onseditout</h3>
              <ul className="space-y-3 text-sm font-semibold font-body">
                {["Filtres par thématique, page par commune", "Statut en temps réel : dispo, réservé, terminé", "Identités réelles et pros vérifiés (SIRET)", "Alertes officielles de votre mairie"].map((t) => (
                  <li key={t} className="flex gap-2 border-b border-ink/10 pb-3 last:border-0">
                    <span className="text-mint">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL — bande dégradée ============ */}
      <section className="bg-white pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-lilac to-pink rounded-[36px] px-10 py-20 text-center">
            <div className="blob w-64 h-64 bg-sun -top-20 -left-10 opacity-40" />
            <div className="relative z-10">
              <h2 className="text-white text-3xl md:text-5xl font-bold mb-4">Votre quartier vous attend 🏡</h2>
              <p className="text-white/90 mb-10 font-body text-lg">
                On lance ville par ville. Cherchez la vôtre pour voir ce qui s&apos;y passe déjà.
              </p>
              <CitySearch />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
