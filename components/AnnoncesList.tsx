"use client";

import { useState, useMemo } from "react";
import AdminBadge from "@/components/AdminBadge";

type Annonce = {
  id: string;
  title: string;
  photo_url: string | null;
  description: string | null;
  statut: string;
  is_sponsored: boolean;
  created_at: string;
  categories: { id: string; label: string; emoji: string; color_hex: string | null } | null;
  profiles: { full_name: string | null; avatar_url?: string | null; is_admin?: boolean; staff_role?: string | null } | null;
};

const PAGE_SIZE = 12;

const STATUT_STYLE: Record<string, string> = {
  disponible: "bg-mint text-white",
  reserve: "bg-sun text-ink",
  termine: "bg-neutral-200 text-neutral-500",
};
const STATUT_LABEL: Record<string, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
  termine: "Terminé",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${Math.max(mins, 1)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function AnnoncesList({ annonces }: { annonces: Annonce[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const cats = useMemo(() => {
    const map = new Map<string, { id: string; label: string; emoji: string; count: number }>();
    for (const a of annonces) {
      if (!a.categories) continue;
      const existing = map.get(a.categories.id);
      if (existing) existing.count++;
      else map.set(a.categories.id, { id: a.categories.id, label: a.categories.label, emoji: a.categories.emoji, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [annonces]);

  const filtered = selected
    ? annonces.filter((a) => a.categories?.id === selected)
    : annonces;

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  function selectCat(id: string | null) {
    setSelected(id);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => selectCat(null)}
          className={`text-[13px] font-bold px-4 py-2 rounded-full transition ${
            selected === null
              ? "bg-ink text-white shadow"
              : "bg-white text-ink/70 border border-neutral-200 hover:border-ink/40"
          }`}
        >
          Toutes ({annonces.length})
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCat(selected === c.id ? null : c.id)}
            className={`text-[13px] font-bold px-4 py-2 rounded-full transition ${
              selected === c.id
                ? "bg-ink text-white shadow"
                : "bg-white text-ink/70 border border-neutral-200 hover:border-ink/40"
            }`}
          >
            {c.emoji} {c.label} ({c.count})
          </button>
        ))}
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <p className="text-sm font-bold text-neutral-300 py-8 text-center">
          Aucune annonce dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((a) => {
            const color = a.categories?.color_hex ?? "#FF6B5B";
            return (
              <a
                key={a.id}
                href={`/annonce/${a.id}`}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:border-neutral-200 transition-all duration-300"
              >
                {/* Visuel : photo ou tuile emoji colorée */}
                {a.photo_url ? (
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.photo_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-full backdrop-blur-sm"
                      style={{ background: `${color}E6` }}
                    >
                      {a.categories?.emoji} {a.categories?.label}
                    </span>
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUT_STYLE[a.statut] ?? ""}`}>
                      {STATUT_LABEL[a.statut] ?? a.statut}
                    </span>
                  </div>
                ) : (
                  <div
                    className="relative h-24 flex items-center justify-between px-5"
                    style={{ background: `${color}14` }}
                  >
                    <span
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ background: `${color}26` }}
                    >
                      {a.categories?.emoji}
                    </span>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wide"
                        style={{ color }}
                      >
                        {a.categories?.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUT_STYLE[a.statut] ?? ""}`}>
                        {STATUT_LABEL[a.statut] ?? a.statut}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contenu */}
                <div className="flex flex-col flex-1 p-5">
                  {a.is_sponsored && (
                    <span className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2">
                      Sponsorisé
                    </span>
                  )}
                  <h3 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-coral-dark transition">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="text-[13px] text-neutral-500 line-clamp-2 mt-1.5 font-body">
                      {a.description}
                    </p>
                  )}

                  {/* Pied de carte */}
                  <div className="flex items-center gap-2.5 mt-auto pt-4">
                    {a.profiles?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={a.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
                        {(a.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs font-bold text-ink/70 truncate">
                      {a.profiles?.full_name ?? "Un voisin"}
                    </span>
                    {a.profiles?.is_admin && <AdminBadge role={a.profiles?.staff_role} size={14} />}
                    <span className="text-[11px] font-bold text-neutral-300 ml-auto flex-shrink-0">
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {remaining > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 bg-white border-2 border-ink/15 text-ink text-sm font-bold px-6 py-3 rounded-full hover:border-ink hover:bg-ink hover:text-white transition"
          >
            Afficher plus ({remaining} restante{remaining > 1 ? "s" : ""})
          </button>
        </div>
      )}
    </div>
  );
}
