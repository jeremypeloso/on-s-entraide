import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendContactEmail } from "@/lib/resend";

// Formulaire de contact : enregistrement en base + email à l'équipe
export async function POST(request: Request) {
  const { sujet, nom, email, message } = await request.json();
  if (!sujet || !email || !message || String(message).trim().length < 10) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  const db = createAdminClient();
  const { error } = await db.from("contact_messages").insert({
    sujet, nom: nom?.trim() || null, email: String(email).trim(), message: String(message).trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try { await sendContactEmail(sujet, nom?.trim() || null, String(email).trim(), String(message).trim()); }
  catch (e) { console.error("Email contact :", e); }

  return NextResponse.json({ ok: true });
}