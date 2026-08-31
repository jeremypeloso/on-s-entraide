import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendCommentNotificationEmail } from "@/lib/resend";

// Prévient l'auteur d'une annonce qu'une question publique a été posée
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { annonceId, body } = await request.json();
  const db = createAdminClient();
  const { data: annonce } = await db.from("annonces").select("id, title, author_id").eq("id", annonceId).single();
  if (!annonce || annonce.author_id === user.id) return NextResponse.json({ ok: true, sent: 0 });

  const { data: prefs } = await db.from("profiles").select("notif_questions").eq("id", annonce.author_id).single();
  if (prefs && prefs.notif_questions === false) return NextResponse.json({ ok: true, sent: 0 });

  try {
    const { data: rec } = await db.auth.admin.getUserById(annonce.author_id);
    const { data: sender } = await db.from("profiles").select("full_name").eq("id", user.id).single();
    if (rec?.user?.email) {
      await sendCommentNotificationEmail(rec.user.email, sender?.full_name ?? "Un habitant", annonce.title, annonce.id, String(body ?? "").slice(0, 300));
      return NextResponse.json({ ok: true, sent: 1 });
    }
  } catch (e) { console.error("notify comment:", e); }
  return NextResponse.json({ ok: true, sent: 0 });
}
