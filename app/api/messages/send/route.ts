import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendNewMessageEmail } from "@/lib/resend";

// Envoie un message dans une conversation et prévient le destinataire par email
// (au plus un email par conversation et par tranche de 30 minutes)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { conversationId, body } = await request.json();
  const text = String(body ?? "").trim();
  if (!conversationId || text.length < 1 || text.length > 2000) return NextResponse.json({ error: "Message invalide" }, { status: 400 });

  const db = createAdminClient();
  const { data: conv } = await db.from("conversations")
    .select("id, participant_a, participant_b, annonce_id, last_notified_at, annonces(title)").eq("id", conversationId).single();
  if (!conv || (conv.participant_a !== user.id && conv.participant_b !== user.id)) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const { data: msg, error } = await db.from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);

  // Notification email du destinataire (throttle 30 min)
  const recipientId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
  const last = conv.last_notified_at ? new Date(conv.last_notified_at).getTime() : 0;
  if (Date.now() - last > 30 * 60 * 1000) {
    try {
      const { data: rec } = await db.auth.admin.getUserById(recipientId);
      const { data: senderProfile } = await db.from("profiles").select("full_name").eq("id", user.id).single();
      if (rec?.user?.email) {
        // @ts-expect-error jointure typée souplement
        await sendNewMessageEmail(rec.user.email, senderProfile?.full_name ?? "Un habitant", conv.annonces?.title ?? "", conversationId);
        await db.from("conversations").update({ last_notified_at: new Date().toISOString() }).eq("id", conversationId);
      }
    } catch (e) { console.error("Email message:", e); }
  }

  return NextResponse.json({ ok: true, message: msg });
}
