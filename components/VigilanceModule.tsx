"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPES = [
  { id: "comportement", emoji: "👀", label: "Comportement inhabituel" },
  { id: "cambriolage", emoji: "🏠", label: "Tentative ou repérage" },
  { id: "degradation", emoji: "🧱", label: "Dégradation, vandalisme" },
  { id: "voirie", emoji: "💡", label: "Éclairage, voirie" },
  { id: "depot", emoji: "🗑️", label: "Dépôt sauvage" },
  { id: "animal", emoji: "🐕", label: "Animal errant ou perdu" },
  { id: "autre", emoji: "📌", label: "Autre" },
];

function typeOf(id: string | null) {
  return TYPES.find((t) => t.id === id) ?? TYPES[TYPES.length - 1];
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `il y a ${Math.max(mins, 1)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export default function VigilanceModule({
  communeId,
  communeName,
  isResident,
}: {
  communeId: string;
  communeName: string;
  isResident: boolean;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [signalements, setSignalements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  // Commentaires
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ count }, { data: sigs }] = await Promise.all([
      supabase.from("vigilance_members").select("*", { count: "exact", head: true }).eq("commune_id", communeId),
      supabase
        .from("vigilance_signalements")
        .select("*, profiles(full_name), vigilance_comments(id, body, created_at, profiles(full_name))")
        .eq("commune_id", communeId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setMemberCount(count ?? 0);
    setSignalements(sigs ?? []);

    if (user) {
      const { data: m } = await supabase
        .from("vigilance_members")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("commune_id", communeId)
        .limit(1);
      setIsMember(!!m && m.length > 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communeId]);

  useEffect(() => { if (isResident) load(); else setLoading(false); }, [isResident, load]);

  async function toggleMembership() {
    if (!userId) return;
    if (isMember) {
      await supabase.from("vigilance_members").delete().eq("user_id", userId).eq("commune_id", communeId);
    } else {
      await supabase.from("vigilance_members").insert({ user_id: userId, commune_id: communeId });
    }
    load();
  }

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    if (!type || title.trim().length < 5) return;
    setSending(true);
    const { data, error } = await supabase
      .from("vigilance_signalements")
      .insert({
        author_id: userId,
        commune_id: communeId,
        type,
        title: title.trim(),
        description: description.trim() || null,
      })
      .select()
      .single();
    setSending(false);
    if (error || !data) return;

    // Notification email des membres, en tâche de fond
    fetch("/api/vigilance/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalementId: data.id }),
    }).catch(() => {});

    setFormOpen(false);
    setType(""); setTitle(""); setDescription("");
    load();
  }

  async function marquerResolu(id: string) {
    await supabase.from("vigilance_signalements").update({ statut: "resolu" }).eq("id", id);
    load();
  }

  async function commenter(signalementId: string) {
    if (commentText.trim().length < 2) return;
    await supabase.from("vigilance_comments").insert({
      signalement_id: signalementId,
      author_id: userId,
      body: commentText.trim(),
    });
    setCommentText("");
    load();
  }

  // ===== Non-résident : état verrouillé =====
  if (!isResident) {
    return (
      <div className="bg-neutral-100 rounded-2xl p-5 text-center">
        <h4 className="font-bold mb-2">👀 Vigilance de quartier</h4>
        <p className="text-xs text-neutral-500 font-body font-semibold">
          🔒 Réservé aux habitants déclarés de {communeName}. Déclarez votre commune
          de résidence depuis votre compte pour y accéder.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-bold">👀 Vigilance de quartier</h4>
        <button
          onClick={toggleMembership}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition flex-shrink-0 ${
            isMember
              ? "bg-white border border-red-200 text-red-800 hover:border-red-400"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {isMember ? "✓ Membre" : "Rejoindre"}
        </button>
      </div>
      <p className="text-xs font-bold text-red-800 mb-3">
        {memberCount} habitant{memberCount > 1 ? "s" : ""} membre{memberCount > 1 ? "s" : ""} · alertés par email
      </p>

      {/* Publication */}
      {isMember && !formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          className="w-full bg-white border border-red-200 text-red-800 text-sm font-bold py-2.5 rounded-full hover:border-red-400 transition mb-3"
        >
          ＋ Publier un signalement
        </button>
      )}
      {isMember && formOpen && (
        <form onSubmit={publier} className="bg-white rounded-2xl p-4 mb-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition ${
                  type === t.id ? "border-red-400 bg-red-50 text-red-800" : "border-neutral-200 text-neutral-500"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Que se passe-t-il ? (lieu approximatif, sans nom de personne)"
            className="w-full bg-neutral-50 border-2 border-transparent focus:border-red-300 rounded-xl px-3 py-2.5 text-[13px] font-semibold outline-none transition font-body"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            rows={2}
            placeholder="Précisions utiles (heure, description factuelle)..."
            className="w-full bg-neutral-50 border-2 border-transparent focus:border-red-300 rounded-xl px-3 py-2.5 text-[13px] font-semibold outline-none transition font-body resize-none"
          />
          <p className="text-[10px] font-bold text-neutral-400 font-body leading-relaxed">
            Restez factuel : pas de noms, pas d&apos;accusations, pas de photos de personnes.
            Les membres de la vigilance seront prévenus par email.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending || !type || title.trim().length < 5}
              className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-full hover:bg-red-700 transition disabled:opacity-40"
            >
              {sending ? "Publication..." : "Publier et alerter les membres"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="px-3 text-xs font-bold text-neutral-400">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Fil des signalements */}
      {loading ? (
        <p className="text-xs font-bold text-neutral-400 animate-pulse py-2">Chargement...</p>
      ) : signalements.length === 0 ? (
        <p className="text-xs font-bold text-neutral-400 py-2">Aucun signalement en cours. 🎉</p>
      ) : (
        <div className="space-y-2">
          {signalements.map((s) => {
            const t = typeOf(s.type);
            const comments = s.vigilance_comments ?? [];
            const resolu = s.statut === "resolu";
            return (
              <div key={s.id} className={`bg-white rounded-2xl p-3.5 ${resolu ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0">{t.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-neutral-500 font-body mt-0.5">{s.description}</p>
                    )}
                    <p className="text-[10px] font-bold text-neutral-400 mt-1.5">
                      {s.profiles?.full_name ?? "Un résident"} · {timeAgo(s.created_at)}
                      {resolu && <span className="text-mint ml-2">✓ Résolu</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 pl-8">
                  <button
                    onClick={() => setOpenComments(openComments === s.id ? null : s.id)}
                    className="text-[11px] font-bold text-neutral-400 hover:text-red-700 transition"
                  >
                    💬 {comments.length} réponse{comments.length > 1 ? "s" : ""}
                  </button>
                  {!resolu && s.author_id === userId && (
                    <button
                      onClick={() => marquerResolu(s.id)}
                      className="text-[11px] font-bold text-neutral-400 hover:text-mint transition"
                    >
                      ✓ Marquer résolu
                    </button>
                  )}
                </div>

                {openComments === s.id && (
                  <div className="mt-2 pl-8 space-y-2">
                    {comments
                      .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
                      .map((c: any) => (
                        <div key={c.id} className="bg-neutral-50 rounded-xl px-3 py-2">
                          <p className="text-xs font-body">{c.body}</p>
                          <p className="text-[10px] font-bold text-neutral-400 mt-0.5">
                            {c.profiles?.full_name ?? "Un résident"} · {timeAgo(c.created_at)}
                          </p>
                        </div>
                      ))}
                    {isMember && (
                      <div className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && commenter(s.id)}
                          placeholder="Répondre..."
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus:border-red-300 transition font-body"
                        />
                        <button
                          onClick={() => commenter(s.id)}
                          className="text-xs font-bold text-red-700 flex-shrink-0"
                        >
                          Envoyer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-xs bg-red-600 text-white rounded-xl p-3 font-bold">
        🚨 En cas d&apos;urgence réelle, composez le 17 (police), le 15 (SAMU) ou le 112.
        Ce réseau ne remplace jamais les secours.
      </div>
    </div>
  );
}
