"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AnnonceOwnerActions({
  annonceId,
  communeSlug,
}: {
  annonceId: string;
  communeSlug: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function supprimer() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("annonces").delete().eq("id", annonceId);
    if (error) {
      setDeleting(false);
      setConfirming(false);
      return;
    }
    router.push(`/${communeSlug}`);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-5">
      <p className="text-xs font-bold text-neutral-400 uppercase mb-3">Votre annonce</p>
      <div className="space-y-2.5">
        <a
          href={`/annonce/${annonceId}/modifier`}
          className="block text-center w-full border-2 border-ink text-ink text-sm font-bold py-3 rounded-full hover:bg-ink hover:text-white transition"
        >
          ✏️ Modifier
        </a>
        {confirming ? (
          <div className="border border-red-200 bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-red-700 mb-3">Supprimer définitivement ?</p>
            <div className="flex gap-2">
              <button
                onClick={supprimer}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-full hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? "..." : "Oui, supprimer"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-white border border-neutral-200 text-xs font-bold py-2.5 rounded-full"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="block w-full text-sm font-bold py-3 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
