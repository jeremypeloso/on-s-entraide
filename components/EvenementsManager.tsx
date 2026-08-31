"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/upload";

type Evenement = {
  id: string; titre: string; description: string | null; starts_at: string; ends_at: string | null;
  lieu: string | null; photo_url: string | null;
};

export default function EvenementsManager({
  communeId, communeNom, organisateurType = "mairie", organisateurNom, associationId,
}: {
  communeId: string; communeNom: string; organisateurType?: "mairie" | "association"; organisateurNom?: string; associationId?: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Evenement[]>([]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    let q = supabase
      .from("evenements")
      .select("*")
      .eq("commune_id", communeId)
      .eq("organisateur_type", organisateurType)
      .order("starts_at", { ascending: true });
    if (associationId) q = q.eq("association_id", associationId);
    const { data } = await q;
    setItems(data ?? []);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [communeId]);

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    if (titre.trim().length < 3 || !date) { setError("Titre et date sont requis."); return; }
    setSending(true);
    setError(null);

    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile, "evenements");
      if (!photoUrl) { setSending(false); setError("L'envoi de l'affiche a échoué."); return; }
    }

    const { data: { user } } = await supabase.auth.getUser();
    const startsAt = new Date(`${date}T${heure || "00:00"}:00`).toISOString();

    const { error } = await supabase.from("evenements").insert({
      commune_id: communeId,
      author_id: user?.id,
      organisateur_type: organisateurType,
      organisateur_nom: organisateurNom ?? `Mairie de ${communeNom}`,
      association_id: associationId ?? null,
      titre: titre.trim(),
      description: description.trim() || null,
      starts_at: startsAt,
      lieu: lieu.trim() || null,
      photo_url: photoUrl,
    });
    setSending(false);
    if (error) { setError("Publication impossible : " + error.message); return; }
    setTitre(""); setDescription(""); setDate(""); setHeure(""); setLieu(""); setPhotoFile(null);
    load();
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cet événement ?")) return;
    await supabase.from("evenements").delete().eq("id", id);
    load();
  }

  const input = "w-full bg-neutral-50 border-2 border-transparent focus:border-lilac/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition font-body";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 sm:p-8">
      <h2 className="font-bold text-lg mb-1">📅 Événements</h2>
      <p className="text-sm text-neutral-500 font-body mb-6">
        {organisateurType === "association"
          ? <>Loto, tournoi, portes ouvertes, assemblée générale : chaque événement apparaît dans l&apos;agenda de {communeNom}.</>
          : <>Fête, réunion publique, cérémonie, marché : chaque événement apparaît dans l&apos;agenda de {communeNom}.</>}
      </p>

      <form onSubmit={publier} className="space-y-3 mb-6">
        <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} placeholder="Titre — ex : Fête du village, Réunion publique PLU" className={input} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={input} />
          <input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Lieu — ex : Salle des fêtes" className={input} />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} placeholder="Description (programme, tarifs, inscriptions...)" className={`${input} resize-none`} />
        <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 cursor-pointer">
          <span className="border border-dashed border-neutral-300 rounded-xl px-4 py-2.5 hover:border-lilac transition">🖼️ {photoFile ? photoFile.name : "Ajouter une affiche (optionnel)"}</span>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="hidden" />
        </label>
        {error && <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-body">{error}</p>}
        <button type="submit" disabled={sending} className="bg-lilac text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-lilac/25 hover:scale-[1.02] transition disabled:opacity-40">
          {sending ? "Publication..." : "Publier dans l'agenda"}
        </button>
      </form>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((ev) => {
            const d = new Date(ev.starts_at);
            const past = d < new Date(Date.now() - 86400000);
            return (
              <div key={ev.id} className={`flex items-center gap-3 border border-neutral-100 rounded-2xl px-4 py-3 ${past ? "opacity-50" : ""}`}>
                <div className="w-12 text-center bg-lilac/10 rounded-xl py-1.5 flex-shrink-0">
                  <p className="text-base font-extrabold text-lilac leading-none">{String(d.getDate()).padStart(2, "0")}</p>
                  <p className="text-[9px] font-bold text-lilac">{d.toLocaleDateString("fr-FR", { month: "short" })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{ev.titre}</p>
                  <p className="text-xs text-neutral-400 font-semibold truncate">{[ev.lieu, past ? "Passé" : null].filter(Boolean).join(" · ")}</p>
                </div>
                <button onClick={() => supprimer(ev.id)} className="text-xs font-bold text-neutral-300 hover:text-red-500 transition flex-shrink-0">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
