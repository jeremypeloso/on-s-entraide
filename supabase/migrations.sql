-- =====================================================================
--  onseditout.fr — SQL cumulatif (idempotent)
--  Contient tout ce qui a été ajouté au-dessus de schema.sql.
--  Exécutable d'un bloc, autant de fois que nécessaire : chaque
--  instruction ignore ce qui existe déjà et recrée les policies.
-- =====================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- PROFILS
-- ---------------------------------------------------------------------
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists is_admin boolean default false;
alter table profiles add column if not exists staff_role text;                  -- 'fondateur' | 'equipe'
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists notif_questions boolean default true;
alter table profiles add column if not exists notif_digest boolean default true;
alter table profiles add column if not exists residence_declared_at timestamptz;

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (true);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set full_name = coalesce(nullif(profiles.full_name, ''), excluded.full_name);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RÉFÉRENTIEL (communes, catégories) : lecture publique
-- ---------------------------------------------------------------------
drop policy if exists "communes_select_all" on communes;
create policy "communes_select_all" on communes for select using (true);
drop policy if exists "categories_select_all" on categories;
create policy "categories_select_all" on categories for select using (true);
-- Géométrie PostGIS (à relancer après tout réimport des communes)
update communes set geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography where lat is not null and geom is null;

-- ---------------------------------------------------------------------
-- ANNONCES, QUESTIONS PUBLIQUES, SIGNALEMENTS
-- ---------------------------------------------------------------------
drop policy if exists "annonces_update_own" on annonces;
create policy "annonces_update_own" on annonces for update using (auth.uid() = author_id);
drop policy if exists "annonces_delete_own" on annonces;
create policy "annonces_delete_own" on annonces for delete using (auth.uid() = author_id);

drop policy if exists "annonce_comments_select_all" on annonce_comments;
create policy "annonce_comments_select_all" on annonce_comments for select using (true);
drop policy if exists "annonce_comments_insert_own" on annonce_comments;
create policy "annonce_comments_insert_own" on annonce_comments for insert with check (auth.uid() = author_id);

create table if not exists annonce_signalements (
  id uuid primary key default uuid_generate_v4(),
  annonce_id uuid references annonces(id) on delete cascade not null,
  reporter_id uuid references profiles(id) on delete cascade not null,
  motif text not null,
  commentaire text,
  statut text default 'en_attente',
  created_at timestamptz default now(),
  unique (annonce_id, reporter_id)
);
alter table annonce_signalements enable row level security;
drop policy if exists "signalements_insert_own" on annonce_signalements;
create policy "signalements_insert_own" on annonce_signalements for insert with check (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------
-- MAIRIES
-- ---------------------------------------------------------------------
drop policy if exists "alertes_select_all" on alertes_officielles;
create policy "alertes_select_all" on alertes_officielles for select using (true);
alter table alertes_officielles add column if not exists photo_url text;

create table if not exists commune_agents (
  user_id uuid references profiles(id) on delete cascade,
  commune_id uuid references communes(id) on delete cascade,
  role text default 'agent',
  created_at timestamptz default now(),
  primary key (user_id, commune_id)
);
alter table commune_agents enable row level security;
drop policy if exists "commune_agents_select_all" on commune_agents;
create policy "commune_agents_select_all" on commune_agents for select using (true);

create table if not exists mairie_coordonnees (
  commune_id uuid primary key references communes(id) on delete cascade,
  adresse text, telephone text, email text, horaires text, site_web text,
  updated_at timestamptz default now()
);
alter table mairie_coordonnees enable row level security;
drop policy if exists "mairie_coordonnees_select_all" on mairie_coordonnees;
create policy "mairie_coordonnees_select_all" on mairie_coordonnees for select using (true);
drop policy if exists "mairie_coordonnees_agents_write" on mairie_coordonnees;
create policy "mairie_coordonnees_agents_write" on mairie_coordonnees for all using (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = mairie_coordonnees.commune_id)
) with check (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = mairie_coordonnees.commune_id)
);
drop policy if exists "alertes_agents_write" on alertes_officielles;
create policy "alertes_agents_write" on alertes_officielles for all using (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = alertes_officielles.commune_id)
) with check (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = alertes_officielles.commune_id)
);

