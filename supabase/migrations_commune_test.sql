-- Communes de test : jamais affichées sur l'accueil (annonces récentes)
alter table communes add column if not exists is_test boolean not null default false;
