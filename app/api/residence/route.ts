import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(request: Request) {
  const { communeId } = await request.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: commune } = await supabase
    .from("communes")
    .select("nom")
    .eq("id", communeId)
    .single();

  if (!commune) {
    return NextResponse.json({ error: "Commune introuvable" }, { status: 404 });
  }

  // upsert : crée la ligne profil si elle n'existe pas encore (compte créé avant le trigger)
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? undefined,
      commune_residence_id: communeId,
      residence_declared_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // La ville de résidence devient aussi favori par défaut (non bloquant)
  try {
    await supabase
      .from("user_favorites")
      .upsert(
        { user_id: user.id, commune_id: communeId, is_default: true },
        { onConflict: "user_id,commune_id" }
      );
  } catch {}

  // Email de bienvenue : jamais bloquant (domaine Resend non vérifié, quota, etc.)
  if (user.email) {
    try {
      await sendWelcomeEmail(user.email, commune.nom);
    } catch (e) {
      console.error("Email bienvenue non envoyé :", e);
    }
  }

  return NextResponse.json({ success: true });
}
