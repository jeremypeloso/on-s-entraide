import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const annonceSchema = z.object({
  communeId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  statut: z.enum(["disponible", "reserve", "termine"]).default("disponible"),
  photoUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = annonceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("annonces")
    .insert({
      author_id: user.id,
      commune_id: parsed.data.communeId,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      statut: parsed.data.statut,
      photo_url: parsed.data.photoUrl,
      // Expiration automatique à 30 jours, cohérent avec le principe
      // "plus d'annonces vieilles de 3 mois" évoqué dans le produit
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Règles métier pro appliquées par le trigger enforce_pro_annonce_rules
    if (error.message.includes("PRO_PLAN_NO_ANNONCE")) {
      return NextResponse.json(
        { error: "Le pack Essentiel n'inclut pas la publication d'annonces dans le fil. Votre activité reste visible dans la section « Les pros près de chez vous ». Passez au pack Visibilité pour publier." },
        { status: 403 }
      );
    }
    if (error.message.includes("PRO_QUOTA_REACHED")) {
      return NextResponse.json(
        { error: "Votre pack Visibilité inclut 1 annonce par période de 30 jours, et vous l'avez déjà utilisée. Passez au pack Premium pour publier sans limite." },
        { status: 403 }
      );
    }
    if (error.message.includes("PRO_SUBSCRIPTION_REQUIRED")) {
      return NextResponse.json(
        { error: "Votre profil professionnel n'a pas d'abonnement actif. Activez un pack depuis votre Espace pro pour publier." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ annonce: data }, { status: 201 });
}
