export default function MentionsLegalesPage() {
  return (
    <main className="font-display max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-extrabold mb-8">Mentions légales</h1>
      <div className="font-body text-sm text-neutral-600 leading-relaxed space-y-6">
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Éditeur du site</h2>
          <p>
            onseditout.fr est édité par [RAISON SOCIALE], [FORME JURIDIQUE] au capital de [CAPITAL] €,
            immatriculée au RCS de [VILLE] sous le numéro [SIREN], dont le siège social est situé
            [ADRESSE]. Directeur de la publication : [NOM].
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Hébergement</h2>
          <p>
            Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis. Les données sont hébergées par Supabase (infrastructure AWS, région Europe).
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Contact</h2>
          <p>
            Pour toute question : <a href="/contact" className="text-coral-dark underline">formulaire de contact</a>.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Propriété intellectuelle</h2>
          <p>
            La marque, le logo et l&apos;ensemble des éléments du site sont protégés. Toute reproduction
            non autorisée est interdite. Les contenus publiés par les utilisateurs restent leur propriété ;
            en les publiant, ils accordent à l&apos;éditeur une licence d&apos;affichage sur la plateforme.
          </p>
        </section>
      </div>
    </main>
  );
}
