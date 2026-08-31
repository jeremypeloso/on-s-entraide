import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// Suppressions à la demande de l'utilisateur (RGPD) :
//   scope = "pro"         → espace pro (profil, services, zone, avis) + abonnement Stripe annulé
//   scope = "association" → page association + ses événements
//   scope = "mairie"      → l'utilisateur cesse de gérer la commune (la commune reste certifiée)
//   scope = "compte"      → tout le compte (cascade) + abonnements annulés
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { scope, communeId } = await request.json();
  const db = createAdminClient();

  async function cancelStripeFor(subscriptionId: string | null | undefined) {
    if (!subscriptionId || !process.env.STRIPE_SECRET_KEY) return;
    try { await getStripe().subscriptions.cancel(subscriptionId); } catch (e) { console.error("Stripe cancel:", e); }
  }

  try {
    if (scope === "pro" || scope === "compte") {
      const { data: pro } = await db.from("pro_profiles").select("stripe_subscription_id").eq("id", user.id).maybeSingle();
      if (pro) {
        await cancelStripeFor(pro.stripe_subscription_id);
        await db.from("pro_profiles").delete().eq("id", user.id);
      }
      if (scope === "pro") return NextResponse.json({ ok: true });
    }

    if (scope === "association" || scope === "compte") {
      const { data: assos } = await db.from("associations").select("id").eq("user_id", user.id);
      for (const a of assos ?? []) {
        await db.from("evenements").delete().eq("association_id", a.id);
        await db.from("associations").delete().eq("id", a.id);
      }
      if (scope === "association") return NextResponse.json({ ok: true });
    }

    if (scope === "mairie") {
      if (!communeId) return NextResponse.json({ error: "communeId requis" }, { status: 400 });
      await db.from("commune_agents").delete().eq("user_id", user.id).eq("commune_id", communeId);
      return NextResponse.json({ ok: true });
    }

    if (scope === "compte") {
      // Abonnements mairie payés par ce compte : annulés côté Stripe (la certification tombera via le webhook)
      const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
      if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
        try {
          const subs = await getStripe().subscriptions.list({ customer: profile.stripe_customer_id, status: "active" });
          for (const s of subs.data) await cancelStripeFor(s.id);
        } catch (e) { console.error("Stripe list:", e); }
      }
      // Suppression du compte auth : cascade sur profiles → annonces, commentaires, vigilance, avis, agents...
      const { error } = await db.auth.admin.deleteUser(user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Scope inconnu" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
