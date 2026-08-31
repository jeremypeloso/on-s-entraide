export const ASSO_CATEGORIES = [
  { id: "sport", emoji: "⚽", label: "Sport" },
  { id: "culture", emoji: "🎭", label: "Culture & loisirs" },
  { id: "social", emoji: "🤝", label: "Solidarité & social" },
  { id: "enfance", emoji: "🧒", label: "Enfance & parents d'élèves" },
  { id: "environnement", emoji: "🌱", label: "Environnement" },
  { id: "fetes", emoji: "🎉", label: "Comité des fêtes" },
  { id: "anciens", emoji: "🎖️", label: "Anciens combattants & mémoire" },
  { id: "autre", emoji: "📌", label: "Autre" },
];

export function assoCat(id: string | null) {
  return ASSO_CATEGORIES.find((c) => c.id === id) ?? ASSO_CATEGORIES[ASSO_CATEGORIES.length - 1];
}
