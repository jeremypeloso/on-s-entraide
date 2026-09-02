import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CONDITIONS_VERSION, PALIERS, genRefCode } from "@/lib/ambassadeurs";

// Actions (compte connecté obligatoire sauf mention) :
//  - candidater : dépôt de candidature + acceptation des conditions
//  - accepter   : acceptation des conditions (ambassadeur nommé par l'admin)
//  - echanger   : demande de carte cadeau contre des points
//  - parrainage : à l'inscription, rattache le compte à l'ambassadeur du cookie osdt_ref

export async function POST(request: Request) {
  const { action, payload } = await request.json();
  const db = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour continuer." }, { status: 401 });

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const acceptation = { conditions_version: CONDITIONS_VERSION, conditions_accepted_at: new Date().toISOString(), conditions_ip: ip };

  try {
    if (action === "candidater") {
      const commune = String(payload?.commune ?? "").trim();
      const motivation = String(payload?.motivation ?? "").trim() || null;
      if (!commune) return NextResponse.json({ error: "Indiquez votre commune." }, { status: 400 });
      if (!payload?.accepte) return NextResponse.json({ error: "Vous devez accepter les conditions du programme." }, { status: 400 });

      const { data: existing } = await db.from("ambassadeurs").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) return NextResponse.json({ error: "Vous avez déjà candidaté." }, { status: 409 });

      let ref_code = genRefCode();
      for (let i = 0; i < 5; i++) {
        const { data: dup } = await db.from("ambassadeurs").select("id").eq("ref_code", ref_code).maybeSingle();
        if (!dup) break;
        ref_code = genRefCode();
      }
      const { error } = await db.from("ambassadeurs").insert({ user_id: user.id, commune, motivation, ref_code, ...acceptation });
      if (error) throw error;
      return NextResponse.json({ ok: true, ref_code });
    }

    if (action === "accepter") {
      if (!payload?.accepte) return NextResponse.json({ error: "Vous devez accepter les conditions du programme." }, { status: 400 });
      const { error } = await db.from("ambassadeurs").update(acceptation).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "echanger") {
      const palier = PALIERS.find((p) => p.points === Number(payload?.points));
      if (!palier) return NextResponse.json({ error: "Palier inconnu." }, { status: 400 });

      const { data: amb } = await db.from("ambassadeurs").select("id, statut, conditions_accepted_at").eq("user_id", user.id).maybeSingle();
      if (!amb || amb.statut !== "actif") return NextResponse.json({ error: "Votre compte ambassadeur n'est pas actif." }, { status: 403 });
      if (!amb.conditions_accepted_at) return NextResponse.json({ error: "Acceptez d'abord les conditions du programme." }, { status: 403 });

      const { data: pending } = await db.from("recompenses").select("id").eq("ambassadeur_id", amb.id).eq("statut", "en_attente").maybeSingle();
      if (pending) return NextResponse.json({ error: "Une demande est déjà en cours de traitement." }, { status: 409 });

      const { data: s } = await db.from("ambassadeur_stats").select("points_disponibles").eq("ambassadeur_id", amb.id).maybeSingle();
      if (!s || s.points_disponibles < palier.points) return NextResponse.json({ error: "Points insuffisants." }, { status: 400 });

      const { error } = await db.from("recompenses").insert({ ambassadeur_id: amb.id, points: palier.points, montant: palier.montant });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "parrainage") {
      const ref = (await cookies()).get("osdt_ref")?.value;
      if (!ref) return NextResponse.json({ ok: false });

      // Compte créé depuis moins de 7 jours uniquement (évite de créditer un ancien compte)
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
