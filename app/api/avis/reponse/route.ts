import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Réponse d'un pro à un avis : seul le pro concerné peut répondre, et il ne peut
// modifier QUE sa réponse (jamais la note ni le texte du client), d'où le service role
// après contrôle, plutôt qu'une policy update trop large.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { reviewId, reply } = await request.json();
  if (!reviewId || !reply || String(reply).trim().length < 2 || String(reply).length > 600) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: review } = await admin.from("pro_reviews").select("id, pro_id").eq("id", reviewId).single();
  if (!review || review.pro_id !== user.id) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  await admin
    .from("pro_reviews")
    .update({ pro_reply: String(reply).trim(), replied_at: new Date().toISOString() })
    .eq("id", reviewId);

  return NextResponse.json({ ok: true });
}
