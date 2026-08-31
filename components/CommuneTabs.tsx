"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import AnnoncesList from "@/components/AnnoncesList";
import VerifiedBadge from "@/components/VerifiedBadge";
import VigilanceModule from "@/components/VigilanceModule";
import { assoCat } from "@/lib/associations";

type Tab = "fil" | "agenda" | "pros" | "assos" | "mairie" | "vigilance";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return { jour: JOURS[d.getDay()], num: String(d.getDate()).padStart(2, "0"), mois: MOIS[d.getMonth()],
    heure: d.getHours() || d.getMinutes() ? `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}` : null };
}

export default function CommuneTabs({
  commune, coordonnees, annonces, prosPremium, prosVisibilite, prosEssentiel, alertes, evenements, associations = [], isResident,
}: {
  commune: any; coordonnees: any; annonces: any[]; prosPremium: any[]; prosVisibilite: any[]; prosEssentiel: any[];
  alertes: any[]; evenements: any[]; associations?: any[]; isResident: boolean;
}) {
  const [tab, setTab] = useState<Tab>("fil");
  const [query, setQuery] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);
  const bandRef = useRef<HTMLDivElement>(null);
  const [bandArrows, setBandArrows] = useState({ left: false, right: false });

  function updateBand() {
    const el = bandRef.current;
    if (!el) return;
    setBandArrows({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }
  function scrollBand(dir: 1 | -1) {
    bandRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }
  useEffect(() => {
    updateBand();
    window.addEventListener("resize", updateBand);
    return () => window.removeEventListener("resize", updateBand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, prosPremium.length]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => setShowArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const allPros = [...prosPremium, ...prosVisibilite, ...prosEssentiel];
  const evenementsAVenir = useMemo(
    () => evenements.filter((e) => new Date(e.ends_at ?? e.starts_at) >= new Date(Date.now() - 86400000)),
    [evenements]
  );
  const prochain = evenementsAVenir[0];

  // Recherche transversale côté client
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return null;
    const has = (...xs: (string | null | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(q));
    return {
      annonces: annonces.filter((a) => has(a.title, a.description, a.categories?.label)),
      pros: allPros.filter((p) => has(p.business_name, p.tagline, p.description)),
      evenements: evenements.filter((e) => has(e.titre, e.lieu, e.organisateur_nom, e.description)),
      alertes: alertes.filter((a) => has(a.title, a.body)),
      associations: associations.filter((a) => has(a.nom, a.description)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "fil", label: "🔥 Le fil" },
    { id: "agenda", label: "📅 Agenda", badge: evenementsAVenir.length || undefined },
    { id: "pros", label: "💼 Pros & commerces" },
    { id: "assos", label: "🎭 Associations", badge: associations.length || undefined },
    { id: "mairie", label: "🏛️ Mairie", badge: alertes.length || undefined },
    { id: "vigilance", label: "👀 Vigilance" },
  ];

  const ProRow = ({ p, sponsored }: { p: any; sponsored: boolean }) => (
    <a href={`/pro/${p.id}`} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition hover:shadow-md min-w-0 ${
      sponsored ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300" : "bg-white border-neutral-100 hover:border-neutral-200"}`}>
      {p.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.logo_url} alt="" className={`w-10 h-10 rounded-xl object-contain bg-white p-0.5 flex-shrink-0 border ${sponsored ? "border-amber-200" : "border-neutral-100"}`} />
      ) : (
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold flex-shrink-0 ${sponsored ? "bg-white border border-amber-200 text-amber-700" : "bg-neutral-100 text-neutral-500"}`}>
          {p.business_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm flex items-center gap-1.5 min-w-0"><span className="truncate">{p.business_name}</span>{p.siret_verified && <VerifiedBadge />}</p>
        <p className="text-xs text-neutral-500 flex items-center gap-1.5 min-w-0">
          {p.rating_count > 0 && <span className="text-sun font-bold flex-shrink-0">★ {p.rating_avg.toFixed(1)} <span className="text-neutral-400 font-semibold">({p.rating_count})</span></span>}
          {p.tagline && <span className="truncate min-w-0">{p.tagline}</span>}
        </p>
      </div>
      {sponsored && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 flex-shrink-0">Mis en avant</span>}
    </a>
  );

  const AssoCard = ({ a }: { a: any }) => {
    const cat = assoCat(a.categorie);
    const next = evenementsAVenir.find((e) => e.association_id === a.id);
    return (
      <a href={`/association/${a.id}`} className="bg-white border border-neutral-100 rounded-2xl p-4 flex gap-3 hover:border-lilac/40 hover:shadow-md transition">
        {a.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={a.logo_url} alt="" className="w-11 h-11 rounded-xl object-contain bg-white border border-neutral-100 p-0.5 flex-shrink-0" />
        ) : (
          <span className="w-11 h-11 rounded-xl bg-lilac/10 flex items-center justify-center text-xl flex-shrink-0">{cat.emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm flex items-center gap-1.5"><span className="truncate">{a.nom}</span>{a.is_verified && <span className="text-[9px] font-bold bg-lilac text-white px-1.5 py-0.5 rounded-full flex-shrink-0">✓</span>}</p>
          <p className="text-[11px] font-bold text-lilac">{cat.label}</p>
          {next ? (
            <p className="text-[11px] font-bold text-neutral-500 mt-1.5">📅 {next.titre} · {fmtDate(next.starts_at).jour} {fmtDate(next.starts_at).num} {fmtDate(next.starts_at).mois}</p>
          ) : a.description ? (
            <p className="text-xs text-neutral-500 font-body mt-1 line-clamp-2">{a.description}</p>
          ) : null}
        </div>
      </a>
    );
  };

  const EventCard = ({ e }: { e: any }) => {
    const d = fmtDate(e.starts_at);
    const isMairie = e.organisateur_type === "mairie";
    return (
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-5 flex gap-4">
        <div className="flex-shrink-0 w-16 text-center bg-lilac/10 rounded-2xl py-2 self-start">
          <p className="text-[10px] font-bold text-lilac uppercase">{d.jour}</p>
          <p className="text-2xl font-extrabold text-lilac leading-none">{d.num}</p>
          <p className="text-[10px] font-bold text-lilac">{d.mois}</p>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug">{e.titre}</h3>
          <p className="text-[13px] text-neutral-500 font-body mt-0.5">
            {[e.lieu, d.heure].filter(Boolean).join(" · ")}
          </p>
          {e.description && <p className="text-[13px] text-neutral-600 font-body mt-1.5 line-clamp-2">{e.description}</p>}
          <p className="text-[11px] font-bold mt-2">
            <span className={`rounded-full px-2 py-0.5 ${isMairie ? "bg-sky/10 text-sky" : "bg-lilac/10 text-lilac"}`}>
              {isMairie ? "🏛️" : "🎭"} {e.organisateur_nom ?? (isMairie ? `Mairie de ${commune.nom}` : "Association")}
            </span>
          </p>
        </div>
        {e.photo_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={e.photo_url} alt="" className="hidden sm:block w-24 h-24 rounded-2xl object-cover flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <main className="font-display">
      {/* ===== En-tête commune compact ===== */}
      <div className="bg-gradient-to-br from-mint/20 to-sky/20 border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <span className="text-4xl">🏡</span>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight flex items-center gap-2">
                  {commune.nom}
                  {commune.is_certified && <VerifiedBadge color="#4D8DFF" title="Commune certifiée" size={20} />}
                </h1>
                <p className="text-xs font-bold text-neutral-500">
                  {commune.departement} · {commune.population ? `${commune.population.toLocaleString("fr-FR")} habitants` : commune.code_postal}
                </p>
              </div>
          {commune.is_certified && coordonnees && (coordonnees.telephone || coordonnees.email || coordonnees.adresse) && (
            <div className="flex items-center gap-2 ml-auto lg:hidden">
              {coordonnees.telephone && (
                <a href={`tel:${coordonnees.telephone.replace(/\s/g, "")}`} aria-label="Appeler la mairie"
                  className="w-9 h-9 rounded-full bg-white border border-sky/30 shadow-sm flex items-center justify-center hover:bg-sky/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4D8DFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" /></svg>
                </a>
              )}
              {coordonnees.email && (
                <a href={`mailto:${coordonnees.email}`} aria-label="Écrire à la mairie"
                  className="w-9 h-9 rounded-full bg-white border border-sky/30 shadow-sm flex items-center justify-center hover:bg-sky/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4D8DFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg>
                </a>
              )}
              {coordonnees.adresse && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Mairie, ${coordonnees.adresse}, ${commune.nom}`)}`}
                  target="_blank" rel="noopener noreferrer" aria-label="Itinéraire vers la mairie"
                  className="w-9 h-9 rounded-full bg-white border border-sky/30 shadow-sm flex items-center justify-center hover:bg-sky/10 transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4D8DFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                </a>
              )}
            </div>
          )}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto text-[12px] font-bold">
              <span className="bg-white/80 rounded-full px-3.5 py-1.5">📋 {annonces.length} annonce{annonces.length > 1 ? "s" : ""}</span>
              {evenementsAVenir.length > 0 && <span className="bg-white/80 rounded-full px-3.5 py-1.5">📅 {evenementsAVenir.length} événement{evenementsAVenir.length > 1 ? "s" : ""}</span>}
              {allPros.length > 0 && <span className="bg-white/80 rounded-full px-3.5 py-1.5">💼 {allPros.length} pro{allPros.length > 1 ? "s" : ""}</span>}
            </div>
          </div>

          {/* Recherche */}
          <div className="relative max-w-xl mt-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Rechercher à ${commune.nom} : une annonce, un pro, un événement...`}
              className="w-full bg-white border border-neutral-200 focus:border-coral/60 rounded-full pl-11 pr-4 py-3 text-sm font-semibold outline-none shadow-sm transition font-body"
            />
          </div>
        </div>

        {/* Onglets */}
        {!results && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            {showArrow && (
              <div className="absolute right-3 top-0 bottom-0 pointer-events-none z-10 flex items-center">
                <span className="w-7 h-7 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2440" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </div>
            )}
            <div ref={tabsRef} className="flex gap-1 overflow-x-auto no-scrollbar -mb-px pr-12">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap text-sm font-bold px-4 py-3 border-b-[3px] transition ${
                    tab === t.id ? "border-coral text-coral-dark" : "border-transparent text-ink/60 hover:text-ink"}`}
                >
                  {t.label}
                  {t.badge ? <span className="ml-1.5 text-[10px] bg-coral text-white rounded-full px-1.5 py-0.5">{t.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ===== Résultats de recherche ===== */}
        {results ? (
          <div className="space-y-6">
            <p className="text-sm font-bold text-neutral-400">
              {results.annonces.length + results.pros.length + results.evenements.length + results.alertes.length + results.associations.length} résultat(s) pour « {query} »
              <button onClick={() => setQuery("")} className="ml-3 text-coral">Effacer</button>
            </p>
            {results.annonces.length > 0 && <div><h3 className="font-bold mb-3">📋 Annonces</h3><AnnoncesList annonces={results.annonces} /></div>}
            {results.pros.length > 0 && <div><h3 className="font-bold mb-3">💼 Pros</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">{results.pros.map((p) => <ProRow key={p.id} p={p} sponsored={p.subscription_plan !== "essentiel"} />)}</div></div>}
            {results.evenements.length > 0 && <div><h3 className="font-bold mb-3">📅 Événements</h3><div className="space-y-3">{results.evenements.map((e) => <EventCard key={e.id} e={e} />)}</div></div>}
            {results.associations.length > 0 && <div><h3 className="font-bold mb-3">🎭 Associations</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">{results.associations.map((a) => <AssoCard key={a.id} a={a} />)}</div></div>}
            {results.alertes.length > 0 && <div><h3 className="font-bold mb-3">🏛️ Informations mairie</h3><div className="space-y-3">{results.alertes.map((a) => <div key={a.id} className="bg-sky/5 border border-sky/20 rounded-3xl p-5"><h4 className="font-bold">{a.title}</h4>{a.body && <p className="text-[13px] text-neutral-600 font-body mt-1">{a.body}</p>}</div>)}</div></div>}
            {results.annonces.length + results.pros.length + results.evenements.length + results.alertes.length + results.associations.length === 0 && (
              <p className="text-center text-sm font-bold text-neutral-300 py-10">Rien trouvé à {commune.nom} pour cette recherche.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* ===== Colonne principale ===== */}
            <div className="min-w-0">
              {tab === "fil" && (
                <>
                  {prosPremium.length > 0 && (
                    <div className="relative mb-5 group">
                      {bandArrows.left && (
                        <button onClick={() => scrollBand(-1)} aria-label="Précédent"
                          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-neutral-200 items-center justify-center hover:scale-105 transition">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B2440" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                      )}
                      {bandArrows.right && (
                        <button onClick={() => scrollBand(1)} aria-label="Suivant"
                          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-neutral-200 items-center justify-center hover:scale-105 transition">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B2440" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      )}
                    <div ref={bandRef} onScroll={updateBand} className="flex gap-3 overflow-x-auto no-scrollbar">
                      {prosPremium.map((p: any) => (
                        <a key={p.id} href={`/pro/${p.id}`} className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3 hover:border-amber-300 transition">
                          {p.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.logo_url} alt="" className="w-9 h-9 rounded-xl object-contain bg-white border border-amber-200 p-0.5" />
                          ) : (
                            <span className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center font-extrabold text-amber-700">{p.business_name.charAt(0)}</span>
                          )}
                          <div className="min-w-0"><p className="text-sm font-bold leading-tight flex items-center gap-1.5"><span className="truncate max-w-[160px]">{p.business_name}</span>{p.siret_verified && <VerifiedBadge size={14} />}</p>
                          {p.tagline && <p className="text-[11px] text-neutral-500 truncate max-w-[200px]">{p.tagline}</p>}</div>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">Mis en avant</span>
                        </a>
                      ))}
                    </div>
                    </div>
                  )}
                  <AnnoncesList annonces={annonces} />
                  {prosEssentiel.length > 0 && (
                    <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                      <h4 className="font-bold mb-1">🛠️ Les pros près de chez vous</h4>
                      <p className="text-[11px] font-bold text-amber-700/60 mb-3">Professionnels vérifiés · Sponsorisé</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">{prosEssentiel.map((p: any) => <ProRow key={p.id} p={p} sponsored={false} />)}</div>
                    </div>
                  )}
                </>
              )}

              {tab === "agenda" && (
                <div className="space-y-3">
                  {evenementsAVenir.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center">
                      <p className="text-3xl mb-2">📅</p>
                      <p className="font-bold">Aucun événement programmé</p>
                      <p className="text-sm text-neutral-500 font-body mt-1">La mairie et les associations de {commune.nom} publieront ici leurs événements.</p>
                    </div>
                  ) : evenementsAVenir.map((e) => <EventCard key={e.id} e={e} />)}
                </div>
              )}

              {tab === "pros" && (
                <div>
                  {allPros.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center">
                      <p className="text-3xl mb-2">💼</p>
                      <p className="font-bold">Aucun professionnel ne couvre encore {commune.nom}</p>
                      <a href="/pro" className="inline-block mt-3 text-sm font-bold text-coral">Vous êtes un pro du secteur ? →</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                      {prosPremium.map((p) => <ProRow key={p.id} p={p} sponsored />)}
                      {prosVisibilite.map((p) => <ProRow key={p.id} p={p} sponsored />)}
                      {prosEssentiel.map((p) => <ProRow key={p.id} p={p} sponsored={false} />)}
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-neutral-300 mt-4 text-center">Les pros sur fond ambré sont mis en avant (Sponsorisé) · SIRET vérifié = rosette</p>
                </div>
              )}

              {tab === "assos" && (
                <div>
                  {associations.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center">
                      <p className="text-3xl mb-2">🎭</p>
                      <p className="font-bold">Aucune association référencée à {commune.nom}</p>
                      <p className="text-sm text-neutral-500 font-body mt-1 max-w-md mx-auto">Chaque association peut créer sa page gratuitement et publier ses événements dans l&apos;agenda.</p>
                      <a href="/association/espace" className="inline-block mt-4 bg-lilac text-white text-sm font-bold px-5 py-2.5 rounded-full">Créer la page de mon association</a>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">{associations.map((a) => <AssoCard key={a.id} a={a} />)}</div>
                      <p className="text-center mt-5"><a href="/association/espace" className="text-sm font-bold text-lilac">Votre association n&apos;y est pas ? Créez sa page gratuitement →</a></p>
                    </>
                  )}
                </div>
              )}

              {tab === "mairie" && (
                <div className="space-y-3">
                  {commune.is_certified && coordonnees && (
                    <div className="bg-white rounded-3xl border border-sky/20 p-5">
                      <p className="text-[11px] font-bold uppercase text-sky mb-2">🏛️ Mairie de {commune.nom}</p>
                      <div className="space-y-1.5 text-[13px] font-semibold text-ink/80">
                        {coordonnees.adresse && <p>📍 {coordonnees.adresse}</p>}
                        {coordonnees.telephone && <p>📞 <a href={`tel:${coordonnees.telephone.replace(/\s/g, "")}`} className="hover:text-sky">{coordonnees.telephone}</a></p>}
                        {coordonnees.email && <p>✉️ <a href={`mailto:${coordonnees.email}`} className="hover:text-sky break-all">{coordonnees.email}</a></p>}
                        {coordonnees.horaires && <p>🕐 {coordonnees.horaires}</p>}
                        {coordonnees.site_web && <p>🌐 <a href={coordonnees.site_web} target="_blank" rel="noopener noreferrer" className="hover:text-sky break-all">{coordonnees.site_web.replace(/^https?:\/\//, "")}</a></p>}
                      </div>
                    </div>
                  )}
                  {alertes.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center">
                      <p className="text-3xl mb-2">🏛️</p>
                      <p className="font-bold">{commune.is_certified ? "Aucune information en cours" : `La mairie de ${commune.nom} n'est pas encore certifiée`}</p>
                      {!commune.is_certified && <a href="/mairies" className="inline-block mt-3 text-sm font-bold text-sky">Vous êtes élu ou agent ? Découvrez l&apos;offre →</a>}
                    </div>
                  ) : alertes.map((a: any) => (
                    <div key={a.id} className="bg-sky/5 border border-sky/20 rounded-3xl p-5">
                      <p className="text-[11px] font-bold text-sky mb-1">✓ Publiée par la mairie</p>
                      <h3 className="font-bold">{a.title}</h3>
                      {a.body && <p className="text-[13px] text-neutral-600 font-body mt-1 whitespace-pre-line">{a.body}</p>}
                      {a.photo_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.photo_url} alt="" className="mt-3 rounded-2xl max-h-64 object-cover" />}
                      {(a.starts_at || a.ends_at) && (
                        <p className="text-[11px] font-bold text-neutral-400 mt-2">
                          {a.starts_at && `Du ${new Date(a.starts_at).toLocaleDateString("fr-FR")}`}{a.ends_at && ` au ${new Date(a.ends_at).toLocaleDateString("fr-FR")}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "vigilance" && (
                <VigilanceModule communeId={commune.id} communeName={commune.nom} isResident={isResident} />
              )}
            </div>

            {/* ===== Sidebar constante ===== */}
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="hidden lg:block bg-sky/5 border border-sky/20 rounded-3xl p-5">
                <p className="font-bold text-sm flex items-center gap-2">🏛️ Mairie de {commune.nom}{commune.is_certified && <VerifiedBadge color="#4D8DFF" title="Commune certifiée" size={15} />}</p>
                {commune.is_certified && coordonnees ? (
                  <p className="text-xs text-neutral-500 font-body mt-1.5">{[coordonnees.telephone, coordonnees.horaires].filter(Boolean).join(" · ")}</p>
                ) : (
                  <p className="text-xs text-neutral-400 font-body mt-1.5">Pas encore certifiée</p>
                )}
                {alertes.length > 0 && <button onClick={() => setTab("mairie")} className="text-[11px] font-bold text-sky mt-2">{alertes.length} information{alertes.length > 1 ? "s" : ""} en cours →</button>}
              </div>

              {prochain && tab === "fil" && (
                <button onClick={() => setTab("agenda")} className="w-full text-left bg-lilac/5 border border-lilac/20 rounded-3xl p-5 hover:border-lilac/40 transition">
                  <p className="text-[11px] font-bold text-lilac mb-1.5">📅 Prochain événement</p>
                  <p className="font-bold text-sm">{prochain.titre}</p>
                  <p className="text-xs text-neutral-500 font-body">{fmtDate(prochain.starts_at).jour} {fmtDate(prochain.starts_at).num} {fmtDate(prochain.starts_at).mois}{prochain.lieu ? ` · ${prochain.lieu}` : ""}</p>
                </button>
              )}

              {prosVisibilite.length > 0 && tab === "fil" && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5">
                  <p className="font-bold text-sm mb-3">🔨 Pros du quartier <span className="text-[9px] text-amber-700/60">Sponsorisé</span></p>
                  <div className="space-y-2.5">
                    {prosVisibilite.slice(0, 4).map((p: any) => (
                      <a key={p.id} href={`/pro/${p.id}`} className="block hover:bg-white/60 rounded-xl px-2 -mx-2 py-1 transition">
                        <p className="text-sm font-bold flex items-center gap-1.5 min-w-0"><span className="truncate">{p.business_name}</span>{p.siret_verified && <VerifiedBadge size={14} />}</p>
                        {p.tagline && <p className="text-xs text-neutral-500 font-semibold truncate">{p.tagline}</p>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {tab !== "vigilance" && (
                <button onClick={() => setTab("vigilance")} className="w-full text-left bg-white border border-neutral-100 rounded-3xl p-5 hover:border-red-200 transition">
                  <p className="font-bold text-sm">👀 Vigilance de quartier</p>
                  <p className="text-xs text-neutral-500 font-body mt-1">{isResident ? "Signalements entre résidents →" : "🔒 Réservé aux habitants déclarés"}</p>
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
