-- =====================================================================
-- AMBASSADEURS v2 : un seul type (habitant inscrit), conditions, points, cartes cadeaux
-- À exécuter dans l'éditeur SQL Supabase APRÈS migrations_ambassadeurs.sql
-- =====================================================================
alter table ambassadeurs drop column if exists profil;
alter table ambassadeurs drop column if exists email;
alter table ambassadeurs drop column if exists nom;
alter table ambassadeurs drop column if exists telephone;
alter table ambassadeurs alter column user_id set not null;
create unique index if not exists ambassadeurs_user_idx on ambassadeurs(user_id);

-- Acceptation des conditions du programme (traçabilité juridique)
alter table ambassadeurs add column if not exists conditions_version text;
alter table ambassadeurs add column if not exists conditions_accepted_at timestamptz;
alter table ambassadeurs add column if not exists conditions_ip text;

-- Demandes de cartes cadeaux
create table if not exists recompenses (
  id uuid primary key default uuid_generate_v4(),
  ambassadeur_id uuid references ambassadeurs(id) on delete cascade not null,
  points integer not null,
  montant integer not null,                     -- en euros
  statut text not null default 'en_attente' check (statut in ('en_attente','envoyee','annulee')),
  note text,
  created_at timestamptz default now(),
  sent_at timestamptz
);
create index if not exists recompenses_amb_idx on recompenses(ambassadeur_id);
alter table recompenses enable row level security;
drop policy if exists "rec_select_own" on recompenses;
create policy "rec_select_own" on recompenses for select using (
  exists (select 1 from ambassadeurs a where a.id = ambassadeur_id and a.user_id = auth.uid()));

-- Barème (modifiable ici, un seul endroit)
--   habitant inscrit        : 5 pts, bloqués tant qu'aucun abonnement
--   pro abonné              : 30 pts + débloque 20 pts d'habitants
--   mairie certifiée        : 60 pts + débloque 40 pts d'habitants
create or replace view ambassadeur_stats with (security_invoker = true) as
with c as (
  select a.id as ambassadeur_id,
         count(p.id) filter (where p.type = 'habitant')     as habitants,
         count(p.id) filter (where p.type = 'pro')          as pros,
         count(p.id) filter (where p.type = 'collectivite') as collectivites
  from ambassadeurs a
  left join parrainages p on p.ambassadeur_id = a.id
  group by a.id
), d as (
  select ambassadeur_id, coalesce(sum(points) filter (where statut <> 'annulee'), 0) as depenses
  from recompenses group by ambassadeur_id
)
select c.ambassadeur_id, c.habitants, c.pros, c.collectivites,
       (5 * c.habitants + 30 * c.pros + 60 * c.collectivites)::int as points_total,
       (30 * c.pros + 60 * c.collectivites + least(5 * c.habitants, 20 * c.pros + 40 * c.collectivites))::int as points_debloques,
       coalesce(d.depenses, 0)::int as points_depenses,
       (30 * c.pros + 60 * c.collectivites + least(5 * c.habitants, 20 * c.pros + 40 * c.collectivites) - coalesce(d.depenses, 0))::int as points_disponibles
from c left join d on d.ambassadeur_id = c.ambassadeur_id;
