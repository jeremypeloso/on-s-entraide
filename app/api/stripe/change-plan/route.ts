import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe, PRICES } from "@/lib/stripe";

const RANK: Record<string, number> = { essentiel: 1, visibilite: 2, premium: 3 };

// Changement de plan d'un pro déjà abonné :
//   montée en gamme → immédiate, prorata facturé par Stripe
//   descente         → programmée à la fin de la période en cours (le pro garde ce qu'il a payé)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { plan } = await request.json();
  const newPrice = (PRICES.pro as any)[plan];
  if (!newPrice) return NextResponse.json({ error: "Plan inconnu" }, { status: 400 });

  const db = createAdminClient();
  const { data: pro } = await db.from("pro_profiles")
    .select("subscription_plan, stripe_subscription_id, subscription_status").eq("id", user.id).single();
  if (!pro?.stripe_subscription_id) return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 });
  if (pro.subscription_plan === plan) return NextResponse.json({ error: "C'est déjà votre plan" }, { status: 400 });

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(pro.stripe_subscription_id, { expand: ["schedule"] });
  const item = sub.items.data[0];
  const upgrade = RANK[plan] > RANK[pro.subscription_plan ?? "essentiel"];

  try {
    if (upgrade) {
      // Immédiat, prorata ; le webhook customer.subscription.updated appliquera le plan
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: newPrice }],
        proration_behavior: "create_prorations",
        metadata: { ...sub.metadata, plan },
      });
      await db.from("pro_profiles").update({ pending_plan: null }).eq("id", user.id);
      return NextResponse.json({ ok: true, mode: "immediate" });
    }

    // Descente : planification via un Subscription Schedule
    let scheduleId = typeof sub.schedule === "string" ? sub.schedule : sub.schedule?.id;
    if (!scheduleId) {
      const created = await stripe.subscriptionSchedules.create({ from_subscription: sub.id });
      scheduleId = created.id;
    }
    const periodStart: number = (sub as any).current_period_start ?? (item as any).current_period_start;
    const periodEnd: number = (sub as any).current_period_end ?? (item as any).current_period_end;
    if (!periodStart || !periodEnd) return NextResponse.json({ error: "Période de facturation introuvable" }, { status: 500 });
    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: "release",
      phases: [
        { items: [{ price: item.price.id, quantity: 1 }], start_date: periodStart, end_date: periodEnd, metadata: sub.metadata as any },
        { items: [{ price: newPrice, quantity: 1 }], metadata: { ...(sub.metadata as any), plan } },
      ],
    });
    await db.from("pro_profiles").update({ pending_plan: plan }).eq("id", user.id);
    return NextResponse.json({ ok: true, mode: "scheduled", effective: new Date(periodEnd * 1000).toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}