create table if not exists commune_subscriptions (
  commune_id uuid primary key references communes(id) on delete cascade,
  plan text, status text default 'inactive', source text default 'stripe',
  stripe_subscription_id text, stripe_customer_id text,
  current_period_end timestamptz, updated_at timestamptz default now()
);
alter table commune_subscriptions enable row level security;
drop policy if exists "commune_subs_agents_read" on commune_subscriptions;
create policy "commune_subs_agents_read" on commune_subscriptions for select using (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = commune_subscriptions.commune_id)
);

-- ---------------------------------------------------------------------
-- ÉVÉNEMENTS (agenda)
-- ---------------------------------------------------------------------
create table if not exists evenements (
  id uuid primary key default uuid_generate_v4(),
  commune_id uuid references communes(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  organisateur_type text not null default 'mairie',
  organisateur_nom text,
  association_id uuid,
  titre text not null, description text,
  starts_at timestamptz not null, ends_at timestamptz,
  lieu text, photo_url text,
  created_at timestamptz default now()
);
alter table evenements enable row level security;
drop policy if exists "evenements_select_all" on evenements;
create policy "evenements_select_all" on evenements for select using (true);
drop policy if exists "evenements_agents_write" on evenements;
create policy "evenements_agents_write" on evenements for all using (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = evenements.commune_id)
) with check (
  exists (select 1 from commune_agents a where a.user_id = auth.uid() and a.commune_id = evenements.commune_id)
);

