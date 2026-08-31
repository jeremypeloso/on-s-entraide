import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// Identifiants des tarifs Stripe (à créer dans le dashboard, puis à renseigner en variables d'environnement)
export const PRICES = {
  pro: {
    essentiel: process.env.STRIPE_PRICE_PRO_ESSENTIEL ?? "",
    visibilite: process.env.STRIPE_PRICE_PRO_VISIBILITE ?? "",
    premium: process.env.STRIPE_PRICE_PRO_PREMIUM ?? "",
  },
  mairie: {
    village: process.env.STRIPE_PRICE_MAIRIE_VILLAGE ?? "",
    bourg: process.env.STRIPE_PRICE_MAIRIE_BOURG ?? "",
    ville: process.env.STRIPE_PRICE_MAIRIE_VILLE ?? "",
  },
} as const;

// Coupons des offres de lancement (facultatifs : si absents, plein tarif)
export const COUPONS = {
  proVisibilite: process.env.STRIPE_COUPON_LANCEMENT_PRO ?? "",
  mairieBourg: process.env.STRIPE_COUPON_LANCEMENT_MAIRIE ?? "",
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onseditout.fr";
