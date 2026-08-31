import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos",
  description: "Qui est derrière On se dit tout : un projet né à Limetz-Villez pour rassembler habitants, associations, professionnels et mairie sur une seule page par commune.",
};

export default function AProposPage() {
  return (
    <main className="font-display bg-neutral-50 min-h-screen py-14">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase text-neutral-400 mb-2">À propos</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Une page par commune, pensée depuis un village</h1>

        <div className="space-y-6 font-body text-neutral-600 leading-relaxed">
          <p>
            On se dit tout est né à <strong>Limetz-Villez</strong>, un village des Yvelines de 2 000 habitants,
            d&apos;un constat simple : tout ce qui fait la vie d&apos;une commune est éparpillé. Les annonces entre
            voisins sur un groupe Facebook, les événements des associations sur des affiches, les informations de la
            mairie dans un bulletin trimestriel, les artisans du coin dans le bouche-à-oreille.
          </p>
          <p>
            Nous avons voulu <strong>un seul endroit</strong>, simple et sans algorithme, où les habitants
            s&apos;entraident, où les associations annoncent leurs événements, où les professionnels vérifiés sont
            visibles sur leur vraie zone d&apos;intervention, et où la mairie parle d&apos;une voix officielle.
          </p>

          <div className="bg-white rounded-3xl border border-neutral-100 p-6 my-8">
            <p className="font-display font-bold text-ink text-lg mb-2">Qui est derrière ?</p>
            <p>
              Jeremy Peloso, fondateur. Dirigeant d&apos;une entreprise de transport de voyageurs et président
              d&apos;une association locale, il connaît de l&apos;intérieur les trois publics que la plateforme
              rassemble : les petites entreprises qui cherchent des clients près de chez elles, les bénévoles qui
              cherchent à faire savoir ce qu&apos;ils organisent, et les élus qui cherchent à toucher leurs administrés
              là où ils sont.
            </p>
          </div>

          <h2 className="font-display font-bold text-ink text-xl">Nos engagements</h2>
          <ul className="space-y-2">
            <li>🏠 <strong>Gratuit pour les habitants et les associations</strong>, pour toujours.</li>
            <li>🔍 <strong>Des identités réelles</strong> : nom vérifié pour les habitants, SIRET pour les pros, RNA pour les associations, badge officiel pour les mairies.</li>
            <li>🇫🇷 <strong>Des données hébergées en Europe</strong>, jamais revendues, aucune publicité.</li>
            <li>🤝 <strong>Un modèle transparent</strong> : les professionnels et les mairies financent la plateforme, ce qui est sponsorisé est toujours indiqué.</li>
            <li>🚨 <strong>La sécurité d&apos;abord</strong> : la vigilance de quartier ne remplace jamais le 17, le 15 ou le 112.</li>
          </ul>

          <h2 className="font-display font-bold text-ink text-xl mt-8">Où en sommes-nous ?</h2>
          <p>
            La plateforme se lance commune par commune, en commençant par les Yvelines et l&apos;Eure. Chaque commune
            de France a déjà sa page : il suffit qu&apos;un habitant, une association ou une mairie la fasse vivre.
          </p>
          <p>
            Une question, une idée, une mairie à convaincre ?{" "}
            <a href="/contact" className="text-coral-dark font-bold underline">Écrivez-nous</a>, nous répondons sous 48h.
          </p>
        </div>
      </div>
    </main>
  );
}
