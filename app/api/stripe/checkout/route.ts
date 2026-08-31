import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe, PRICES, COUPONS, SITE_URL } from "@/lib/stripe";

// Crée une session Stripe Checkout (abonnement) pour un pro ou une mairie.
// body : { type: "pro", plan } ou { type: "mairie", plan, communeId }
export async function POST(request: Request) {
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { type, plan, communeId } = await request.json();
  const admin = createAdminClient();
  const stripe = getStripe();

  // Tarif
  let priceId = "";
  let coupon = "";
  const metadata: Record<string, string> = { user_id: user.id, type, plan };

  if (type === "pro") {
    priceId = (PRICES.pro as any)[plan] ?? "";
    if (plan === "visibilite" && COUPONS.proVisibilite) coupon = COUPONS.proVisibilite;
    const { data: pro } = await admin.from("pro_profiles").select("id").eq("id", user.id).single();
    if (!pro) return NextResponse.json({ error: "Créez d'abord votre profil pro" }, { status: 400 });
  } else if (type === "mairie") {
    priceId = (PRICES.mairie as any)[plan] ?? "";
    if (plan === "bourg" && COUPONS.mairieBourg) coupon = COUPONS.mairieBourg;
    // Le demandeur doit être agent de la commune
    const { data: agent } = await admin
      .from("commune_agents").select("commune_id").eq("user_id", user.id).eq("commune_id", communeId).maybeSingle();
    if (!agent) return NextResponse.json({ error: "Vous n'êtes pas agent de cette commune" }, { status: 403 });
    metadata.commune_id = communeId;
  } else {
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  }
  if (!priceId) return NextResponse.json({ error: "Tarif non configuré" }, { status: 500 });

  // Client Stripe (un par compte, mémorisé sur le profil)
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, full_name").eq("id", user.id).single();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const returnPath = type === "pro" ? "/pro/espace" : "/mairie";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: true }),
    locale: "fr",
    success_url: `${SITE_URL}${returnPath}?checkout=success`,
    cancel_url: `${SITE_URL}${returnPath}?checkout=cancel`,
    subscription_data: { metadata },
    metadata,
    // Mairies : la TVA et l'adresse de facturation sont nécessaires pour la facture
    ...(type === "mairie" ? { billing_address_collection: "required", tax_id_collection: { enabled: true } } : {}),
  });

  return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe checkout:", e);
    return NextResponse.json({ error: e.message ?? "Erreur Stripe" }, { status: 500 });
  }
}