"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `il y a ${Math.max(mins, 1)} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("conversations")
        .select("id, annonce_id, participant_a, participant_b, last_message_at, annonces(title), messages(body, sender_id, created_at, read_at)")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      const list = data ?? [];
      // Noms des interlocuteurs
      const others = Array.from(new Set(list.map((c: any) => (c.participant_a === user.id ? c.participant_b : c.participant_a))));
      const { data: profs } = others.length ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", others) : { data: [] };
      const byId = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      setConvs(list.map((c: any) => {
        const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        const msgs = [...(c.messages ?? [])].sort((x: any, y: any) => x.created_at.localeCompare(y.created_at));
        const lastMsg = msgs[msgs.length - 1];
        const unread = msgs.filter((m: any) => m.sender_id !== user.id && !m.read_at).length;
        return { ...c, other: byId[otherId], lastMsg, unread };
      }));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold mb-6">💬 Mes messages</h1>
        {loading ? (
          <p className="text-neutral-400 font-bold animate-pulse">Chargement...</p>
        ) : convs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-bold">Aucune conversation pour le moment</p>
            <p className="text-sm text-neutral-500 font-body mt-1">Contactez un voisin depuis une annonce pour démarrer.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
            {convs.map((c) => (
              <a key={c.id} href={`/messages/${c.id}`} className={`flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition ${c.unread ? "bg-orange-50/50" : ""}`}>
                {c.other?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.other.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white font-extrabold flex items-center justify-center flex-shrink-0">
                    {(c.other?.full_name ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${c.unread ? "font-extrabold" : "font-bold"}`}>{c.other?.full_name ?? "Un habitant"}</p>
                    {c.lastMsg && <span className="text-[11px] font-bold text-neutral-300 flex-shrink-0">{timeAgo(c.lastMsg.created_at)}</span>}
                  </div>
                  {c.annonces?.title ? <p className="text-[11px] font-bold text-coral-dark truncate">📋 {c.annonces.title}</p> : <p className="text-[11px] font-bold text-ink/60">🛡️ Support On se dit tout</p>}
                  {c.lastMsg && (
                    <p className={`text-xs truncate font-body ${c.unread ? "text-ink font-semibold" : "text-neutral-500"}`}>
                      {c.lastMsg.sender_id === userId ? "Vous : " : ""}{c.lastMsg.body}
                    </p>
                  )}
                </div>
                {c.unread > 0 && <span className="w-6 h-6 rounded-full bg-coral text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">{c.unread}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
