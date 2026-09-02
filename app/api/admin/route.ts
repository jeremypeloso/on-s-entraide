import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  sendWelcomeEmail, sendNewMessageEmail, sendCommentNotificationEmail,
  sendDailyDigestEmail, sendVigilanceAlertEmail, sendCommuneCertifiedEmail,
} from "@/lib/resend";
import { getStripe, PRICES, COUPONS } from "@/lib/stripe";

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
        const [users, annonces, annoncesActives, pros, prosActifs, certifiees, signalements, contacts, comments, avisSignales, assosAttente] =
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
            db.from("review_signalements").select("*", { count: "exact", head: true }).eq("statut", "en_attente"),
            db.from("associations").select("*", { count: "exact", head: true }).eq("is_verified", false),
          ]);
        return NextResponse.json({
          users: users.count, annonces: annonces.count, annoncesActives: annoncesActives.count,
          pros: pros.count, prosActifs: prosActifs.count, certifiees: certifiees.count,
          signalements: signalements.count, contacts: contacts.count, comments: comments.count,
          avisSignales: avisSignales.count, assosAttente: assosAttente.count,
        });
      }

      // ===== TEST DES EMAILS : envoie les 6 modèles à l'admin connecté =====
      case "test_emails": {
        const to = admin.email!;
        const results: Record<string, string> = {};
        const tests: [string, () => Promise<any>][] = [
          ["bienvenue", () => sendWelcomeEmail(to, "Limetz-Villez", "limetz-villez")],
          ["message", () => sendNewMessageEmail(to, "Sophie Martin", "Perceuse à prêter ce week-end", "https://onseditout.fr/messages")],
          ["question", () => sendCommentNotificationEmail(to, "Karim Benali", "Covoiturage gare de Vernon", "00000000-0000-0000-0000-000000000000", "Bonjour, est-ce que le départ est bien à 7h45 ?")],
          ["digest", () => sendDailyDigestEmail(to, "Limetz-Villez", "limetz-villez",
            [{ title: "Perceuse à prêter ce week-end", id: "00000000-0000-0000-0000-000000000000" }, { title: "Recherche garde pour 2 chats", id: "00000000-0000-0000-0000-000000000001" }],
            [{ titre: "Loto du comité des fêtes", starts_at: new Date(Date.now() + 5 * 86400000).toISOString(), lieu: "Salle des fêtes" }])],
          ["vigilance", () => sendVigilanceAlertEmail([to], "Limetz-Villez", "Camionnette blanche qui tourne lentement, rue des Vignes")],
          ["certifiee", () => sendCommuneCertifiedEmail(to, "Limetz-Villez", "limetz-villez")],
        ];
        for (const [name, fn] of tests) {
          try { const r = await fn(); results[name] = r?.error ? `❌ ${r.error.message}` : "✓ envoyé"; }
          catch (e: any) { results[name] = `❌ ${e.message}`; }
        }
        return NextResponse.json({ ok: true, to, results });
      }

      // ===== DIAGNOSTIC STRIPE =====
      case "stripe_check": {
        const out: any = { key: null, mode: null, prices: [], coupons: [], webhooks: [], events: [], errors: [] };
        try {
          const stripe = getStripe();
          const key = process.env.STRIPE_SECRET_KEY ?? "";
          out.mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "inconnu";
          // Validation de la clé : un appel léger suffit (le compte lui-même n'est pas toujours accessible avec une clé restreinte)
          const balance = await stripe.balance.retrieve();
          out.key = { ok: true, account: balance.livemode ? "compte live" : "compte test", chargesEnabled: true, payoutsEnabled: true };

          const expected: Record<string, { id: string; amount: number; interval: string }> = {
            "Pro Essentiel": { id: PRICES.pro.essentiel, amount: 1900, interval: "month" },
            "Pro Visibilité": { id: PRICES.pro.visibilite, amount: 3900, interval: "month" },
            "Pro Premium": { id: PRICES.pro.premium, amount: 7900, interval: "month" },
            "Mairie Village": { id: PRICES.mairie.village, amount: 46800, interval: "year" },
            "Mairie Bourg": { id: PRICES.mairie.bourg, amount: 118800, interval: "year" },
            "Mairie Ville": { id: PRICES.mairie.ville, amount: 238800, interval: "year" },
          };
          for (const [label, e] of Object.entries(expected)) {
            if (!e.id) { out.prices.push({ label, ok: false, info: "variable manquante" }); continue; }
            try {
              const p = await stripe.prices.retrieve(e.id);
              const amountOk = p.unit_amount === e.amount && p.recurring?.interval === e.interval;
              out.prices.push({ label, ok: p.active && amountOk, info: `${(p.unit_amount ?? 0) / 100} € / ${p.recurring?.interval}${p.active ? "" : " (inactif)"}${amountOk ? "" : " ⚠️ montant ou période inattendus"}` });
            } catch (err: any) { out.prices.push({ label, ok: false, info: err.message }); }
          }
          for (const [label, id] of [["Lancement Pro", COUPONS.proVisibilite], ["Lancement Mairie", COUPONS.mairieBourg]] as const) {
            if (!id) { out.coupons.push({ label, ok: true, info: "non configuré (plein tarif)" }); continue; }
            try {
              const c = await stripe.coupons.retrieve(id);
              out.coupons.push({ label, ok: c.valid, info: `${c.percent_off ?? c.amount_off}% · ${c.duration}${c.duration_in_months ? ` ${c.duration_in_months} mois` : ""}` });
            } catch (err: any) { out.coupons.push({ label, ok: false, info: err.message }); }
          }
          const wh = await stripe.webhookEndpoints.list({ limit: 10 });
          for (const w of wh.data) {
            out.webhooks.push({ url: w.url, ok: w.status === "enabled" && w.url.includes("onseditout.fr/api/stripe/webhook"), status: w.status, events: w.enabled_events.length });
          }
          if (!process.env.STRIPE_WEBHOOK_SECRET) out.errors.push("STRIPE_WEBHOOK_SECRET manquante");
          const ev = await stripe.events.list({ limit: 8 });
          out.events = ev.data.map((e) => ({ type: e.type, created: new Date(e.created * 1000).toISOString(), delivered: e.pending_webhooks === 0 }));
        } catch (e: any) {
          out.errors.push(e.message);
          out.key = { ok: false };
        }
        return NextResponse.json(out);
      }

      // ===== RÉGLAGES DU SITE =====
      case "settings": {
        const { data } = await db.from("site_settings").select("key, value");
        return NextResponse.json({ data: Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) });
      }
      case "set_maintenance": {
        await db.from("site_settings").upsert({
          key: "maintenance",
          value: { enabled: !!payload.enabled, message: String(payload.message ?? "").slice(0, 300) },
        });
        return NextResponse.json({ ok: true });
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

      // ===== AVIS SIGNALÉS =====
      case "avis_signales": {
        const { data } = await db
          .from("review_signalements")
          .select("*, pro_reviews(id, rating, body, created_at, profiles(full_name)), pro:pro_id(business_name)")
          .eq("statut", "en_attente")
          .order("created_at", { ascending: false });
        return NextResponse.json({ data });
      }
      case "avis_supprimer": {
        await db.from("pro_reviews").delete().eq("id", payload.reviewId);
        await db.from("review_signalements").update({ statut: "traite" }).eq("review_id", payload.reviewId);
        return NextResponse.json({ ok: true });
      }
      case "avis_signalement_rejeter": {
        await db.from("review_signalements").update({ statut: "rejete" }).eq("id", payload.id);
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

      // ===== ASSOCIATIONS =====
      case "assos": {
        const { data } = await db
          .from("associations")
          .select("id, nom, rna, categorie, is_verified, email, telephone, created_at, communes(nom), profiles:user_id(full_name)")
          .order("is_verified", { ascending: true })
          .order("created_at", { ascending: false });
        return NextResponse.json({ data });
      }
      case "asso_toggle_verif": {
        await db.from("associations").update({ is_verified: payload.value }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }
      case "asso_supprimer": {
        await db.from("associations").delete().eq("id", payload.id);
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
        const convIds = (data ?? []).map((m) => m.conversation_id).filter(Boolean);
        let threads: Record<string, any[]> = {};
        if (convIds.length) {
          const { data: msgs } = await db.from("messages")
            .select("conversation_id, sender_id, body, created_at")
            .in("conversation_id", convIds).order("created_at");
          for (const m of msgs ?? []) (threads[m.conversation_id] ??= []).push({ ...m, mine: m.sender_id === admin.id });
        }
        return NextResponse.json({ data: (data ?? []).map((m) => ({ ...m, thread: m.conversation_id ? threads[m.conversation_id] ?? [] : [] })) });
      }
      case "contact_traiter": {
        await db.from("contact_messages").update({ traite: payload.value ?? true }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }
      case "contact_repondre": {
        // Réponse via la messagerie interne : l'expéditeur doit avoir un compte (recherche par email)
        const { data: msg } = await db.from("contact_messages").select("*").eq("id", payload.id).single();
        if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
        const body = String(payload.body ?? "").trim();
        if (body.length < 2) return NextResponse.json({ error: "Réponse vide" }, { status: 400 });

        let userId: string | null = null;
        let page = 1;
        while (!userId) {
          const { data: list } = await db.auth.admin.listUsers({ page, perPage: 1000 });
          const found = list.users.find((u) => u.email?.toLowerCase() === msg.email.toLowerCase());
          if (found) userId = found.id;
          if (list.users.length < 1000) break;
          page++;
        }
        if (!userId) return NextResponse.json({ ok: false, noAccount: true });

        // Conversation "support" (sans annonce) entre l'admin et l'utilisateur
        const [pa, pb] = [admin.id, userId].sort();
        const { data: existing } = await db.from("conversations").select("id")
          .is("annonce_id", null).eq("participant_a", pa).eq("participant_b", pb).maybeSingle();
        let convId = existing?.id;
        if (!convId) {
          const { data: created, error } = await db.from("conversations")
            .insert({ annonce_id: null, participant_a: pa, participant_b: pb }).select("id").single();
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          convId = created.id;
        }
        await db.from("messages").insert({ conversation_id: convId, sender_id: admin.id, body });
        await db.from("conversations").update({ last_message_at: new Date().toISOString(), last_notified_at: new Date().toISOString() }).eq("id", convId);
        await db.from("contact_messages").update({ conversation_id: convId }).eq("id", payload.id);

        try {
          await sendNewMessageEmail(msg.email, "L'équipe On se dit tout", "", `https://onseditout.fr/messages/${convId}`);
        } catch (e) { console.error("Email réponse contact :", e); }

        return NextResponse.json({ ok: true, conversationId: convId });
      }
      case "contact_supprimer": {
        await db.from("contact_messages").delete().eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      // ===== AMBASSADEURS =====
      case "ambassadeurs": {
        const { data } = await db
          .from("ambassadeurs")
          .select("id, nom, email, telephone, commune, profil, motivation, ref_code, statut, created_at, ambassadeur_stats(habitants, pros, collectivites)")
          .order("created_at", { ascending: false });
        return NextResponse.json({ data });
      }
      case "ambassadeur_set_statut": {
        await db.from("ambassadeurs").update({ statut: payload.value }).eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }
      case "ambassadeur_supprimer": {
        await db.from("ambassadeurs").delete().eq("id", payload.id);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}