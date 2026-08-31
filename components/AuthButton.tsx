"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Cached = { logged: boolean; initial: string; avatar?: string | null; unread?: number };

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

    async function apply(user: any) {
      let avatar: string | null = null;
      let unread = 0;
      if (user) {
        const { data: p } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        avatar = p?.avatar_url ?? null;
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true })
          .neq("sender_id", user.id).is("read_at", null);
        unread = count ?? 0;
      }
      const next: Cached = user
        ? {
            logged: true,
            initial: ((user.user_metadata?.full_name as string) || user.email || "?")
              .charAt(0)
              .toUpperCase(),
            avatar,
            unread,
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
        className="inline-flex items-center gap-2 text-sm font-bold px-3 sm:px-5 py-2.5 rounded-full text-ink/70 hover:text-ink hover:bg-neutral-100 transition"
        aria-label="Se connecter"
      >
        <svg className="sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="hidden sm:inline">Se connecter</span>
      </a>
    );
  }

  return (
    <a
      href="/compte"
      className="relative inline-flex items-center gap-2 text-sm font-bold pl-2 pr-2 sm:pr-4 py-1.5 rounded-full hover:bg-neutral-100 transition"
      aria-label="Mon compte"
    >
      {!!state.unread && (
        <span className="absolute -top-0.5 left-6 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
          {state.unread > 9 ? "9+" : state.unread}
        </span>
      )}
      {state.avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={state.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-coral via-pink to-lilac text-white flex items-center justify-center text-sm font-extrabold">
          {state.initial}
        </span>
      )}
      <span className="hidden sm:inline">Mon compte</span>
    </a>
  );
}
