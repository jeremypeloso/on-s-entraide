"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Counts = {
  users?: number; annonces?: number; annoncesActives?: number; pros?: number; prosActifs?: number; certifiees?: number;
  signalements?: number; contacts?: number; comments?: number; avisSignales?: number; assosAttente?: number;
  ambCandidats?: number; ambActifs?: number; cartesAttente?: number;
};

type Ctx = {
  api: (action: string, payload?: any) => Promise<any>;
  act: (action: string, payload: any, msg: string) => Promise<boolean>;
  notify: (msg: string, kind?: "ok" | "error") => void;
  counts: Counts;
  refreshCounts: () => Promise<void>;
  tick: number; // s'incrémente après chaque act() : les pages rechargent leurs données
};

const AdminCtx = createContext<Ctx | null>(null);

export async function api(action: string, payload?: any) {
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Réponse invalide du serveur (${res.status})` }; }
  } catch (e: any) {
    return { error: e?.message ?? "Erreur réseau" };
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Counts>({});
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "error" } | null>(null);
  const [tick, setTick] = useState(0);

  const notify = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshCounts = useCallback(async () => {
    const r = await api("stats");
    if (!r.error) setCounts(r);
  }, []);

  const act = useCallback(async (action: string, payload: any, msg: string) => {
    const r = await api(action, payload);
    if (r.error) { notify(r.error, "error"); return false; }
    notify(msg);
    setTick((t) => t + 1);
    refreshCounts();
    return true;
  }, [notify, refreshCounts]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  return (
    <AdminCtx.Provider value={{ api, act, notify, counts, refreshCounts, tick }}>
      {children}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm font-bold shadow-xl font-display ${
          toast.kind === "ok" ? "bg-ink text-white" : "bg-red-500 text-white"
        }`}>
          {toast.kind === "ok" ? "✓ " : "⚠️ "}{toast.msg}
        </div>
      )}
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin hors AdminProvider");
  return ctx;
}

// Charge les données d'une page et les recharge après chaque action.
export function useAdminData<T = any>(action: string, payload?: any) {
  const { tick } = useAdmin();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const key = JSON.stringify(payload ?? null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!data) setLoading(true);
      const r = await api(action, payload);
      if (alive) { setData(r); setLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, key, tick, version]);

  return { data, loading, reload: () => setVersion((v) => v + 1) };
}
