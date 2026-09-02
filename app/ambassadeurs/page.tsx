"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CONDITIONS_VERSION } from "@/lib/ambassadeurs";

const ROLES = [
  { icon: "📣", t: "Faire connaître le site", d: "Un ou deux posts par semaine dans les groupes Facebook de votre commune, avec les visuels et les textes que nous vous fournissons." },
  { icon: "✍️", t: "Lancer les premières annonces", d: "Un objet à prêter, un coup de main, une alerte. Les dix premières annonces d'une commune donnent envie aux autres de s'y mettre." },
  { icon: "🤝", t: "Ouvrir la porte aux pros et à la mairie", d: "Votre lien de parrainage suit chaque commerçant ou collectivité que vous faites venir." },
];

const GAINS = [
  "Badge Ambassadeur sur votre profil et sur la page de votre commune",
  "Des points à chaque habitant, pro ou mairie que vous amenez, échangeables contre des cartes cadeaux (15 à 200 €)",
  "Ligne directe avec l'équipe et accès aux nouveautés en avant-première",
];

const input = "w-full mt-1.5 px-4 py-3 rounded-xl border border-neutral-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral";

export default function AmbassadeursPage() {
  const [user, setUser] = useState<{ id: string; prenom: string } | null | undefined>(undefined);
  const [deja, setDeja] = useState(false);
  const [form, setForm] = useState({ commune: "", motivation: "" });
  const [accepte, setAccepte] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setUser(null); return; }
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("full_name, communes:commune_residence_id(nom)").eq("id", u.id).maybeSingle(),
        supabase.from("ambassadeurs").select("id").eq("user_id", u.id).maybeSingle(),
      ]);
      setUser({ id: u.id, prenom: (p?.full_name ?? "").split(" ")[0] });
      setDeja(!!a);
      const nomCommune = (p as any)?.communes?.nom;
      if (nomCommune) setForm((f) => ({ ...f, commune: nomCommune }));
      } catch (e) { console.error(e); setUser(null); }
    }
    init();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/ambassadeurs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "candidater", payload: { ...form, accepte } }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.error) { setError(json.error); return; }
    setDone(json.ref_code);
  }

  return (
    <main className="font-display bg-gradient-to-b from-orange-50 via-pink-50/50 to-white">
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <span className="inline-block text-xs font-bold bg-coral/10 text-coral px-3.5 py-1.5 rounded-full mb-5">Programme ambassadeurs</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
          Vous connaissez tout le monde dans votre commune ?<br className="hidden sm:block" /> On a besoin de vous. 🙌
        </h1>
        <p className="font-body text-neutral-600 text-lg max-w-2xl mx-auto mt-6">
          Un ambassadeur, c'est un habitant qui fait vivre onseditout.fr dans sa commune : il en parle autour de lui, poste les premières annonces et ouvre la porte aux commerçants et à la mairie.
        </p>
        <a href="#candidature" className="inline-flex mt-8 bg-gradient-to-br from-coral to-coral-dark text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-105 transition">
          Devenir ambassadeur
        </a>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-14 grid gap-5 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.t} className="bg-white rounded-3xl border border-neutral-100 shadow-lg shadow-ink/5 p-7">
            <div className="text-3xl mb-4">{r.icon}</div>
            <h2 className="font-extrabold text-lg">{r.t}</h2>
            <p className="font-body text-sm text-neutral-600 mt-2 leading-relaxed">{r.d}</p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-14">
        <div className="bg-ink text-white rounded-3xl p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold">Ce que vous y gagnez</h2>
          <ul className="mt-5 space-y-3 font-body">
            {GAINS.map((g) => (
              <li key={g} className="flex gap-3 items-start"><span className="text-sun mt-0.5">★</span><span className="text-white/85">{g}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section id="candidature" className="max-w-2xl mx-auto px-6 pb-24">
        <div className="bg-white rounded-3xl shadow-xl shadow-ink/10 border border-neutral-100 p-8">
          {user === undefined ? (
            <p className="text-center text-neutral-400 font-bold animate-pulse">Chargement…</p>
          ) : user === null ? (
            <div className="text-center">
              <h2 className="text-2xl font-extrabold">Un compte, puis deux questions</h2>
              <p className="font-body text-neutral-600 mt-2">Les ambassadeurs sont des habitants inscrits sur le site. Connectez-vous ou créez votre compte gratuit, puis revenez ici.</p>
              <a href="/connexion" className="inline-flex mt-6 bg-ink text-white font-bold px-7 py-3.5 rounded-full hover:bg-ink/90 transition">Me connecter</a>
            </div>
          ) : deja ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📣</div>
              <h2 className="text-2xl font-extrabold">Vous êtes déjà ambassadeur</h2>
              <a href="/ambassadeurs/espace" className="inline-flex mt-6 bg-ink text-white font-bold px-7 py-3.5 rounded-full hover:bg-ink/90 transition">Voir mon espace</a>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-extrabold">Candidature envoyée</h2>
              <p className="font-body text-neutral-600 mt-2">Nous revenons vers vous sous 48 h. Votre lien de parrainage sera actif dès validation :</p>
              <code className="inline-block mt-4 bg-neutral-100 rounded-xl px-4 py-2.5 text-sm font-mono break-all">https://onseditout.fr/?ref={done}</code>
              <a href="/ambassadeurs/espace" className="block font-body text-sm underline text-neutral-500 mt-4">Mon espace ambassadeur</a>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="text-2xl font-extrabold">Bonjour {user.prenom || "vous"}, deux questions</h2>
              <p className="font-body text-sm text-neutral-500 mt-1 mb-6">Nous revenons vers vous sous 48 h.</p>
              <div className="grid gap-4">
                <label className="text-sm font-bold">Votre commune<input required value={form.commune} onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))} placeholder="Limetz-Villez" className={input} /></label>
                <label className="text-sm font-bold">Pourquoi vous ? <span className="text-neutral-400 font-semibold">(facultatif)</span>
                  <textarea rows={3} value={form.motivation} onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))} placeholder="Admin d'un groupe Facebook, membre d'une asso, je connais tout le quartier…" className={input} />
                </label>
              </div>
              <label className="flex items-start gap-3 mt-5 font-body text-sm cursor-pointer">
                <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1 accent-coral w-4 h-4" />
                <span>J'ai lu et j'accepte les <a href="/ambassadeurs/conditions" target="_blank" className="underline font-bold">conditions du programme ambassadeurs</a> (version {CONDITIONS_VERSION}). Engagement bénévole, points sans valeur monétaire, cartes cadeaux selon les paliers en vigueur.</span>
              </label>
              {error && <p className="text-sm font-bold text-red-500 mt-4">{error}</p>}
              <button disabled={loading || !accepte} className="w-full mt-6 bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition disabled:opacity-60">
                {loading ? "Envoi…" : "Envoyer ma candidature"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
