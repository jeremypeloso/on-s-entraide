import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Deux actions :
//  - candidater  : dépôt de candidature (ouvert à tous, insertion via service role)
//  - parrainage  : à l'inscription, rattache le nouveau compte à l'ambassadeur du cookie osdt_ref

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return `AMB-${c}`;
}

export async function POST(request: Request) {
  const { action, payload } = await request.json();
  const db = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (action === "candidater") {
      const nom = String(payload?.nom ?? "").trim();
      const email = String(payload?.email ?? "").trim().toLowerCase();
      const commune = String(payload?.commune ?? "").trim();
      const profil = ["habitant", "commercant", "association", "elu"].includes(payload?.profil) ? payload.profil : "habitant";
      const telephone = String(payload?.telephone ?? "").trim() || null;
      const motivation = String(payload?.motivation ?? "").trim() || null;
      if (!nom || !email || !commune) return NextResponse.json({ error: "Nom, email et commune sont obligatoires." }, { status: 400 });

      const { data: existing } = await db.from("ambassadeurs").select("id").eq("email", email).maybeSingle();
      if (existing) return NextResponse.json({ error: "Une candidature existe déjà avec cet email." }, { status: 409 });

      let ref_code = genCode();
      for (let i = 0; i < 5; i++) {
        const { data: dup } = await db.from("ambassadeurs").select("id").eq("ref_code", ref_code).maybeSingle();
        if (!dup) break;
        ref_code = genCode();
      }

      const { error } = await db.from("ambassadeurs").insert({
        user_id: user?.id ?? null, nom, email, telephone, commune, profil, motivation, ref_code,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, ref_code });
    }

    if (action === "parrainage") {
      if (!user) return NextResponse.json({ ok: false });
      const ref = (await cookies()).get("osdt_ref")?.value;
      if (!ref) return NextResponse.json({ ok: false });

      // Uniquement pour un compte créé il y a moins de 7 jours (évite de créditer un ancien compte)
      const { data: profile } = await db.from("profiles").select("created_at").eq("id", user.id).maybeSingle();
      if (!profile || Date.now() - new Date(profile.created_at).getTime() > 7 * 24 * 3600 * 1000) return NextResponse.json({ ok: false });

      const { data: amb } = await db.from("ambassadeurs").select("id, user_id").eq("ref_code", ref).eq("statut", "actif").maybeSingle();
      if (!amb || amb.user_id === user.id) return NextResponse.json({ ok: false });

      await db.from("parrainages").upsert(
        { ambassadeur_id: amb.id, filleul_user_id: user.id, type: "habitant" },
        { onConflict: "filleul_user_id,type", ignoreDuplicates: true }
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur" }, { status: 500 });
  }
}