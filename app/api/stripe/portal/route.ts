import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe, SITE_URL } from "@/lib/stripe";

// Ouvre le portail Stripe : factures, moyen de paiement, changement de plan, résiliation
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { returnPath } = await request.json().catch(() => ({ returnPath: "/compte" }));
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "Aucun abonnement" }, { status: 404 });

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}${returnPath ?? "/compte"}`,
    locale: "fr",
  });
  return NextResponse.json({ url: session.url });
}
