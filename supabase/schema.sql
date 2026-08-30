-- ============================================================
-- On s'entraide — schéma Supabase (Postgres)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ------------------------------------------------------------
-- COMMUNES (import unique depuis le COG INSEE)
-- ------------------------------------------------------------
create table communes (
  id uuid primary key default uuid_generate_v4(),
  code_insee text unique not null,
  nom text not null,
  slug text unique not null,               -- ex: "limetz-villez", utilisé dans l'URL
  code_postal text,
  departement text,
  region text,
  population integer,
  lat double precision,
  lng double precision,
  geom geography(Point, 4326),
  is_certified boolean default false,      -- badge "Commune certifiée" (mairie abonnée)
  certified_since timestamptz,
  created_at timestamptz default now()
);
create index communes_slug_idx on communes(slug);
create index communes_geom_idx on communes using gist(geom);

-- ------------------------------------------------------------
-- PROFILS UTILISATEURS (étend auth.users de Supabase)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  commune_residence_id uuid references communes(id),  -- active/désactive Vigilance
  residence_declared_at timestamptz,
  trust_score numeric default 0,
  entraide_count integer default 0,
  response_rate numeric,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- VILLES FAVORITES (many-to-many, une seule "par défaut")
-- ------------------------------------------------------------
create table user_favorites (
  user_id uuid references profiles(id) on delete cascade,
  commune_id uuid references communes(id) on delete cascade,
  is_default boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, commune_id)
);
-- Une seule ville par défaut par utilisateur
create unique index one_default_per_user
  on user_favorites(user_id)
  where is_default = true;

-- ------------------------------------------------------------
-- CATÉGORIES (statique, seedée une fois)
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,   -- objets, services, transport, garde, alimentaire, alertes, vigilance, pro
  label text not null,
  emoji text,
  color_hex text
);

-- ------------------------------------------------------------
-- ANNONCES
-- ------------------------------------------------------------
create type annonce_statut as enum ('disponible', 'reserve', 'termine');

create table annonces (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade,
  commune_id uuid references communes(id) not null,
  category_id uuid references categories(id) not null,
  title text not null,
  description text,
  statut annonce_statut default 'disponible',
  photo_url text,
  is_sponsored boolean default false,      -- mise en avant payante ponctuelle
  sponsored_until timestamptz,
  lat double precision,
  lng double precision,
  expires_at timestamptz,                  -- expiration automatique
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index annonces_commune_idx on annonces(commune_id);
create index annonces_category_idx on annonces(category_id);
create index annonces_statut_idx on annonces(statut);

create table annonce_comments (
  id uuid primary key default uuid_generate_v4(),
  annonce_id uuid references annonces(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ALERTES OFFICIELLES (publiées par une mairie certifiée)
-- ------------------------------------------------------------
create table alertes_officielles (
  id uuid primary key default uuid_generate_v4(),
  commune_id uuid references communes(id) not null,
  title text not null,
  body text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- VOISINS VIGILANTS — réservé aux résidents déclarés
-- ------------------------------------------------------------
create table vigilance_members (
  user_id uuid references profiles(id) on delete cascade,
  commune_id uuid references communes(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (user_id, commune_id)
);

create table vigilance_signalements (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade,
  commune_id uuid references communes(id) not null,
  title text not null,
  description text,
  is_urgent boolean default false,   -- toujours false en pratique : renvoyer vers le 17/112
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PROS (artisans / auto-entrepreneurs abonnés)
-- ------------------------------------------------------------
create table pro_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text not null,
  siret text,
  siret_verified boolean default false,
  tagline text,
  description text,
  subscription_status text default 'inactive',  -- 'active' | 'inactive' | 'past_due'
  subscription_plan text,                        -- 'monthly' | 'yearly'
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table pro_zones (
  pro_id uuid references pro_profiles(id) on delete cascade,
  commune_id uuid references communes(id) on delete cascade,
  primary key (pro_id, commune_id)
);

create table pro_services (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid references pro_profiles(id) on delete cascade,
  label text not null,
  price_from numeric,
  price_note text
);

create table pro_reviews (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid references pro_profiles(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  body text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ABONNEMENTS COMMUNE CERTIFIÉE (mairie)
-- ------------------------------------------------------------
create table commune_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  commune_id uuid references communes(id) not null,
  contact_email text not null,
  contact_name text,
  status text default 'pending',   -- 'pending' | 'active' | 'cancelled'
  verified_at timestamptz,          -- preuve officielle validée avant activation
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table user_favorites enable row level security;
alter table annonces enable row level security;
alter table annonce_comments enable row level security;
alter table vigilance_members enable row level security;
alter table vigilance_signalements enable row level security;
alter table pro_profiles enable row level security;
alter table pro_reviews enable row level security;

-- Profiles : chacun lit tout le monde, modifie seulement le sien
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Favoris : strictement privé à l'utilisateur
create policy "favorites_owner_only" on user_favorites
  for all using (auth.uid() = user_id);

-- Annonces : lecture publique, écriture par l'auteur
create policy "annonces_select_all" on annonces for select using (true);
create policy "annonces_insert_own" on annonces for insert with check (auth.uid() = author_id);
create policy "annonces_update_own" on annonces for update using (auth.uid() = author_id);
create policy "annonces_delete_own" on annonces for delete using (auth.uid() = author_id);

create policy "comments_select_all" on annonce_comments for select using (true);
create policy "comments_insert_auth" on annonce_comments for insert with check (auth.uid() = author_id);

-- Vigilance : lecture/écriture réservée aux résidents déclarés de la commune concernée
create policy "vigilance_members_resident_only" on vigilance_members
  for all using (
    auth.uid() = user_id
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.commune_residence_id = vigilance_members.commune_id
    )
  );

create policy "vigilance_signalements_resident_read" on vigilance_signalements
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.commune_residence_id = vigilance_signalements.commune_id
    )
  );

create policy "vigilance_signalements_resident_write" on vigilance_signalements
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.commune_residence_id = vigilance_signalements.commune_id
    )
  );

-- Pros : lecture publique si abonnement actif, écriture par le pro lui-même
create policy "pro_profiles_select_active" on pro_profiles
  for select using (subscription_status = 'active' or auth.uid() = id);
create policy "pro_profiles_update_own" on pro_profiles for update using (auth.uid() = id);

create policy "pro_reviews_select_all" on pro_reviews for select using (true);
create policy "pro_reviews_insert_auth" on pro_reviews for insert with check (auth.uid() = author_id);

-- ============================================================
-- SEED : catégories
-- ============================================================
insert into categories (slug, label, emoji, color_hex) values
  ('objets', 'Objets', '🔧', '#FF6B5B'),
  ('services', 'Services', '🪛', '#2FC1A3'),
  ('transport', 'Transport', '🚗', '#4D8DFF'),
  ('garde', 'Garde', '🐾', '#FFC93C'),
  ('alimentaire', 'Alimentaire', '🍅', '#FF6FA5'),
  ('alertes', 'Alertes', '📢', '#9B6BFF'),
  ('vigilance', 'Vigilance', '👀', '#C4453E'),
  ('pro', 'Pro ponctuel', '💼', '#E0A526');
