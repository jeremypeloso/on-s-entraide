export default function Footer() {
  return (
    <footer className="bg-ink text-white font-display relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Marque */}
          <div className="md:col-span-1">
            <a href="/" className="inline-block mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.webp" alt="onsentraide.fr" className="h-12 w-auto brightness-0 invert opacity-90" />
            </a>
            <p className="text-sm text-white/60 font-body leading-relaxed">
              Toute l&apos;entraide de votre commune, au même endroit. Objets, services,
              transport, garde, alertes : vos voisins sont à deux clics.
            </p>
          </div>

          {/* Découvrir */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white/40 mb-4">Découvrir</h4>
            <ul className="space-y-2.5 text-sm font-semibold font-body">
              <li><a href="/#annonces" className="text-white/70 hover:text-white transition">Les dernières annonces</a></li>
              <li><a href="/#categories" className="text-white/70 hover:text-white transition">Toutes les catégories</a></li>
              <li><a href="/#comparaison" className="text-white/70 hover:text-white transition">Pourquoi pas Facebook</a></li>
              <li><a href="/publier" className="text-white/70 hover:text-white transition">Publier une annonce</a></li>
            </ul>
          </div>

          {/* Pros & communes */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white/40 mb-4">Pros &amp; communes</h4>
            <ul className="space-y-2.5 text-sm font-semibold font-body">
              <li><a href="/pro" className="text-white/70 hover:text-white transition">Devenir Pro du quartier</a></li>
              <li><a href="/mairies" className="text-white/70 hover:text-white transition">Vous êtes une mairie ?</a></li>
              <li><a href="/mairies" className="text-white/70 hover:text-white transition">Commune certifiée ✓</a></li>
            </ul>
          </div>

          {/* Aide & légal */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white/40 mb-4">Aide &amp; légal</h4>
            <ul className="space-y-2.5 text-sm font-semibold font-body">
              <li><a href="/contact" className="text-white/70 hover:text-white transition">Nous contacter</a></li>
              <li><a href="/cgu" className="text-white/70 hover:text-white transition">Conditions d&apos;utilisation</a></li>
              <li><a href="/confidentialite" className="text-white/70 hover:text-white transition">Confidentialité</a></li>
              <li><a href="/mentions-legales" className="text-white/70 hover:text-white transition">Mentions légales</a></li>
            </ul>
          </div>
        </div>

        {/* Bandeau sécurité */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-10 flex items-start gap-3">
          <span className="text-lg">🚨</span>
          <p className="text-xs text-white/50 font-body font-semibold leading-relaxed">
            En cas d&apos;urgence réelle, composez toujours le <strong className="text-white/80">17</strong> (police),
            le <strong className="text-white/80">15</strong> (SAMU) ou le <strong className="text-white/80">112</strong>.
            Onsentraide ne remplace jamais les services de secours.
          </p>
        </div>

        {/* Barre du bas */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40 font-body font-semibold">
            © {new Date().getFullYear()} onsentraide.fr · Tous droits réservés
          </p>
          <p className="text-xs text-white/40 font-body font-semibold">
            Fait avec ❤️ en France, commune par commune 🇫🇷
          </p>
        </div>
      </div>
    </footer>
  );
}
