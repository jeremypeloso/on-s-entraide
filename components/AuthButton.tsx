"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Cached = { logged: boolean; initial: string };

function readCache(): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("ose_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AuthButton() {
  const [state, setState] = useState<Cached | null>(null);

  useEffect(() => {
    // Le premier rendu doit être identique au serveur (hydratation),
    // le cache est appliqué immédiatement après le montage
    const cached = readCache();
    if (cached) setState(cached);

    const supabase = createClient();

    function apply(user: any) {
      const next: Cached = user
        ? {
            logged: true,
            initial: ((user.user_metadata?.full_name as string) || user.email || "?")
              .charAt(0)
              .toUpperCase(),
          }
        : { logged: false, initial: "" };
      setState(next);
      try {
        sessionStorage.setItem("ose_auth", JSON.stringify(next));
      } catch {}
    }

    supabase.auth.getUser().then(({ data: { user } }) => apply(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      apply(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (!state?.logged) {
    return (
      <a
        href="/connexion"
        className="hidden sm:inline-flex text-sm font-bold px-5 py-2.5 rounded-full text-ink/70 hover:text-ink hover:bg-neutral-100 transition"
      >
        Se connecter
      </a>
    );
  }

  return (
    <a
      href="/compte"
      className="hidden sm:inline-flex items-center gap-2 text-sm font-bold pl-2 pr-4 py-1.5 rounded-full hover:bg-neutral-100 transition"
      aria-label="Mon compte"
    >
      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white flex items-center justify-center text-sm font-extrabold">
        {state.initial}
      </span>
      Mon compte
    </a>
  );
}
