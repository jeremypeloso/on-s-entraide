-- =====================================================================
-- PROGRAMME AMBASSADEURS — à exécuter dans l'éditeur SQL Supabase
-- =====================================================================
create table if not exists ambassadeurs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  nom text not null,
  email text not null,
  telephone text,
  commune text not null,
  profil text not null check (profil in ('habitant','commercant','association','elu')),
  motivation text,
  ref_code text not null unique,
  statut text not null default 'candidat' check (statut in ('candidat','actif','inactif')),
  created_at timestamptz default now()
);

create table if not exists parrainages (
  id uuid primary key default uuid_generate_v4(),
  ambassadeur_id uuid references ambassadeurs(id) on delete cascade not null,
  filleul_user_id uuid references profiles(id) on delete set null,
  type text not null check (type in ('habitant','pro','collectivite')),
  created_at timestamptz default now(),
  unique (filleul_user_id, type)
);
create index if not exists parrainages_amb_idx on parrainages(ambassadeur_id);

alter table ambassadeurs enable row level security;
alter table parrainages enable row level security;

-- L'ambassadeur connecté voit sa fiche et ses parrainages (écritures via service role uniquement)
drop policy if exists "amb_select_own" on ambassadeurs;
create policy "amb_select_own" on ambassadeurs for select using (auth.uid() = user_id);
drop policy if exists "parr_select_own" on parrainages;
create policy "parr_select_own" on parrainages for select using (
  exists (select 1 from ambassadeurs a where a.id = ambassadeur_id and a.user_id = auth.uid()));

-- Stats par ambassadeur (vue security_invoker : hérite des RLS ci-dessus)
create or replace view ambassadeur_stats with (security_invoker = true) as
select a.id as ambassadeur_id,
       count(p.id) filter (where p.type = 'habitant')     as habitants,
       count(p.id) filter (where p.type = 'pro')          as pros,
       count(p.id) filter (where p.type = 'collectivite') as collectivites
from ambassadeurs a
left join parrainages p on p.ambassadeur_id = a.id
group by a.id;
