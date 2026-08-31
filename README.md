On se dit tout
Plateforme d'entraide de quartier multi-thématique. Next.js 15 (App Router) +
Supabase (auth, DB, RLS) + Resend (emails) + Vercel (hébergement).
Stack
Next.js 15 — App Router, Server Components
Supabase — Postgres, Auth, Row Level Security, PostGIS pour la géoloc
Resend — emails transactionnels (bienvenue, messages, alertes vigilance)
Tailwind CSS — styling
Vercel — déploiement
1. Mise en place Supabase
Créer un projet sur app.supabase.com
Aller dans SQL Editor, coller et exécuter `supabase/schema.sql`
(crée toutes les tables, active la RLS, seed les 8 catégories)
Importer les communes : suivre `supabase/import-communes.md`
Récupérer les clés dans Project Settings > API :
`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_ANON_KEY`
`SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, jamais côté client)
2. Mise en place Resend
Créer un compte sur resend.com
Vérifier le domaine `onseditout.fr` (ajout des enregistrements DNS
fournis par Resend : SPF, DKIM)
Générer une clé API dans API Keys → `RESEND_API_KEY`
Les templates d'emails sont dans `lib/resend.ts` (bienvenue, nouveau
message, alerte vigilance, commune certifiée)
3. Installation locale
```bash
cp .env.example .env.local
# remplir .env.local avec les clés Supabase + Resend
npm install
npm run dev
```
L'app tourne sur http://localhost:3000
4. Déploiement Vercel
```bash
npm install -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel --prod
```
Ou directement via l'interface Vercel : New Project → importer le repo
GitHub → ajouter les variables d'environnement dans Settings > Environment
Variables → Deploy.
5. Structure du projet
```
app/
  [commune]/page.tsx        page ville (résident vs visiteur pour Vigilance)
  annonce/[id]/page.tsx     détail d'une annonce
  publier/page.tsx          formulaire de publication
  api/
    residence/route.ts      déclaration commune de résidence (POST)
    annonces/route.ts       création d'annonce (POST)
lib/
  supabase/
    client.ts               client navigateur
    server.ts                client serveur + client admin (service role)
  resend.ts                  emails transactionnels
supabase/
  schema.sql                 schéma complet + RLS + seed catégories
  import-communes.md         procédure d'import des 34 875 communes
middleware.ts                 rafraîchissement de session Supabase
```
6. Points d'attention produit → code
Vigilance réservée aux résidents : la RLS sur `vigilance_members` et
`vigilance_signalements` compare `profiles.commune_residence_id` à la
commune consultée. Un visiteur ne peut pas techniquement lire les
signalements, même en contournant le rendu React.
Un seul favori par défaut : contrainte `unique index one_default_per_user`
sur `user_favorites`, empêche d'avoir deux villes par défaut en base.
Commune certifiée : le badge (`communes.is_certified`) n'est activé
manuellement après vérification d'un justificatif officiel de la mairie
(voir `commune_subscriptions.verified_at`), jamais en self-service.
Pro vérifié : `pro_profiles.siret_verified` + `subscription_status`
conditionnent l'affichage public du profil (policy RLS
`pro_profiles_select_active`).
Prochaines étapes suggérées
Intégration Stripe pour les abonnements pro / mairie / mise en avant
Recherche géographique par rayon (`ST_DWithin` sur `communes.geom`)
Job cron (Vercel Cron) pour expirer automatiquement les annonces à 30 jours