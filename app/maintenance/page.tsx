import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "maintenance").single();
  const message: string =
    data?.value?.message ||
    "Nous améliorons le site pour vous. Revenez dans quelques instants, merci de votre patience !";

  return (
    <main className="font-display min-h-[70vh] flex items-center justify-center px-6 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl shadow-ink/5 border border-neutral-100 p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="onseditout.fr" className="h-12 w-auto mx-auto mb-6" />
        <p className="text-5xl mb-4">🛠️</p>
        <h1 className="text-2xl font-extrabold mb-3">Site en maintenance</h1>
        <p className="text-neutral-500 font-body leading-relaxed">{message}</p>
        <p className="text-[11px] font-bold text-red-500 mt-6">🚨 Urgence ? 17 · 15 · 112</p>
      </div>
    </main>
  );
}
