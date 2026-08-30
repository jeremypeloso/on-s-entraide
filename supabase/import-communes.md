# Import des 34 875 communes (COG INSEE)

Le schéma attend une table `communes` peuplée une seule fois au démarrage.

## 1. Télécharger le COG

Source officielle : https://www.insee.fr/fr/information/2560452
(fichier CSV "communes.csv" du Code Officiel Géographique, édition en cours)

## 2. Générer le CSV d'import

Colonnes attendues par `communes` : `code_insee, nom, slug, code_postal,
departement, region, population, lat, lng`.

Le `slug` doit être l'URL-safe du nom (minuscules, tirets, sans accent) :
`Limetz-Villez` → `limetz-villez`.

Un script Python simple :

```python
import csv, unicodedata, re

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s

with open("communes_insee.csv") as f_in, open("communes_import.csv", "w") as f_out:
    reader = csv.DictReader(f_in)
    writer = csv.writer(f_out)
    writer.writerow(["code_insee","nom","slug","code_postal","departement","region","population","lat","lng"])
    for row in reader:
        writer.writerow([
            row["code_insee"], row["nom"], slugify(row["nom"]),
            row["code_postal"], row["departement"], row["region"],
            row["population"], row["lat"], row["lng"],
        ])
```

## 3. Importer dans Supabase

Via le SQL editor de Supabase (app.supabase.com), après avoir uploadé le CSV
dans le Storage, ou en local :

```bash
psql "$DATABASE_URL" -c "\copy communes(code_insee,nom,slug,code_postal,departement,region,population,lat,lng) FROM 'communes_import.csv' WITH (FORMAT csv, HEADER true)"
```

## 4. Renseigner la géométrie PostGIS

```sql
update communes
set geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
where lat is not null and lng is not null;
```

Attention aux slugs en doublon (rare mais possible entre deux communes
homonymes de départements différents) : dans ce cas, suffixer avec le
département, ex. `limetz-villez-78`.
