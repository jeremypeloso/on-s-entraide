"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DangerZone({
  scope, communeId, title, description, confirmWord, buttonLabel, redirectTo,
}: {
  scope: "pro" | "association" | "mairie" | "compte";
  communeId?: string;
  title: string;
  description: string;
  confirmWord: string;      // mot à taper pour confirmer
  buttonLabel: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true); setError(null);
    const res = await fetch("/api/compte/supprimer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, communeId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(j.error ?? "Suppression impossible."); return; }
    if (scope === "compte") {
      await createClient().auth.signOut();
      try { sessionStorage.clear(); } catch {}
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-3xl border border-red-100 p-6 sm:p-8">
      <h2 className="font-bold text-lg text-red-700 mb-1">⚠️ {title}</h2>
      <p className="text-sm text-neutral-500 font-body mb-4">{description}</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-bold px-5 py-2.5 rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 transition">
          {buttonLabel}
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-bold text-red-800">Cette action est définitive et immédiate.</p>
          <p className="text-xs text-red-700 font-body">Pour confirmer, tapez <span className="font-mono font-bold">{confirmWord}</span> ci-dessous.</p>
          <input
            value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={confirmWord}
            className="w-full bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-400 font-mono"
          />
          {error && <p className="text-xs font-bold text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button onClick={go} disabled={busy || typed.trim().toUpperCase() !== confirmWord}
              className="bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-red-700 transition disabled:opacity-40">
              {busy ? "Suppression..." : "Confirmer la suppression"}
            </button>
            <button onClick={() => { setOpen(false); setTyped(""); }} className="text-sm font-bold text-neutral-400 px-3">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
