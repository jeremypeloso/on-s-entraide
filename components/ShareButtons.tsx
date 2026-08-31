"use client";

import { useState } from "react";

// Partage d'une page commune : WhatsApp, Facebook, copie du lien, et partage natif sur mobile
export default function ShareButtons({ url, text, compact = false }: { url: string; text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const full = `${text} ${url}`;

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title: text, text, url }); } catch {}
    } else {
      copy();
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const btn = "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border transition";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noopener noreferrer"
        className={`${btn} bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20`}>
        💬 WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"
        className={`${btn} bg-[#1877F2]/10 border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20`}>
        📘 Facebook
      </a>
      <button onClick={copy} className={`${btn} bg-white border-neutral-200 text-ink/70 hover:border-ink`}>
        {copied ? "✓ Lien copié" : "🔗 Copier le lien"}
      </button>
      {!compact && (
        <button onClick={nativeShare} className={`${btn} bg-white border-neutral-200 text-ink/70 hover:border-ink sm:hidden`}>
          ↗ Partager
        </button>
      )}
    </div>
  );
}
