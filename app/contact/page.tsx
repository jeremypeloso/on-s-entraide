"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const SUJETS = [
  { id: "mairie", label: "🏛️ Je représente une mairie (démo, certification)" },
  { id: "pro", label: "💼 Question sur l'offre professionnelle" },
  { id: "compte", label: "👤 Problème de compte ou correction de nom" },
  { id: "signalement", label: "🚩 Signaler un problème sur la plateforme" },
  { id: "autre", label: "💬 Autre demande" },
];

export default function ContactPage() {
  const [sujet, setSujet] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("sujet");
    if (s && SUJETS.some((x) => x.id === s)) setSujet(s);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sujet || message.trim().length < 10) {
      setError("Choisissez un sujet et décrivez votre demande (10 caractères minimum).");
      return;
    }
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert({
      sujet,
      nom: nom.trim() || null,
      email: email.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      setError("Envoi impossible. Réessayez dans un instant.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center px-6 bg-neutral-50">
        <div className="max-w-md text-center bg-white rounded-3xl shadow-sm border border-neutral-100 p-10">
          <p className="text-4xl mb-4">📬</p>
          <h1 className="text-xl font-bold mb-2">Message bien reçu !</h1>
          <p className="text-sm text-neutral-500 font-body">
            Nous revenons vers vous rapidement, généralement sous 48h ouvrées.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Nous contacter 💬</h1>
          <p className="text-neutral-500 font-body">
            Mairies, professionnels, habitants : on vous répond sous 48h.
          </p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-7 space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-2">Votre demande concerne</label>
            <div className="space-y-1.5">
              {SUJETS.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 text-[13px] font-semibold px-3 py-2.5 rounded-xl cursor-pointer border transition ${
                    sujet === s.id ? "border-coral bg-orange-50" : "border-neutral-100 hover:border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="sujet"
                    checked={sujet === s.id}
                    onChange={() => setSujet(s.id)}
                    className="accent-coral"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom (ou commune / entreprise)"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            required
            placeholder="Votre message..."
            className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition resize-none"
          />
          {error && (
            <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.01] transition disabled:opacity-50 font-display"
          >
            {sending ? "Envoi..." : "Envoyer le message"}
          </button>
        </form>
      </div>
    </main>
  );
}