-- ---------------------------------------------------------------------
-- ASSOCIATIONS
-- ---------------------------------------------------------------------
create table if not exists associations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  commune_id uuid references communes(id) not null,
  nom text not null, categorie text not null default 'autre',
  description text, email text, telephone text, site_web text, logo_url text,
  rna text, is_verified boolean default false,
  created_at timestamptz default now()
);
alter table associations enable row level security;
drop policy if exists "assos_select_all" on associations;
create policy "assos_select_all" on associations for select using (true);
drop policy if exists "assos_insert_own" on associations;
create policy "assos_insert_own" on associations for insert with check (auth.uid() = user_id);
drop policy if exists "assos_update_own" on associations;
create policy "assos_update_own" on associations for update using (auth.uid() = user_id);
drop policy if exists "evenements_assos_write" on evenements;
create policy "evenements_assos_write" on evenements for all using (
  organisateur_type = 'association'
  and exists (select 1 from associations a where a.id = evenements.association_id and a.user_id = auth.uid())
) with check (
  organisateur_type = 'association'
  and exists (select 1 from associations a where a.id = evenements.association_id and a.user_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- PROS
-- ---------------------------------------------------------------------
alter table pro_profiles add column if not exists telephone text;
alter table pro_profiles add column if not exists email text;
alter table pro_profiles add column if not exists site_web text;
alter table pro_profiles add column if not exists logo_url text;
alter table pro_profiles add column if not exists base_commune_id uuid references communes(id);
alter table pro_profiles add column if not exists stripe_subscription_id text;
alter table pro_profiles add column if not exists current_period_end timestamptz;
alter table pro_profiles add column if not exists pending_plan text;

drop policy if exists "pro_profiles_select_all" on pro_profiles;
create policy "pro_profiles_select_all" on pro_profiles for select using (true);
drop policy if exists "pro_profiles_upsert_own" on pro_profiles;
create policy "pro_profiles_upsert_own" on pro_profiles for insert with check (auth.uid() = id);
drop policy if exists "pro_profiles_update_own" on pro_profiles;
create policy "pro_profiles_update_own" on pro_profiles for update using (auth.uid() = id);

alter table pro_services enable row level security;
drop policy if exists "pro_services_select_all" on pro_services;
create policy "pro_services_select_all" on pro_services for select using (true);
drop policy if exists "pro_services_write_own" on pro_services;
create policy "pro_services_write_own" on pro_services for all using (auth.uid() = pro_id) with check (auth.uid() = pro_id);

alter table pro_zones enable row level security;
drop policy if exists "pro_zones_select_all" on pro_zones;
create policy "pro_zones_select_all" on pro_zones for select using (true);
drop policy if exists "pro_zones_write_own" on pro_zones;
create policy "pro_zones_write_own" on pro_zones for all using (auth.uid() = pro_id) with check (auth.uid() = pro_id);
do $$ begin
  delete from pro_zones a using pro_zones b where a.ctid < b.ctid and a.pro_id = b.pro_id and a.commune_id = b.commune_id;
  if not exists (select 1 from pg_constraint where conname = 'pro_zones_unique') then
    alter table pro_zones add constraint pro_zones_unique unique (pro_id, commune_id);
  end if;
end $$;

-- Zone par rayon (10/25/50 km) autour de la commune de départ
create or replace function refresh_pro_zone(p_pro uuid) returns integer
language plpgsql security definer as $$
declare v_base uuid; v_plan text; v_radius_km int; v_count int;
begin
  if auth.uid() is not null and auth.uid() is distinct from p_pro then raise exception 'forbidden'; end if;
  select base_commune_id, subscription_plan into v_base, v_plan from pro_profiles where id = p_pro;
  if v_base is null then return 0; end if;
  v_radius_km := case v_plan when 'premium' then 50 when 'visibilite' then 25 else 10 end;
  delete from pro_zones where pro_id = p_pro;
  insert into pro_zones (pro_id, commune_id)
  select p_pro, c.id from communes c join communes b on b.id = v_base
  where c.geom is not null and b.geom is not null and ST_DWithin(c.geom, b.geom, v_radius_km * 1000);
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

-- Règles de publication des pros (sponsorisé forcé, quotas par pack)
create or replace function enforce_pro_annonce_rules() returns trigger
language plpgsql security definer as $$
declare v_plan text; v_status text; v_count int;
begin
  select subscription_plan, subscription_status into v_plan, v_status from pro_profiles where id = new.author_id;
  if not found then return new; end if;
  new.is_sponsored := true;
  new.sponsored_until := new.expires_at;
  if v_status is distinct from 'active' then raise exception 'PRO_SUBSCRIPTION_REQUIRED'; end if;
  if v_plan = 'essentiel' then raise exception 'PRO_PLAN_NO_ANNONCE';
  elsif v_plan = 'visibilite' then
    select count(*) into v_count from annonces where author_id = new.author_id and created_at > now() - interval '30 days';
    if v_count >= 1 then raise exception 'PRO_QUOTA_REACHED'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_pro_annonce on annonces;
create trigger trg_pro_annonce before insert on annonces for each row execute function enforce_pro_annonce_rules();

-- Avis clients
alter table pro_reviews add column if not exists pro_reply text;
alter table pro_reviews add column if not exists replied_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pro_reviews_one_per_user') then
    alter table pro_reviews add constraint pro_reviews_one_per_user unique (pro_id, author_id);
  end if;
end $$;
drop policy if exists "pro_reviews_select_all" on pro_reviews;
create policy "pro_reviews_select_all" on pro_reviews for select using (true);
drop policy if exists "pro_reviews_insert_auth" on pro_reviews;
create policy "pro_reviews_insert_auth" on pro_reviews for insert with check (auth.uid() = author_id);
drop policy if exists "pro_reviews_update_own" on pro_reviews;
create policy "pro_reviews_update_own" on pro_reviews for update using (auth.uid() = author_id);

create table if not exists review_signalements (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references pro_reviews(id) on delete cascade not null,
  pro_id uuid references pro_profiles(id) on delete cascade not null,
  motif text not null, commentaire text, statut text default 'en_attente',
  created_at timestamptz default now(),
  unique (review_id, pro_id)
);
alter table review_signalements enable row level security;
drop policy if exists "review_sig_insert_own_pro" on review_signalements;
create policy "review_sig_insert_own_pro" on review_signalements for insert with check (auth.uid() = pro_id);
drop policy if exists "review_sig_select_own_pro" on review_signalements;
create policy "review_sig_select_own_pro" on review_signalements for select using (auth.uid() = pro_id);

-- ---------------------------------------------------------------------
-- VIGILANCE DE QUARTIER (résidents déclarés uniquement)
-- ---------------------------------------------------------------------
alter table vigilance_signalements add column if not exists type text default 'autre';
alter table vigilance_signalements add column if not exists statut text default 'actif';

create table if not exists vigilance_comments (
  id uuid primary key default uuid_generate_v4(),
  signalement_id uuid references vigilance_signalements(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  body text not null, created_at timestamptz default now()
);
alter table vigilance_comments enable row level security;

drop policy if exists vm_select on vigilance_members;
create policy vm_select on vigilance_members for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.commune_residence_id = vigilance_members.commune_id));
drop policy if exists vm_insert_own on vigilance_members;
create policy vm_insert_own on vigilance_members for insert with check (
  auth.uid() = user_id and exists (select 1 from profiles p where p.id = auth.uid() and p.commune_residence_id = commune_id));
drop policy if exists vm_delete_own on vigilance_members;
create policy vm_delete_own on vigilance_members for delete using (auth.uid() = user_id);

drop policy if exists vs_select_residents on vigilance_signalements;
create policy vs_select_residents on vigilance_signalements for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.commune_residence_id = vigilance_signalements.commune_id));
drop policy if exists vs_insert_member on vigilance_signalements;
create policy vs_insert_member on vigilance_signalements for insert with check (
  auth.uid() = author_id
  and exists (select 1 from profiles p where p.id = auth.uid() and p.commune_residence_id = commune_id)
  and exists (select 1 from vigilance_members m where m.user_id = auth.uid() and m.commune_id = vigilance_signalements.commune_id));
