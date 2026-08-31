"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactButton({ annonceId, firstName }: { annonceId: string; firstName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const res = await fetch("/api/messages/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annonceId }),
    });
    if (res.status === 401) { router.push("/connexion"); return; }
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (j.id) router.push(`/messages/${j.id}`);
    else window.alert(j.error ?? "Impossible d'ouvrir la conversation.");
  }

  return (
    <button onClick={go} disabled={busy}
      className="w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition disabled:opacity-60">
      {busy ? "Ouverture..." : `💬 Contacter ${firstName}`}
    </button>
  );
}
