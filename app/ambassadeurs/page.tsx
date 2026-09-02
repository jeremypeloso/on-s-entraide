"use client";

import { useState } from "react";

const ROLES = [
  { icon: "📣", t: "Faire connaître le site", d: "Un ou deux posts par semaine dans les groupes Facebook de votre commune, avec les visuels et les textes que nous vous fournissons." },
  { icon: "✍️", t: "Lancer les premières annonces", d: "Un objet à prêter, un coup de main, une alerte. Les dix premières annonces d'une commune donnent envie aux autres de s'y mettre." },
  { icon: "🤝", t: "Amener les pros et la mairie", d: "Votre lien de parrainage suit chaque commerçant ou collectivité que vous faites venir." },
];

const GAINS = [
  "Badge Ambassadeur sur votre profil et sur la page de votre commune",
  "Un mois d'abonnement offert à chaque pro parrainé, cumulable",
  "Abonnement Visibilité offert si vous êtes commerçant",
  "Ligne directe avec l'équipe et accès aux nouveautés en avant-première",
];

const input = "w-full mt-1.5 px-4 py-3 rounded-xl border border-neutral-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral";

export default function AmbassadeursPage() {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", commune: "", profil: "habitant", motivation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/ambassadeurs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "candidater", payload: form }),
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
          Un ambassadeur par commune fait vivre onseditout.fr localement : il parle du site, poste les premières annonces et ouvre la porte aux commerçants et à la mairie.
        </p>
        <a href="#candidature" className="inline-flex mt-8 bg-gradient-to-br from-coral to-coral-dark text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-105 transition">
          Proposer ma candidature
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
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-extrabold">Candidature envoyée</h2>
              <p className="font-body text-neutral-600 mt-2">Nous revenons vers vous sous 48 h. Votre lien de parrainage sera actif dès validation :</p>
              <code className="inline-block mt-4 bg-neutral-100 rounded-xl px-4 py-2.5 text-sm font-mono break-all">https://onseditout.fr/?ref={done}</code>
              <p className="font-body text-xs text-neutral-400 mt-4">Créez un compte avec le même email pour retrouver vos statistiques dans <a href="/ambassadeurs/espace" className="underline">votre espace ambassadeur</a>.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="text-2xl font-extrabold">Proposer ma candidature</h2>
              <p className="font-body text-sm text-neutral-500 mt-1 mb-6">Cinq champs, deux minutes. Nous revenons vers vous sous 48 h.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">Nom et prénom<input required value={form.nom} onChange={set("nom")} className={input} /></label>
                <label className="text-sm font-bold">Email<input required type="email" value={form.email} onChange={set("email")} className={input} /></label>
                <label className="text-sm font-bold">Téléphone <span className="text-neutral-400 font-semibold">(facultatif)</span><input value={form.telephone} onChange={set("telephone")} className={input} /></label>
                <label className="text-sm font-bold">Commune<input required value={form.commune} onChange={set("commune")} placeholder="Limetz-Villez" className={input} /></label>
                <label className="text-sm font-bold sm:col-span-2">Vous êtes
                  <select value={form.profil} onChange={set("profil")} className={input}>
                    <option value="habitant">Habitant</option>
                    <option value="commercant">Commerçant / artisan</option>
                    <option value="association">Membre d'une association</option>
                    <option value="elu">Élu ou agent de la commune</option>
                  </select>
                </label>
                <label className="text-sm font-bold sm:col-span-2">Pourquoi vous ? <span className="text-neutral-400 font-semibold">(facultatif)</span>
                  <textarea rows={3} value={form.motivation} onChange={set("motivation")} placeholder="Admin d'un groupe Facebook, président d'asso, commerçant du centre…" className={input} />
                </label>
              </div>
              {error && <p className="text-sm font-bold text-red-500 mt-4">{error}</p>}
              <button disabled={loading} className="w-full mt-6 bg-gradient-to-br from-coral to-coral-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition disabled:opacity-60">
                {loading ? "Envoi…" : "Envoyer ma candidature"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
