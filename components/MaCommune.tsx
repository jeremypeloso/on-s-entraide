"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Commune = { nom: string; slug: string };

function readCache(): Commune | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("ose_commune");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function MaCommune() {
  const [commune, setCommune] = useState<Commune | null>(null);

  useEffect(() => {
    // Le premier rendu doit être identique au serveur (hydratation),
    // le cache est appliqué immédiatement après le montage
    const cached = readCache();
    if (cached) setCommune(cached);

    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      let next: Commune | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("communes:commune_residence_id (nom, slug)")
          .eq("id", user.id)
          .single();
        // @ts-expect-error jointure typée souplement
        next = profile?.communes ?? null;
      }
      setCommune(next);
      try {
        if (next) sessionStorage.setItem("ose_commune", JSON.stringify(next));
        else sessionStorage.removeItem("ose_commune");
      } catch {}
    }

    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  if (!commune) return null;

  return (
    <a
      href={`/${commune.slug}`}
      className="inline-flex items-center gap-2 text-sm font-bold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-mint/10 text-ink hover:bg-mint/20 transition max-w-[44px] sm:max-w-[220px] justify-center"
      title={`Ma commune : ${commune.nom}`}
      aria-label={`Ma commune : ${commune.nom}`}
    >
      <span className="text-base">🏡</span>
      <span className="hidden sm:inline truncate">{commune.nom}</span>
    </a>
  );
}
