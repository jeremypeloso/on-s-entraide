export default function ConfidentialitePage() {
  return (
    <main className="font-display max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-extrabold mb-2">Politique de confidentialité</h1>
      <p className="text-xs font-bold text-neutral-400 mb-8">Dernière mise à jour : [DATE]</p>
      <div className="font-body text-sm text-neutral-600 leading-relaxed space-y-6">
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Données collectées</h2>
          <p>
            Compte : nom, email, mot de passe (chiffré), commune de résidence déclarée.
            Contenus : annonces, photos, questions publiques, signalements.
            Professionnels : SIRET, coordonnées de contact professionnelles (affichées publiquement).
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Finalités</h2>
          <p>
            Fonctionnement de la plateforme (mise en relation locale, module vigilance réservé aux
            résidents), sécurité et modération, emails transactionnels (bienvenue, alertes).
            Aucune revente de données à des tiers.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Visibilité de vos informations</h2>
          <p>
            Votre nom et vos annonces sont visibles des visiteurs de votre commune. L&apos;adresse
            exacte n&apos;est jamais publiée. Les signalements de vigilance ne sont visibles que des
            résidents déclarés de la commune concernée.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Hébergement et sous-traitants</h2>
          <p>
            Supabase (base de données et authentification, hébergement Europe), Vercel (diffusion du
            site), Resend (envoi d&apos;emails transactionnels).
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de
            suppression et de portabilité de vos données. Exercez-les via le{" "}
            <a href="/contact" className="text-coral-dark underline">formulaire de contact</a>.
            Responsable de traitement : [RAISON SOCIALE].
          </p>
        </section>
      </div>
    </main>
  );
}
