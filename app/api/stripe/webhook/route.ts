import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// Stripe fait foi : ce webhook synchronise l'état des abonnements dans la base.
// Événements traités : checkout terminé, abonnement modifié/résilié, paiement échoué.
export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Signature invalide : ${e.message}` }, { status: 400 });
  }

  const db = createAdminClient();

  // Si l'utilisateur a été amené par un ambassadeur (parrainage "habitant"),
  // on crédite aussi l'ambassadeur pour l'abonnement pro ou mairie.
  async function creditAmbassadeur(userId: string, type: "pro" | "collectivite") {
    const { data: p } = await db.from("parrainages").select("ambassadeur_id").eq("filleul_user_id", userId).eq("type", "habitant").maybeSingle();
    if (!p) return;
    await db.from("parrainages").upsert(
      { ambassadeur_id: p.ambassadeur_id, filleul_user_id: userId, type },
      { onConflict: "filleul_user_id,type", ignoreDuplicates: true }
    );
  }

  async function applySubscription(sub: Stripe.Subscription) {
    const meta = sub.metadata ?? {};
    const status = sub.status; // active, trialing, past_due, canceled, unpaid, incomplete...
    const active = status === "active" || status === "trialing";
    const item0: any = sub.items?.data?.[0];
    const endTs: number | undefined = (sub as any).current_period_end ?? item0?.current_period_end;
    const periodEnd = endTs ? new Date(endTs * 1000).toISOString() : null;

    if (meta.type === "pro" && meta.user_id) {
      await db.from("pro_profiles").update({
        subscription_plan: meta.plan,
        pending_plan: null,
        subscription_status: active ? "active" : status === "past_due" ? "past_due" : "inactive",
        stripe_subscription_id: sub.id,
        current_period_end: periodEnd,
      }).eq("id", meta.user_id);
      if (active) await creditAmbassadeur(meta.user_id, "pro");
    }

    if (meta.type === "mairie" && meta.commune_id) {
      await db.from("commune_subscriptions").upsert({
        commune_id: meta.commune_id,
        plan: meta.plan,
        status: active ? "active" : status === "past_due" ? "past_due" : "inactive",
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        current_period_end: periodEnd,
        source: "stripe",
      }, { onConflict: "commune_id" });
      await db.from("communes").update({ is_certified: active }).eq("id", meta.commune_id);
      if (active && meta.user_id) await creditAmbassadeur(meta.user_id, "collectivite");
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
        await applySubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        await applySubscription(sub);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}