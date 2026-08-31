"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminBadge from "@/components/AdminBadge";

type Review = {
  id: string; author_id: string; rating: number; body: string | null; created_at: string;
  pro_reply: string | null; replied_at: string | null; profiles: { full_name: string | null; is_admin?: boolean; staff_role?: string | null } | null;
};

const MOTIFS_AVIS = [
  { id: "faux_client", label: "Cette personne n'a jamais été cliente" },
  { id: "injurieux", label: "Propos injurieux ou diffamatoires" },
  { id: "concurrent", label: "Avis d'un concurrent" },
  { id: "hors_sujet", label: "Hors sujet ou incompréhensible" },
  { id: "autre", label: "Autre" },
];

export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = (hover || value) >= i;
        return (
          <svg
            key={i} width={size} height={size} viewBox="0 0 24 24"
            onMouseEnter={() => onChange && setHover(i)}
            onClick={() => onChange?.(i)}
            className={onChange ? "cursor-pointer transition-transform hover:scale-110" : ""}
            fill={filled ? "#FFC53D" : "none"} stroke={filled ? "#FFC53D" : "#D4D4D4"} strokeWidth="2" strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </span>
  );
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 1) return "aujourd'hui";
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an${months >= 24 ? "s" : ""}`;
}

export default function ProReviews({ proId, proName }: { proId: string; proName: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportMotif, setReportMotif] = useState("");
  const [reportText, setReportText] = useState("");
  const [reported, setReported] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    setIsOwner(!!user && user.id === proId);
    const { data, error } = await supabase
      .from("pro_reviews")
      .select("*")
      .eq("pro_id", proId)
      .order("created_at", { ascending: false });
    if (error) { setLoadError(error.message); console.error("ProReviews:", error); }

    // Noms des auteurs (requête séparée : évite toute ambiguïté de jointure)
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.author_id)));
    let names: Record<string, string | null> = {};
    let admins = new Set<string>();
    let roles: Record<string, string | null> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, is_admin, staff_role").in("id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name]));
      admins = new Set((profs ?? []).filter((p) => p.is_admin).map((p) => p.id));
      roles = Object.fromEntries((profs ?? []).map((p) => [p.id, p.staff_role]));
    }
    setReviews((data ?? []).map((r: any) => ({ ...r, profiles: { full_name: names[r.author_id] ?? null, is_admin: admins.has(r.author_id), staff_role: roles[r.author_id] ?? null } })));
    if (user && user.id === proId) {
      const { data: sig } = await supabase.from("review_signalements").select("review_id").eq("pro_id", user.id);
      setReported(new Set((sig ?? []).map((s) => s.review_id)));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proId]);

  useEffect(() => { load(); }, [load]);

  const mine = reviews.find((r) => r.author_id === userId);
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  function startEdit() {
    if (mine) { setRating(mine.rating); setBody(mine.body ?? ""); }
    setEditing(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Choisissez une note."); return; }
    setSending(true); setError(null);
    const payload = { pro_id: proId, author_id: userId, rating, body: body.trim() || null };
    const { error } = mine
      ? await supabase.from("pro_reviews").update({ rating, body: body.trim() || null }).eq("id", mine.id)
      : await supabase.from("pro_reviews").insert(payload);
    setSending(false);
    if (error) { setError("Envoi impossible. Vous avez peut-être déjà laissé un avis."); return; }
    setEditing(false); setRating(0); setBody("");
    load();
  }

  async function sendReport(reviewId: string) {
    if (!reportMotif) return;
    const { error } = await supabase.from("review_signalements").insert({
      review_id: reviewId, pro_id: userId, motif: reportMotif, commentaire: reportText.trim() || null,
    });
    if (!error) {
      setReported((prev) => new Set(prev).add(reviewId));
      setReportFor(null); setReportMotif(""); setReportText("");
    }
  }

  async function sendReply(reviewId: string) {
    if (replyText.trim().length < 2) return;
    const res = await fetch("/api/avis/reponse", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, reply: replyText.trim() }),
    });
    if (res.ok) { setReplyFor(null); setReplyText(""); load(); }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
      <h2 className="font-bold text-lg mb-5">⭐ Avis clients</h2>
      {loadError && <p className="text-xs font-bold text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">Erreur de chargement : {loadError}</p>}

      {/* Synthèse */}
      {count > 0 ? (
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="text-center sm:text-left">
            <p className="text-5xl font-extrabold leading-none">{avg.toFixed(1)}</p>
            <div className="mt-2"><Stars value={Math.round(avg)} size={20} /></div>
            <p className="text-xs font-bold text-neutral-400 mt-1">{count} avis</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ n, c }) => (
              <div key={n} className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                <span className="w-3">{n}</span>
                <span className="text-sun">★</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sun rounded-full" style={{ width: `${count ? (c / count) * 100 : 0}%` }} />
                </div>
                <span className="w-5 text-right">{c}</span>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && (
        <p className="text-sm text-neutral-400 font-body mb-6">Aucun avis pour le moment. Soyez le premier à partager votre expérience.</p>
      )}

      {/* Formulaire */}
      {!isOwner && userId && (mine && !editing ? (
        <div className="flex items-center justify-between bg-neutral-50 rounded-2xl px-4 py-3 mb-6">
          <p className="text-xs font-bold text-neutral-500">Vous avez laissé un avis <Stars value={mine.rating} size={13} /></p>
          <button onClick={startEdit} className="text-xs font-bold text-coral">Modifier</button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-neutral-50 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-sm font-bold">{mine ? "Modifier mon avis" : `Votre avis sur ${proName}`}</p>
          <Stars value={rating} size={28} onChange={setRating} />
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={3}
            placeholder="Qualité du travail, ponctualité, prix, relation... Restez factuel et courtois."
            className="w-full bg-white border-2 border-transparent focus:border-sun rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body resize-none"
          />
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="bg-ink text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-ink/85 transition disabled:opacity-40">
              {sending ? "..." : "Publier mon avis"}
            </button>
            {mine && <button type="button" onClick={() => setEditing(false)} className="text-sm font-bold text-neutral-400 px-3">Annuler</button>}
          </div>
          <p className="text-[10px] text-neutral-400 font-body font-semibold">Publié sous votre vrai nom. Un seul avis par professionnel, modifiable à tout moment.</p>
        </form>
      ))}
      {!userId && !loading && (
        <a href="/connexion" className="block text-center text-sm font-bold text-coral bg-orange-50 rounded-2xl py-3 mb-6">Connectez-vous pour laisser un avis →</a>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                {(r.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate flex items-center gap-1.5">{r.profiles?.full_name ?? "Un habitant"}{r.profiles?.is_admin && <AdminBadge role={r.profiles?.staff_role} size={14} />}</p>
                <p className="text-[11px] font-bold text-neutral-400 flex items-center gap-2"><Stars value={r.rating} size={12} /> {timeAgo(r.created_at)}</p>
              </div>
            </div>
            {r.body && <p className="text-sm text-neutral-600 font-body mt-2.5 leading-relaxed">{r.body}</p>}

            {r.pro_reply && (
              <div className="mt-3 ml-4 pl-4 border-l-2 border-amber-200">
                <p className="text-[11px] font-bold text-amber-700">Réponse de {proName}</p>
                <p className="text-sm text-neutral-600 font-body mt-1">{r.pro_reply}</p>
              </div>
            )}
            {isOwner && (
              <div className="mt-2 ml-4">
                {reported.has(r.id) ? (
                  <p className="text-[11px] font-bold text-amber-600">🚩 Avis signalé, en cours d&apos;examen par notre équipe</p>
                ) : reportFor === r.id ? (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 space-y-2">
                    <p className="text-[11px] font-bold text-red-700">Signaler cet avis</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MOTIFS_AVIS.map((m) => (
                        <button key={m.id} type="button" onClick={() => setReportMotif(m.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${reportMotif === m.id ? "border-red-400 bg-white text-red-700" : "border-red-100 text-neutral-500 bg-white/60"}`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <input value={reportText} onChange={(e) => setReportText(e.target.value)} maxLength={300} placeholder="Précisions (optionnel)"
                      className="w-full bg-white border border-red-100 rounded-full px-3 py-1.5 text-xs font-semibold outline-none font-body" />
                    <div className="flex gap-2">
                      <button onClick={() => sendReport(r.id)} disabled={!reportMotif} className="text-xs font-bold bg-red-500 text-white px-4 py-1.5 rounded-full disabled:opacity-40">Envoyer</button>
                      <button onClick={() => setReportFor(null)} className="text-xs font-bold text-neutral-400 px-2">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReportFor(r.id)} className="text-[11px] font-bold text-neutral-300 hover:text-red-500 transition">🚩 Signaler cet avis</button>
                )}
              </div>
            )}
            {isOwner && !r.pro_reply && (replyFor === r.id ? (
              <div className="mt-3 ml-4 flex gap-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply(r.id)}
                  placeholder="Votre réponse publique..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2 text-xs font-semibold outline-none font-body" />
                <button onClick={() => sendReply(r.id)} className="text-xs font-bold text-coral">Répondre</button>
              </div>
            ) : (
              <button onClick={() => setReplyFor(r.id)} className="mt-2 ml-4 text-[11px] font-bold text-neutral-400 hover:text-coral transition">↩ Répondre à cet avis</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
