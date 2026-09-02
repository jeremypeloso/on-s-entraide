// Règles du programme ambassadeurs, partagées entre le site, l'API et l'admin.
export const CONDITIONS_VERSION = "2026-09";

export const BAREME = {
  habitant: 5,
  pro: 30,
  collectivite: 60,
  deblocageParPro: 20,
  deblocageParCollectivite: 40,
};

export const PALIERS = [
  { points: 50, montant: 15 },
  { points: 120, montant: 40 },
  { points: 250, montant: 80 },
  { points: 600, montant: 200 },
];

export function genRefCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "AMB-" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
