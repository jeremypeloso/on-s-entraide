"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type News = { enabled: boolean; version: number; date: string; title: string; items: string[] };
const KEY = "osdt_news_seen";

// Fenêtre "Quoi de neuf" : s'affiche une fois par version publiée depuis l'admin.
export default function NouveautesPopup() {
  const [news, setNews] = useState<News | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await createClient().from("site_settings").select("value").eq("key", "nouveautes").maybeSingle();
        const n = data?.value as News | undefined;
        if (!n?.enabled || !n.items?.length) return;
        if (Number(localStorage.getItem(KEY) ?? 0) >= n.version) return;
        setNews(n);
      } catch {}
    })();
  }, []);

  if (!news) return null;
  const close = () => { localStorage.setItem(KEY, String(news.version)); setNews(null); };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 font-display" onClick={close}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeUp_.3s_ease]">
        <div className="bg-gradient-to-br from-coral to-coral-dark text-white px-7 pt-7 pb-6">
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Quoi de neuf</p>
          <h2 className="text-2xl font-extrabold mt-1 leading-tight">{news.title || "Du nouveau sur le site ✨"}</h2>
          <p className="text-xs font-body opacity-75 mt-2">{new Date(news.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <ul className="px-7 py-6 space-y-3">
          {news.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-sm font-body text-neutral-700">
              <span className="text-coral font-bold mt-0.5">★</span><span>{it}</span>
            </li>
          ))}
        </ul>
        <div className="px-7 pb-7">
          <button onClick={close} className="w-full bg-ink text-white font-bold py-3 rounded-full hover:bg-ink/90 transition">C'est noté 👍</button>
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
