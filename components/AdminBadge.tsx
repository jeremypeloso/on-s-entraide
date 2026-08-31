import VerifiedBadge from "@/components/VerifiedBadge";

// Badge d'identification compact de l'équipe du site, à côté du nom.
// Couleurs volontairement absentes du reste de la charte (menthe = pros, ciel = communes, lilas = assos) :
//   fondateur → or ; équipe → graphite
export default function AdminBadge({ role, size = 16 }: { role?: string | null; size?: number }) {
  if (role === "fondateur") {
    return <VerifiedBadge color="#D4A017" title="Fondateur d'onseditout.fr" size={size} />;
  }
  return <VerifiedBadge color="#3F3F46" title="Équipe onseditout.fr" size={size} />;
}
