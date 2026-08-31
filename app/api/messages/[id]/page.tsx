"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [conv, setConv] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages(uid: string) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at");
    setMessages(data ?? []);
    // Marquer lus les messages reçus
    await supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("conversation_id", id).neq("sender_id", uid).is("read_at", null);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      setUserId(user.id);
      const { data: c } = await supabase.from("conversations")
        .select("id, participant_a, participant_b, annonce_id, annonces(title, id)").eq("id", id).single();
      if (!c) { router.push("/messages"); return; }
      setConv(c);
      const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", otherId).single();
      setOther(p);
      await loadMessages(user.id);
      // Rafraîchissement léger toutes les 5 s quand l'onglet est visible
      timer = setInterval(() => { if (document.visibilityState === "visible") loadMessages(user.id); }, 5000);
    }
    init();
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (text.trim().length < 1 || sending) return;
    setSending(true);
    const body = text.trim();
    setText("");
    const res = await fetch("/api/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id, body }),
    });
    if (res.ok) {
      const j = await res.json();
      setMessages((m) => [...m, j.message]);
    } else {
      setText(body);
      window.alert("Envoi impossible.");
    }
    setSending(false);
  }

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* En-tête */}
        <div className="bg-white rounded-3xl border border-neutral-100 px-5 py-4 flex items-center gap-3 mb-4">
          <a href="/messages" className="text-neutral-400 hover:text-ink font-bold text-lg mr-1">←</a>
          {other?.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={other.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white font-extrabold flex items-center justify-center">
              {(other?.full_name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-bold truncate">{other?.full_name ?? "Un habitant"}</p>
            {conv?.annonces?.title && (
              <a href={`/annonce/${conv.annonces.id}`} className="text-[11px] font-bold text-coral-dark hover:underline truncate block">📋 {conv.annonces.title}</a>
            )}
          </div>
        </div>

        {/* Fil */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-4 sm:p-6 min-h-[50vh] max-h-[60vh] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-neutral-400 font-body py-10">Dites bonjour 👋</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-body ${mine ? "bg-coral text-white rounded-br-md" : "bg-neutral-100 text-ink rounded-bl-md"}`}>
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-neutral-400"}`}>
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Saisie */}
        <form onSubmit={send} className="mt-3 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            maxLength={2000}
            placeholder="Votre message... (Entrée pour envoyer)"
            className="flex-1 bg-white border border-neutral-200 focus:border-coral rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition font-body resize-none"
          />
          <button type="submit" disabled={sending || !text.trim()} className="bg-gradient-to-br from-coral to-coral-dark text-white font-bold px-5 rounded-2xl shadow-lg shadow-coral/25 disabled:opacity-40 transition">
            ➤
          </button>
        </form>
        <p className="text-[10px] text-neutral-400 font-body font-semibold mt-2 text-center">
          Restez courtois. Ne partagez jamais de coordonnées bancaires. Un problème ? <a href="/contact" className="underline">Contactez-nous</a>.
        </p>
      </div>
    </main>
  );
}
