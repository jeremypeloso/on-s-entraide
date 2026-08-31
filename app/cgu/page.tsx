export default function CguPage() {
  return (
    <main className="font-display max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-extrabold mb-2">Conditions générales d&apos;utilisation</h1>
      <p className="text-xs font-bold text-neutral-400 mb-8">Dernière mise à jour : 31 août 2026</p>
      <div className="font-body text-sm text-neutral-600 leading-relaxed space-y-6">
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">1. Objet</h2>
          <p>
            onseditout.fr est la plateforme de vie locale des habitants d&apos;une même commune : entraide,
            dons et prêts d&apos;objets, services, transport, garde, alimentaire, alertes locales.
            L&apos;utilisation du site vaut acceptation des présentes conditions.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">2. Comptes et identité</h2>
          <p>
            L&apos;inscription requiert une identité réelle. Le nom renseigné à l&apos;inscription est
            visible des autres utilisateurs et ne peut être modifié que sur demande justifiée.
            La déclaration de commune de résidence conditionne l&apos;accès au module Vigilance de quartier.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">3. Règles de publication</h2>
          <p>
            Les annonces à caractère commercial sont réservées aux comptes professionnels vérifiés
            (SIRET contrôlé) et sont systématiquement identifiées « Sponsorisé ». Publier une annonce
            commerciale depuis un compte particulier constitue un manquement pouvant entraîner la
            suppression du contenu et la suspension du compte. Sont interdits : contenus illicites,
            trompeurs, dangereux, ou contraires à l&apos;esprit d&apos;entraide de la plateforme.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">4. Vigilance de quartier et urgences</h2>
          <p>
            Le module Vigilance de quartier est réservé aux signalements non urgents entre résidents.
            Il ne remplace en aucun cas les services de secours. En cas d&apos;urgence, composez le 17
            (police), le 15 (SAMU) ou le 112.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">5. Transactions entre utilisateurs</h2>
          <p>
            La plateforme met en relation ; les échanges, prêts, dons et prestations se déroulent sous
            la seule responsabilité des utilisateurs. Nous recommandons de ne jamais verser d&apos;argent
            en avance et de demander un devis écrit à tout professionnel.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">6. Modération</h2>
          <p>
            Tout contenu peut être signalé. L&apos;éditeur se réserve le droit de retirer un contenu ou
            de suspendre un compte en cas de manquement aux présentes conditions.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">7. Abonnements payants</h2>
          <p>
            Les offres professionnelles et communes sont sans engagement (pros) ou à engagement annuel
            (communes), résiliables selon les conditions affichées au moment de la souscription.
          </p>
        </section>
      </div>
    </main>
  );
}
