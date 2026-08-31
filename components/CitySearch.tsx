"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CommuneSuggestion = {
  id: string;
  nom: string;
  slug: string;
  code_postal: string | null;
  departement: string | null;
  population: number | null;
};

export default function CitySearch({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const isPostal = /^\d{2,5}$/.test(q);

    let request = supabase
      .from("communes")
      .select("id, nom, slug, code_postal, departement, population")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(12);

    if (isPostal) {
      // Recherche par code postal (préfixe : "78" propose toutes les Yvelines)
      request = request.ilike("code_postal", `${q}%`);
    } else {
      // Recherche par nom, insensible à la casse
      request = request.ilike("nom", `%${q}%`);
    }

    const { data } = await request;
    setSuggestions(data ?? []);
    setOpen(true);
    setHighlighted(-1);
    setLoading(false);
  }, []);

  // Debounce : on attend 250ms après la dernière frappe avant de requêter
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  // Fermer au clic extérieur
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(slug: string) {
    setOpen(false);
    router.push(`/${slug}`);
  }

  async function submitSearch() {
    // Suggestion surlignée ou première suggestion déjà chargée
    const target = highlighted >= 0 ? suggestions[highlighted] : suggestions[0];
    if (target) {
      goTo(target.slug);
      return;
    }
    // Sinon, recherche immédiate et navigation vers le premier résultat
    const q = value.trim();
    if (q.length < 2) return;
    setLoading(true);
    const supabase = createClient();
    const isPostal = /^\d{2,5}$/.test(q);
    let request = supabase
      .from("communes")
      .select("slug")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(1);
    request = isPostal ? request.ilike("code_postal", `${q}%`) : request.ilike("nom", `%${q}%`);
    const { data } = await request;
    setLoading(false);
    if (data && data[0]) goTo(data[0].slug);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch();
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={`relative text-left ${compact ? "w-full max-w-sm" : "max-w-xl mx-auto"}`}>
      <div
        className={`flex items-center gap-2 rounded-full transition ${
          compact
            ? "bg-neutral-100 border border-transparent focus-within:border-coral/40 focus-within:bg-white px-2 py-1.5"
            : "bg-white shadow-lg shadow-ink/10 border border-neutral-100 px-3 py-3 focus-within:border-coral/40 focus-within:shadow-xl"
        }`}
      >
        <span className={compact ? "pl-2 text-base" : "pl-3 text-xl"}>📍</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={compact ? "Chercher une commune..." : "Nom de commune ou code postal..."}
          className={`flex-1 bg-transparent outline-none font-semibold px-1 text-ink placeholder:text-neutral-400 ${
            compact ? "text-sm" : "text-base"
          }`}
          autoComplete="off"
        />
        {loading ? (
          <span className="pr-4 text-sm font-bold text-neutral-400 animate-pulse">...</span>
        ) : (
          <button
            type="button"
            onClick={submitSearch}
            aria-label="Rechercher"
            className={`flex items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-dark hover:scale-105 transition flex-shrink-0 ${
              compact ? "w-8 h-8" : "hidden sm:flex w-10 h-10"
            }`}
          >
            <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-y-auto max-h-80 z-50">
          {suggestions.length === 0 && !loading && (
            <div className="px-5 py-4 text-sm text-neutral-400 font-semibold">
              Aucune commune trouvée pour «&nbsp;{value}&nbsp;»
            </div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(s.slug)}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                i === highlighted ? "bg-orange-50" : "bg-white"
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-sm flex-shrink-0">
                🏡
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-ink truncate">{s.nom}</span>
                <span className="block text-xs text-neutral-400 font-semibold">
                  {s.code_postal} · {s.departement}
                </span>
              </span>
              {s.population != null && (
                <span className="text-[11px] font-bold text-neutral-300 flex-shrink-0">
                  {s.population.toLocaleString("fr-FR")} hab.
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
