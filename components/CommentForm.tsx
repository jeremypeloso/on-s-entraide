"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm({ annonceId }: { annonceId: string }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) return;
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/connexion");
      return;
    }

    const { error } = await supabase.from("annonce_comments").insert({
      annonce_id: annonceId,
      author_id: user.id,
      body: body.trim(),
    });

    setSending(false);
    if (error) {
      setError("Impossible d'envoyer la question. Réessayez.");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={300}
        placeholder="Posez votre question..."
        className="flex-1 bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body"
      />
      <button
        type="submit"
        disabled={sending || body.trim().length < 2}
        className="bg-ink text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-ink/85 transition disabled:opacity-40"
      >
        {sending ? "..." : "Envoyer"}
      </button>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
    </form>
  );
}
