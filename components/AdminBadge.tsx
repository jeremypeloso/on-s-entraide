// Badge d'identification de l'équipe, affiché partout à côté du nom d'un administrateur
export default function AdminBadge({ size = "sm" }: { size?: "sm" | "xs" }) {
  return (
    <span
      title="Membre de l'équipe onseditout.fr"
      className={`inline-flex items-center gap-1 rounded-full bg-ink text-white font-bold flex-shrink-0 align-middle ${
        size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
      }`}
    >
      <svg width={size === "xs" ? 9 : 10} height={size === "xs" ? 9 : 10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" />
      </svg>
      Équipe
    </span>
  );
}
