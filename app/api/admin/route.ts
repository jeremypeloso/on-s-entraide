import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Toutes les actions d'administration passent par cette route :
// 1. On vérifie que le demandeur est connecté ET is_admin (via son propre client RLS)
// 2. On exécute avec le service role (bypass RLS) uniquement après ce contrôle

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { action, payload } = await request.json();
  const db = createAdminClient();

  try {
    switch (action) {
      // ===== VUE D'ENSEMBLE =====
      case "stats": {
        const [users, annonces, annoncesActives, pros, prosActifs, certifiees, signalements, contacts, comments] =
          await Promise.all([
            db.from("profiles").select("*", { count: "exact", head: true }),
            db.from("annonces").select("*", { count: "exact", head: true }),
            db.from("annonces").select("*", { count: "exact", head: true }).eq("statut", "disponible"),
            db.from("pro_profiles").select("*", { count: "exact", head: true }),
            db.from("pro_profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
            db.from("communes").select("*", { count: "exact", head: true }).eq("is_certified", true),
            db.from("annonce_signalements").select("*", { count: "exact", head: true }).eq("statut", "en_attente"),
            db.from("contact_messages").select("*", { count: "exact", head: true }).eq("traite", false),
            db.from("annonce_comments").select("*", { count: "exact", head: true }),
          ]);
        return NextResponse.json({
          users: users.count, annonces: annonces.count, annoncesActives: annoncesActives.count,
          pros: pros.count, prosActifs: prosActifs.count, certifiees: certifiees.count,
          signalements: signalements.count, contacts: contacts.count, comments: comments.count,
        });
      }

      // ===== MODÉRATION =====
      case "signalements": {
        const { data } = await db
          .from("annonce_signalements")
          .select("*, annonces(id, title, author_id, profiles(full_name)), reporter:reporter_id(full_name)")
          .eq("statut", "en_attente")
          .order("created_at", { ascending: false });
        return NextResponse.json({ data });
      }
      case "signalement_traiter": {
        // supprime l'annonce signalée + marque tous ses signalements traités
        await db.from("annonces").delete().eq("id", payload.annonceId);
        await db.from("annonce_signalements").update({ statut: "traite" }).eq("annonce_id", payload.annonceId);
        return NextResponse.json({ ok: true });
      }
      case "signalement_rejeter": {
        await db.from("annonce_signalements").update({ statut: "rejete" }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      // ===== ANNONCES =====
      case "annonces": {
        const { data } = await db
          .from("annonces")
          .select("id, title, statut, is_sponsored, created_at, profiles(full_name), communes(nom), categories(emoji)")
          .order("created_at", { ascending: false })
          .limit(50);
        return NextResponse.json({ data });
      }
      case "annonce_supprimer": {
        await db.from("annonces").delete().eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      // ===== UTILISATEURS =====
      case "users": {
        let q = db
          .from("profiles")
          .select("id, full_name, is_admin, created_at, communes:commune_residence_id(nom)")
          .order("created_at", { ascending: false })
          .limit(50);
        if (payload?.search) q = q.ilike("full_name", `%${payload.search}%`);
        const { data } = await q;
        return NextResponse.json({ data });
      }

      // ===== PROS =====
      case "pros": {
        const { data } = await db
          .from("pro_profiles")
          .select("id, business_name, siret, siret_verified, subscription_status, subscription_plan, telephone, email, created_at")
          .order("created_at", { ascending: false });
        return NextResponse.json({ data });
      }
      case "pro_toggle_verif": {
        await db.from("pro_profiles").update({ siret_verified: payload.value }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }
      case "pro_set_status": {
        await db.from("pro_profiles").update({ subscription_status: payload.value }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      // ===== COMMUNES / MAIRIES =====
      case "communes_certifiees": {
        const { data: certif } = await db
          .from("communes")
          .select("id, nom, slug, departement, is_certified")
          .eq("is_certified", true)
          .order("nom");
        const { data: agents } = await db
          .from("commune_agents")
          .select("commune_id, role, profiles(full_name), communes(nom)");
        return NextResponse.json({ certif, agents });
      }
      case "commune_toggle_certif": {
        // par slug pour certifier une nouvelle commune facilement
        const { data: c } = await db.from("communes").select("id, is_certified").eq("slug", payload.slug).single();
        if (!c) return NextResponse.json({ error: "Commune introuvable" }, { status: 404 });
        await db.from("communes").update({ is_certified: !c.is_certified }).eq("id", c.id);
        return NextResponse.json({ ok: true, is_certified: !c.is_certified });
      }
      case "agent_ajouter": {
        // rattache un utilisateur (par email) comme agent d'une commune (par slug)
        const { data: c } = await db.from("communes").select("id").eq("slug", payload.slug).single();
        if (!c) return NextResponse.json({ error: "Commune introuvable" }, { status: 404 });
        const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
        const u = list.users.find((x) => x.email === payload.email);
        if (!u) return NextResponse.json({ error: "Utilisateur introuvable (doit avoir un compte)" }, { status: 404 });
        await db.from("commune_agents").upsert({ user_id: u.id, commune_id: c.id, role: "agent" });
        return NextResponse.json({ ok: true });
      }

      // ===== MESSAGES CONTACT =====
      case "contacts": {
        const { data } = await db
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        return NextResponse.json({ data });
      }
      case "contact_traiter": {
        await db.from("contact_messages").update({ traite: true }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
