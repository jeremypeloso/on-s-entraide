import { CONDITIONS_VERSION, BAREME, PALIERS } from "@/lib/ambassadeurs";

export const metadata = { title: "Conditions du programme ambassadeurs" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-extrabold mt-10 mb-3">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="font-body text-neutral-700 leading-relaxed mb-3">{children}</p>;

export default function Page() {
  return (
    <main className="font-display bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <span className="inline-block text-xs font-bold bg-coral/10 text-coral px-3.5 py-1.5 rounded-full mb-5">Version {CONDITIONS_VERSION}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Conditions du programme ambassadeurs</h1>
        <P>Le programme ambassadeurs est proposé par l'éditeur du site onseditout.fr (ci-après « nous ») aux habitants inscrits qui souhaitent faire connaître le site dans leur commune (ci-après « l'ambassadeur »). En acceptant ces conditions, l'ambassadeur reconnaît les avoir lues et comprises.</P>

        <H>1. Nature de l'engagement</H>
        <P>La participation au programme est libre, bénévole et personnelle. Elle ne crée aucun lien de subordination, aucun contrat de travail, de mandat, d'agence commerciale ou de partenariat. L'ambassadeur agit en son nom, sans pouvoir d'engager le site, et ne peut se présenter comme salarié ou représentant de celui-ci.</P>
        <P>L'ambassadeur ne perçoit aucune rémunération. Les points et cartes cadeaux décrits ci-dessous constituent une gratification occasionnelle, sans caractère obligatoire, offerte à titre de remerciement.</P>

        <H>2. Qui peut être ambassadeur</H>
        <P>Toute personne physique majeure, inscrite sur le site avec un compte à son nom, résidant dans la commune pour laquelle elle candidate. Un seul compte ambassadeur par personne. La candidature est examinée par nos soins ; nous pouvons l'accepter ou la refuser librement, sans avoir à motiver notre décision. Nous pouvons également proposer directement le rôle à un habitant, qui reste libre de l'accepter.</P>

        <H>3. Rôle de l'ambassadeur</H>
        <P>L'ambassadeur fait connaître le site auprès des habitants, commerçants, associations et collectivités de sa commune, publie des annonces, relaie les informations locales et partage son lien de parrainage personnel. Il utilise uniquement les visuels et textes fournis, ou des messages personnels respectueux. Il s'interdit tout envoi massif non sollicité, toute création de faux comptes, toute promesse au nom du site et tout propos contraire aux conditions d'utilisation.</P>

        <H>4. Points</H>
        <P>Un lien de parrainage personnel est attribué à chaque ambassadeur actif. Les inscriptions et abonnements réalisés via ce lien génèrent des points selon le barème en vigueur : {BAREME.habitant} points par habitant inscrit, {BAREME.pro} points par professionnel abonné, {BAREME.collectivite} points par commune certifiée. Les points liés aux habitants restent bloqués tant qu'aucun abonnement n'a été souscrit dans le cadre du parrainage ; chaque professionnel abonné en débloque jusqu'à {BAREME.deblocageParPro} et chaque commune certifiée jusqu'à {BAREME.deblocageParCollectivite}.</P>
        <P>Les points sont crédités après vérification (compte confirmé, premier paiement encaissé). Ils n'ont aucune valeur monétaire, ne sont ni cessibles, ni transmissibles, ni convertibles en espèces, et ne peuvent faire l'objet d'aucune réclamation. Les points inutilisés expirent après douze mois sans nouveau parrainage. Nous pouvons modifier le barème et les paliers à tout moment pour l'avenir, en informant les ambassadeurs par email ou dans leur espace.</P>

        <H>5. Cartes cadeaux</H>
        <P>Les points disponibles peuvent être échangés contre une carte cadeau selon les paliers en vigueur : {PALIERS.map((p) => `${p.points} points pour ${p.montant} €`).join(", ")}. Une seule demande à la fois. La carte est envoyée par email à l'adresse du compte dans un délai indicatif de quinze jours, sous forme dématérialisée, chez l'enseigne ou le prestataire de notre choix. Les cartes ne sont ni remboursables, ni échangeables contre des espèces.</P>
        <P>Nous pouvons refuser ou annuler une demande en cas de suspicion de fraude, de manquement aux présentes conditions ou d'erreur de calcul ; les points sont alors rendus ou retirés selon le cas.</P>

        <H>6. Suspension et fin</H>
        <P>L'ambassadeur peut quitter le programme à tout moment sur simple demande. Nous pouvons suspendre ou retirer le statut d'ambassadeur à tout moment, notamment en cas de faux comptes, de spam, de propos inappropriés, d'inactivité prolongée ou de fin du programme. En cas de retrait pour manquement, les points en cours sont perdus. En cas d'arrêt du programme ou de retrait sans manquement, les points disponibles restent échangeables pendant trente jours.</P>

        <H>7. Marque et communication</H>
        <P>Le nom « On se dit tout », le logo et les visuels sont notre propriété. L'ambassadeur peut les utiliser uniquement dans le cadre du programme et à partir du kit fourni, sans les modifier. Il ne crée pas de page, compte ou site se présentant comme officiel.</P>

        <H>8. Données personnelles</H>
        <P>Pour gérer le programme, nous enregistrons la date et la version des conditions acceptées, l'adresse IP au moment de l'acceptation, la commune, les parrainages générés par le lien (identifiant du compte parrainé et type) et l'historique des cartes cadeaux. Ces données sont conservées pendant la durée de participation puis trois ans à des fins de preuve. L'ambassadeur dispose des droits prévus par le RGPD, exerçables depuis la page de contact. Voir aussi notre <a href="/confidentialite" className="underline">politique de confidentialité</a>.</P>

        <H>9. Divers</H>
        <P>Les présentes conditions complètent les <a href="/cgu" className="underline">conditions d'utilisation</a> du site, qui s'appliquent en toutes circonstances. Elles sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action.</P>

        <p className="mt-10 text-xs font-bold text-neutral-400">Version {CONDITIONS_VERSION}. Les évolutions sont signalées dans l'espace ambassadeur et requièrent une nouvelle acceptation.</p>
      </div>
    </main>
  );
}
