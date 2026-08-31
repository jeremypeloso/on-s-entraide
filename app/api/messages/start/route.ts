import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Ouvre (ou retrouve) la conversation entre le demandeur et l'auteur d'une annonce
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { annonceId } = await request.json();
  const db = createAdminClient();
  const { data: annonce } = await db.from("annonces").select("id, author_id, title").eq("id", annonceId).single();
  if (!annonce) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (annonce.author_id === user.id) return NextResponse.json({ error: "C'est votre annonce" }, { status: 400 });

  // Paire ordonnée pour l'unicité
  const [a, b] = [user.id, annonce.author_id].sort();
  const { data: existing } = await db.from("conversations").select("id")
    .eq("annonce_id", annonceId).eq("participant_a", a).eq("participant_b", b).maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id });

  const { data: created, error } = await db.from("conversations")
    .insert({ annonce_id: annonceId, participant_a: a, participant_b: b }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: created.id });
}
