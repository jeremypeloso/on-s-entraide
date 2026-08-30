"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ZoneMap from "@/components/ZoneMap";

type ProProfile = {
  id: string;
  business_name: string;
  siret: string | null;
  siret_verified: boolean;
  tagline: string | null;
  description: string | null;
  subscription_status: string;
  subscription_plan: string | null;
};
type Service = { id: string; label: string; price_from: number | null; price_note: string | null };
type BaseCommune = { id: string; nom: string; code_postal: string | null; departement: string | null; lat: number | null; lng: number | null };
type CommuneSug = { id: string; nom: string; code_postal: string | null; departement: string | null };

const PLANS = [
  { id: "essentiel", label: "Essentiel", price: "19€/mois", desc: "Section pros sous les annonces", radius: 10 },
  { id: "visibilite", label: "Visibilité", price: "39€/mois", desc: "Encart Pros du quartier", radius: 25 },
  { id: "premium", label: "Premium", price: "79€/mois", desc: "Bandeau en haut de page", radius: 50 },
];

const RADIUS: Record<string, number> = { essentiel: 10, visibilite: 25, premium: 50 };

export default function EspaceProPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [pro, setPro] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [baseCommune, setBaseCommune] = useState<BaseCommune | null>(null);
  const [zoneCount, setZoneCount] = useState<number | null>(null);
  const [refreshingZone, setRefreshingZone] = useState(false);

  // Formulaire profil (activation et édition)
  const [businessName, setBusinessName] = useState("");
  const [siret, setSiret] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [telephone, setTelephone] = useState("");
  const [emailPro, setEmailPro] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nouveau service
  const [svcLabel, setSvcLabel] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcNote, setSvcNote] = useState("");

  // Recherche commune pour la zone
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSug[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }
      setUserId(user.id);

      const { data: p } = await supabase
        .from("pro_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (p) {
        setPro(p);
        setBusinessName(p.business_name);
        setSiret(p.siret ?? "");
        setTagline(p.tagline ?? "");
        setDescription(p.description ?? "");
        setTelephone(p.telephone ?? "");
        setEmailPro(p.email ?? "");
        setSiteWeb(p.site_web ?? "");

        const { data: svcs } = await supabase
          .from("pro_services")
          .select("*")
          .eq("pro_id", user.id);
        setServices(svcs ?? []);

        const { data: pWithBase } = await supabase
          .from("pro_profiles")
          .select("communes:base_commune_id (id, nom, code_postal, departement, lat, lng)")
          .eq("id", user.id)
          .single();
        // @ts-expect-error jointure typée souplement
        setBaseCommune(pWithBase?.communes ?? null);

        const { count } = await supabase
          .from("pro_zones")
          .select("*", { count: "exact", head: true })
          .eq("pro_id", user.id);
        setZoneCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchCommunes = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    const isPostal = /^\d{2,5}$/.test(q.trim());
    let req = supabase
      .from("communes")
      .select("id, nom, code_postal, departement")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(5);
    req = isPostal ? req.ilike("code_postal", `${q.trim()}%`) : req.ilike("nom", `%${q.trim()}%`);
    const { data } = await req;
    setSuggestions(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCommunes(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchCommunes]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (businessName.trim().length < 2) { setError("Le nom de l'activité est requis."); return; }
    setSaving(true);
    setError(null);
    setSaved(false);

    const { data, error } = await supabase
      .from("pro_profiles")
      .upsert({
        id: userId,
        business_name: businessName.trim(),
        siret: siret.trim() || null,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        telephone: telephone.trim() || null,
        email: emailPro.trim() || null,
        site_web: siteWeb.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (error) { setError("Enregistrement impossible."); return; }
    setPro(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function choosePlan(planId: string) {
    // Paiement Stripe à venir : en phase de lancement, activation directe
    const { data, error } = await supabase
      .from("pro_profiles")
      .update({ subscription_plan: planId, subscription_status: "active" })
      .eq("id", userId)
      .select()
      .single();
    if (!error) {
      setPro(data);
      await refreshZone();
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (svcLabel.trim().length < 2) return;
    const { data, error } = await supabase
      .from("pro_services")
      .insert({
        pro_id: userId,
        label: svcLabel.trim(),
        price_from: svcPrice ? Number(svcPrice) : null,
        price_note: svcNote.trim() || null,
      })
      .select()
      .single();
    if (!error && data) {
      setServices((prev) => [...prev, data]);
      setSvcLabel(""); setSvcPrice(""); setSvcNote("");
    }
  }

  async function removeService(id: string) {
    const { error } = await supabase.from("pro_services").delete().eq("id", id);
    if (!error) setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function refreshZone() {
    setRefreshingZone(true);
    const { data: count } = await supabase.rpc("refresh_pro_zone", { p_pro: userId });
    setZoneCount(typeof count === "number" ? count : 0);
    setRefreshingZone(false);
  }

  async function setBase(c: CommuneSug) {
    setQuery("");
    setSuggestions([]);
    const { error } = await supabase
      .from("pro_profiles")
      .update({ base_commune_id: c.id })
      .eq("id", userId);
    if (error) return;
    const { data: full } = await supabase
      .from("communes")
      .select("id, nom, code_postal, departement, lat, lng")
      .eq("id", c.id)
      .single();
    setBaseCommune(full ?? null);
    await refreshZone();
  }

  if (loading) {
    return (
      <main className="font-display min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 font-bold animate-pulse">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="font-display bg-neutral-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* En-tête */}
        <div className="bg-gradient-to-br from-orange-50 to-white border border-coral/20 rounded-3xl p-8">
          <p className="text-xs font-bold uppercase text-neutral-400 mb-1">Espace pro</p>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 flex-wrap">
            {pro ? pro.business_name : "Activez votre profil professionnel"}
            {pro?.siret_verified ? (
              <span className="text-[11px] bg-mint text-white px-2.5 py-1 rounded-full">✓ SIRET vérifié</span>
            ) : pro ? (
              <span className="text-[11px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">⏳ Vérification en cours</span>
            ) : null}
          </h1>
          {pro && pro.subscription_status === "active" && pro.subscription_plan && (
            <p className="text-sm font-bold text-mint mt-1">
              Abonnement {PLANS.find((p) => p.id === pro.subscription_plan)?.label ?? pro.subscription_plan} actif
            </p>
          )}
        </div>

        {/* Profil */}
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
          <h2 className="font-bold text-lg mb-1">💼 {pro ? "Mon activité" : "Votre activité"}</h2>
          <p className="text-sm text-neutral-500 font-body mb-6">
            {pro
              ? "Ces informations apparaissent sur les pages des communes de votre zone."
              : "Renseignez votre activité : nous vérifions votre SIRET sous 48h avant l'affichage du badge."}
          </p>
          <form onSubmit={saveProfile} className="space-y-4 font-body">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="Nom de l'activité — ex : L'Atelier Duval"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
              <input
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="SIRET (14 chiffres)"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={90}
              placeholder="Accroche — ex : Menuiserie et petits travaux depuis 12 ans"
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Description de vos services..."
              className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition resize-none"
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
              <input
                type="email"
                value={emailPro}
                onChange={(e) => setEmailPro(e.target.value)}
                placeholder="Email de contact"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
              <input
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
                placeholder="Site web (https://...)"
                className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
              />
            </div>
            {error && (
              <div className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
            )}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-br from-coral to-coral-dark text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-coral/25 hover:scale-[1.02] transition disabled:opacity-40 font-display"
              >
                {saving ? "..." : pro ? "Enregistrer" : "Créer mon profil pro"}
              </button>
              {saved && <span className="text-sm font-bold text-mint">✓ Enregistré</span>}
            </div>
          </form>
        </div>

        {pro && (
          <>
            {/* Abonnement */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
              <h2 className="font-bold text-lg mb-1">💳 Mon abonnement</h2>
              <p className="text-sm text-neutral-500 font-body mb-6">
                Le paiement en ligne arrive bientôt. En phase de lancement, l&apos;activation est immédiate.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map((p) => {
                  const active = pro.subscription_plan === p.id && pro.subscription_status === "active";
                  return (
                    <button
                      key={p.id}
                      onClick={() => choosePlan(p.id)}
                      className={`text-left rounded-2xl p-5 border-2 transition ${
                        active
                          ? "border-coral bg-orange-50 shadow-md"
                          : "border-neutral-100 hover:border-neutral-300"
                      }`}
                    >
                      <p className="font-bold">{p.label}</p>
                      <p className="text-lg font-extrabold text-coral-dark">{p.price}</p>
                      <p className="text-xs text-neutral-500 font-body mt-1">{p.desc}</p>
                      {active && <p className="text-[11px] font-bold text-mint mt-2">✓ Plan actuel</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
              <h2 className="font-bold text-lg mb-5">🛠️ Mes services et tarifs</h2>
              {services.length > 0 && (
                <div className="space-y-2.5 mb-6">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 border border-neutral-100 rounded-2xl px-5 py-3.5">
                      <p className="flex-1 font-bold text-sm">{s.label}</p>
                      <p className="text-sm font-bold text-coral-dark flex-shrink-0">
                        {s.price_from != null ? `dès ${s.price_from}€` : ""}
                        {s.price_note && <span className="text-neutral-400 font-semibold"> · {s.price_note}</span>}
                      </p>
                      <button
                        onClick={() => removeService(s.id)}
                        className="text-xs font-bold text-neutral-300 hover:text-red-500 transition flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={addService} className="grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 font-body">
                <input
                  value={svcLabel}
                  onChange={(e) => setSvcLabel(e.target.value)}
                  placeholder="Service — ex : Pose de cuisine"
                  className="bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                />
                <input
                  value={svcPrice}
                  onChange={(e) => setSvcPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Prix dès (€)"
                  className="bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                />
                <input
                  value={svcNote}
                  onChange={(e) => setSvcNote(e.target.value)}
                  placeholder="Précision"
                  className="bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition"
                />
                <button
                  type="submit"
                  className="bg-ink text-white text-sm font-bold px-5 rounded-xl hover:bg-ink/85 transition font-display"
                >
                  ＋
                </button>
              </form>
            </div>

            {/* Zone d'intervention */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
              <h2 className="font-bold text-lg mb-1">📍 Ma zone d&apos;intervention</h2>
              <p className="text-sm text-neutral-500 font-body mb-5">
                Votre abonnement définit le rayon autour de votre adresse de départ :
                Essentiel 10 km, Visibilité 25 km, Premium 50 km. Toutes les communes
                du cercle sont couvertes automatiquement.
              </p>

              {baseCommune ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 bg-mint/10 border border-mint/30 text-sm font-bold px-4 py-2 rounded-full">
                      🏡 Départ : {baseCommune.nom}
                      <button
                        onClick={() => setBaseCommune(null)}
                        className="text-neutral-400 hover:text-coral transition"
                        title="Changer de commune de départ"
                      >
                        ✎
                      </button>
                    </span>
                    <span className="inline-flex items-center gap-2 bg-orange-50 border border-coral/20 text-sm font-bold px-4 py-2 rounded-full">
                      ⭕ Rayon {RADIUS[pro.subscription_plan ?? "essentiel"] ?? 10} km
                    </span>
                    <span className="text-sm font-bold text-neutral-400">
                      {refreshingZone
                        ? "Calcul en cours..."
                        : zoneCount != null
                          ? `${zoneCount} commune${zoneCount > 1 ? "s" : ""} couverte${zoneCount > 1 ? "s" : ""}`
                          : ""}
                    </span>
                  </div>

                  {baseCommune.lat != null && baseCommune.lng != null && (
                    <ZoneMap
                      lat={baseCommune.lat}
                      lng={baseCommune.lng}
                      radiusKm={RADIUS[pro.subscription_plan ?? "essentiel"] ?? 10}
                      label={baseCommune.nom}
                    />
                  )}

                  <button
                    onClick={refreshZone}
                    disabled={refreshingZone}
                    className="text-sm font-bold text-coral hover:text-coral-dark transition disabled:opacity-40"
                  >
                    ↻ Recalculer ma zone
                  </button>
                </div>
              ) : (
                <div className="relative max-w-md">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Votre commune de départ (siège, atelier, domicile)..."
                    className="w-full bg-neutral-50 border-2 border-transparent focus:border-coral/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-40">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setBase(s)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition"
                        >
                          <span className="text-sm">🏡</span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-bold truncate">{s.nom}</span>
                            <span className="block text-xs text-neutral-400 font-semibold">
                              {s.code_postal} · {s.departement}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
