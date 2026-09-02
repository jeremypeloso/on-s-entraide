"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminProvider, useAdmin } from "@/components/admin/AdminContext";

const NAV = [
  { href: "/admin", icon: "◫", label: "Vue d'ensemble" },
  { href: "/admin/moderation", icon: "🚩", label: "Modération", badge: (c: any) => (c.signalements ?? 0) + (c.avisSignales ?? 0) },
  { href: "/admin/messages", icon: "📬", label: "Messages", badge: (c: any) => c.contacts },
  { href: "/admin/annonces", icon: "📋", label: "Annonces" },
  { href: "/admin/utilisateurs", icon: "👥", label: "Utilisateurs" },
  { href: "/admin/pros", icon: "💼", label: "Pros" },
  { href: "/admin/associations", icon: "🎭", label: "Associations", badge: (c: any) => c.assosAttente },
  { href: "/admin/mairies", icon: "🏛️", label: "Mairies" },
  { href: "/admin/ambassadeurs", icon: "📣", label: "Ambassadeurs", badge: (c: any) => (c.ambCandidats ?? 0) + (c.cartesAttente ?? 0) },
  { href: "/admin/reglages", icon: "⚙️", label: "Réglages" },
];

function Sidebar() {
  const path = usePathname();
  const { counts } = useAdmin();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-ink text-white min-h-screen sticky top-0 px-4 py-6">
        <Link href="/" className="flex items-center gap-2 px-2 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-blanc.webp" alt="onseditout.fr" className="h-7 w-auto" />
        </Link>
        <nav className="space-y-0.5 flex-1">
          {NAV.map((n) => {
            const b = n.badge?.(counts);
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                  active(n.href) ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                <span className="w-5 text-center text-base leading-none">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {!!b && <span className="text-[10px] font-extrabold bg-coral text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">{b}</span>}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="text-xs font-bold text-white/40 hover:text-white px-3 py-2 transition">← Retour au site</Link>
      </aside>

      {/* Mobile / tablette */}
      <div className="lg:hidden sticky top-0 z-40 bg-ink text-white">
        <div className="flex items-center justify-between px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-blanc.webp" alt="onseditout.fr" className="h-6 w-auto" />
          <Link href="/" className="text-xs font-bold text-white/60">← Site</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-none">
          {NAV.map((n) => {
            const b = n.badge?.(counts);
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${active(n.href) ? "bg-white text-ink" : "bg-white/10 text-white/70"}`}>
                {n.icon} {n.label}{!!b && <span className="text-coral">{b}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.body.classList.add("admin-mode");
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!p?.is_admin) { router.push("/"); return; }
      setChecking(false);
    })();
    return () => document.body.classList.remove("admin-mode");
  }, [router]);

  if (checking) {
    return <main className="font-display min-h-screen flex items-center justify-center bg-[#F6F5FA]"><p className="text-neutral-400 font-bold animate-pulse">Vérification des accès…</p></main>;
  }

  return (
    <AdminProvider>
      <div className="font-display bg-[#F6F5FA] min-h-screen flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-5xl">{children}</div>
        </main>
      </div>
    </AdminProvider>
  );
}
