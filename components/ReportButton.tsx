"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MOTIFS = [
  { id: "commerce_deguise", label: "Annonce commerciale déguisée en particulier" },
  { id: "arnaque", label: "Arnaque ou tentative d'escroquerie" },
  { id: "inapproprie", label: "Contenu inapproprié ou offensant" },
  { id: "spam", label: "Doublon ou spam" },
  { id: "autre", label: "Autre problème" },
];

export default function ReportButton({ annonceId }: { annonceId: string }) {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!motif) return;
    setSending(true); setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/connexion"); return; }
    const { error } = await supabase.from("annonce_signalements").insert({
      annonce_id: annonceId, reporter_id: user.id, motif, commentaire: commentaire.trim() || null,
    });
    setSending(false);
    if (error) {
      setError(error.code === "23505" ? "Vous avez déjà signalé cette annonce. Merci, elle est en cours d'examen." : "Envoi impossible : " + error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-mint/10 border border-mint/30 rounded-2xl p-4 text-center">
        <p className="text-sm font-bold text-mint">✓ Signalement envoyé</p>
        <p className="text-xs text-neutral-500 font-body mt-1">Merci de veiller sur la communauté. Notre équipe va examiner cette annonce.</p>
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-center text-xs font-bold text-neutral-300 hover:text-red-500 transition py-2">
        🚩 Signaler cette annonce
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
      <p className="text-sm font-bold">🚩 Signaler cette annonce</p>
      <div className="space-y-1.5">
        {MOTIFS.map((m) => (
          <label key={m.id} className={`flex items-center gap-2.5 text-[13px] font-semibold font-body px-3 py-2.5 rounded-xl cursor-pointer border transition ${motif === m.id ? "border-red-300 bg-red-50 text-red-800" : "border-neutral-100 hover:border-neutral-200"}`}>
            <input type="radio" name="motif" value={m.id} checked={motif === m.id} onChange={() => setMotif(m.id)} className="accent-red-500" />
            {m.label}
          </label>
        ))}
      </div>
      <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} maxLength={300} rows={2} placeholder="Précisions (optionnel)..."
        className="w-full bg-neutral-50 border-2 border-transparent focus:border-red-300 rounded-xl px-3 py-2.5 text-[13px] font-semibold outline-none transition font-body resize-none" />
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-body">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={sending || !motif} className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-full hover:bg-red-600 transition disabled:opacity-40">
          {sending ? "Envoi..." : "Envoyer le signalement"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 text-xs font-bold text-neutral-400 hover:text-ink transition">Annuler</button>
      </div>
    </form>
  );
}
