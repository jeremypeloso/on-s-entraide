"use client";

import { useState, useEffect } from "react";

export default function PhotoViewer({ url, title }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false);

  // Fermer avec Échap
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Vignette pièce jointe */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title ?? "Pièce jointe"} className="h-40 w-full object-cover" />
        <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-ink text-xs font-bold px-3 py-1.5 rounded-full">
            🔍 Voir en grand
          </span>
        </span>
      </button>

      {/* Plein écran */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl font-bold transition"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title ?? "Pièce jointe"}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
