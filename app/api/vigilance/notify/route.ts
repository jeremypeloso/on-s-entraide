import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendVigilanceAlertEmail } from "@/lib/resend";

// Notifie par email les membres de la vigilance d'une commune après un signalement.
// Sécurité : le demandeur doit être l'auteur du signalement (lu via son client RLS,
// ce qui prouve aussi qu'il est résident). Le service role ne sert qu'à récupérer
// les emails des membres.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { signalementId } = await request.json();
  if (!signalementId) return NextResponse.json({ error: "signalementId requis" }, { status: 400 });

  // Lecture via RLS : ne renvoie le signalement que si le demandeur est résident
  const { data: signalement } = await supabase
    .from("vigilance_signalements")
    .select("id, title, author_id, commune_id, communes(nom)")
    .eq("id", signalementId)
    .single();

  if (!signalement || signalement.author_id !== user.id) {
    return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });
  }

  const admin = createAdminClient();

  // Membres de la vigilance (hors auteur)
  const { data: members } = await admin
    .from("vigilance_members")
    .select("user_id")
    .eq("commune_id", signalement.commune_id)
    .neq("user_id", user.id)
    .limit(200);

  if (!members || members.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const memberIds = new Set(members.map((m) => m.user_id));

  // Emails via l'API admin auth
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emails = list.users
    .filter((u) => memberIds.has(u.id) && !!u.email)
    .map((u) => u.email as string);

  if (emails.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // @ts-expect-error jointure typée souplement
  const communeName: string = signalement.communes?.nom ?? "votre commune";

  // Envoi par lots de 40 destinataires (limite Resend : 50 par appel)
  let sent = 0;
  for (let i = 0; i < emails.length; i += 40) {
    const batch = emails.slice(i, i + 40);
    try {
      await sendVigilanceAlertEmail(batch, communeName, signalement.title);
      sent += batch.length;
    } catch {
      // un lot en échec n'empêche pas les suivants
    }
  }

  return NextResponse.json({ ok: true, sent });
}