drop policy if exists vs_update_own on vigilance_signalements;
create policy vs_update_own on vigilance_signalements for update using (auth.uid() = author_id);

drop policy if exists vc_select_residents on vigilance_comments;
create policy vc_select_residents on vigilance_comments for select using (
  exists (select 1 from vigilance_signalements s join profiles p on p.id = auth.uid()
          where s.id = signalement_id and p.commune_residence_id = s.commune_id));
drop policy if exists vc_insert_member on vigilance_comments;
create policy vc_insert_member on vigilance_comments for insert with check (
  auth.uid() = author_id and exists (
    select 1 from vigilance_signalements s join vigilance_members m on m.commune_id = s.commune_id and m.user_id = auth.uid()
    where s.id = signalement_id));

-- ---------------------------------------------------------------------
-- MESSAGERIE PRIVÉE
-- ---------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  annonce_id uuid references annonces(id) on delete set null,
  participant_a uuid references profiles(id) on delete cascade not null,
  participant_b uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  last_notified_at timestamptz,
  unique (annonce_id, participant_a, participant_b)
);
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  body text not null, created_at timestamptz default now(), read_at timestamptz
);
create index if not exists messages_conv_idx on messages(conversation_id, created_at);
alter table conversations enable row level security;
alter table messages enable row level security;
drop policy if exists "conv_participants" on conversations;
create policy "conv_participants" on conversations for select using (auth.uid() in (participant_a, participant_b));
drop policy if exists "msg_participants_select" on messages;
create policy "msg_participants_select" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.participant_a, c.participant_b)));
drop policy if exists "msg_mark_read" on messages;
create policy "msg_mark_read" on messages for update using (
  exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.participant_a, c.participant_b)));

-- ---------------------------------------------------------------------
-- CONTACT, RÉGLAGES DU SITE
-- ---------------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  sujet text not null, nom text, email text not null, message text not null,
  traite boolean default false, created_at timestamptz default now()
);
alter table contact_messages enable row level security;
drop policy if exists "contact_insert_all" on contact_messages;
create policy "contact_insert_all" on contact_messages for insert with check (true);

create table if not exists site_settings (
  key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now()
);
alter table site_settings enable row level security;
drop policy if exists "settings_select_all" on site_settings;
create policy "settings_select_all" on site_settings for select using (true);
insert into site_settings (key, value) values ('maintenance', '{"enabled": false, "message": ""}'::jsonb) on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- STOCKAGE : bucket photos (lecture publique, écriture connectée)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos_auth_write" on storage.objects;
create policy "photos_auth_write" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

-- =====================================================================
-- Fin. Pour donner le droit admin et le badge fondateur :
-- update profiles set is_admin = true, staff_role = 'fondateur'
-- where id = (select id from auth.users where email = 'VOTRE_EMAIL');
-- =====================================================================
