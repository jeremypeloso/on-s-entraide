// =====================================================================
// Ville de test : Villeneuve-des-Tests (78)
//   node scripts/seed-test.mjs          → crée (ou recrée) la ville et ses données
//   node scripts/seed-test.mjs --reset  → supprime tout (ville, comptes, données)
// Lit NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local
// Tous les comptes ont le mot de passe : Test1234!
// =====================================================================
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Variables NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const PASSWORD = "Test1234!";
const COMMUNE = { code_insee: "99999", nom: "Villeneuve-des-Tests", slug: "villeneuve-des-tests", code_postal: "78999", departement: "Yvelines", region: "Île-de-France", population: 1234, lat: 49.05, lng: 1.55 };
const USERS = [
  { key: "marie",   email: "test+marie@onseditout.fr",   name: "Marie Testard" },
  { key: "karim",   email: "test+karim@onseditout.fr",   name: "Karim Essai" },
  { key: "lucie",   email: "test+lucie@onseditout.fr",   name: "Lucie Démo" },
  { key: "paul",    email: "test+paul@onseditout.fr",    name: "Paul Fictif" },
  { key: "pro",     email: "test+pro@onseditout.fr",     name: "Julien Plombier" },
  { key: "asso",    email: "test+asso@onseditout.fr",    name: "Sophie Bénévole" },
  { key: "mairie",  email: "test+mairie@onseditout.fr",  name: "Agent Mairie Test" },
  { key: "amb",     email: "test+ambassadeur@onseditout.fr", name: "Nadia Ambassadrice" },
];

const die = (e, ctx) => { if (e) { console.error(`✗ ${ctx} :`, e.message ?? e); process.exit(1); } };
const log = (m) => console.log("✓", m);

async function findUsers() {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  return (data?.users ?? []).filter((u) => USERS.some((t) => t.email === u.email));
}

async function reset() {
  const { data: c } = await db.from("communes").select("id").eq("slug", COMMUNE.slug).maybeSingle();
  if (c) {
    // Données rattachées à la commune sans cascade
    for (const t of ["annonces", "evenements", "alertes_officielles", "vigilance_signalements", "vigilance_members", "associations", "commune_agents", "pro_zones", "user_favorites", "commune_subscriptions", "mairie_coordonnees"]) {
      await db.from(t).delete().eq("commune_id", c.id);
    }
  }
  for (const u of await findUsers()) await db.auth.admin.deleteUser(u.id);   // cascade : profiles, pro_profiles, ambassadeurs, parrainages…
  if (c) { await db.from("pro_profiles").delete().eq("base_commune_id", c.id); await db.from("profiles").update({ commune_residence_id: null }).eq("commune_residence_id", c.id); await db.from("communes").delete().eq("id", c.id); }
  log("Ville de test et comptes supprimés");
}

async function seed() {
  await reset();

  const { data: commune, error: e0 } = await db.from("communes").insert(COMMUNE).select("id").single(); die(e0, "commune");
  log(`Commune ${COMMUNE.nom} (${COMMUNE.slug})`);

  const ids = {};
  for (const u of USERS) {
    const { data, error } = await db.auth.admin.createUser({ email: u.email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: u.name } });
    die(error, `compte ${u.email}`);
    ids[u.key] = data.user.id;
    await db.from("profiles").upsert({ id: data.user.id, full_name: u.name, commune_residence_id: commune.id, residence_declared_at: new Date().toISOString() });
  }
  log(`${USERS.length} comptes (mot de passe ${PASSWORD})`);

  const { data: cats } = await db.from("categories").select("id, slug");
  const cat = (slug) => cats?.find((c) => c.slug === slug)?.id ?? cats?.[0]?.id;

  const ago = (days) => new Date(Date.now() - days * 864e5).toISOString();
  const inDays = (days, h = 18) => { const d = new Date(Date.now() + days * 864e5); d.setHours(h, 0, 0, 0); return d.toISOString(); };

  const annonces = [
    ["marie", "objets", "Prête appareil à raclette 8 personnes", "Parfait pour vos soirées d'hiver. À rendre propre 😊", "disponible"],
    ["karim", "objets", "Cherche une perceuse pour le week-end", "Juste pour fixer deux étagères, je rends dimanche soir.", "disponible"],
    ["lucie", "services", "Aide pour déménager un canapé samedi", "Deux bras costauds suffisent, il y a des croissants.", "reserve"],
    ["paul", "transport", "Covoiturage vers la gare de Mantes le matin", "Départ 7h15 du centre, retour vers 18h30. Participation essence.", "disponible"],
    ["marie", "garde", "Garde de chat pendant les vacances de la Toussaint", "Chat très calme, juste des croquettes matin et soir.", "disponible"],
    ["karim", "alimentaire", "Trop de courgettes du potager, servez-vous !", "Panier devant le portail, prenez ce que vous voulez.", "disponible"],
    ["lucie", "alertes", "Route de la Plaine barrée jusqu'à vendredi", "Travaux sur la canalisation, passez par la rue des Lilas.", "disponible"],
    ["paul", "objets", "Donne vélo enfant 16 pouces", "Plus à la bonne taille, quelques rayures.", "termine"],
  ];
  for (const [who, slug, title, description, statut] of annonces) {
    const { error } = await db.from("annonces").insert({ author_id: ids[who], commune_id: commune.id, category_id: cat(slug), title, description, statut, created_at: ago(Math.floor(Math.random() * 10)) });
    die(error, `annonce ${title}`);
  }
  log(`${annonces.length} annonces`);

  const { data: a1 } = await db.from("annonces").select("id").eq("commune_id", commune.id).limit(1).single();
  await db.from("annonce_comments").insert([{ annonce_id: a1.id, author_id: ids.karim, body: "Elle est dispo ce samedi ?" }, { annonce_id: a1.id, author_id: ids.marie, body: "Oui, passe quand tu veux !" }]);

  // Pro abonné
  const { error: e1 } = await db.from("pro_profiles").insert({ id: ids.pro, business_name: "Julien Plomberie Test", siret: "12345678900012", siret_verified: true, tagline: "Dépannage 7j/7 dans le 78", description: "Plombier chauffagiste, devis gratuit.", subscription_status: "active", subscription_plan: "monthly", base_commune_id: commune.id, telephone: "06 00 00 00 00", email: "test+pro@onseditout.fr" });
  die(e1, "pro_profiles");
  await db.from("pro_zones").insert({ pro_id: ids.pro, commune_id: commune.id });
  await db.from("pro_reviews").insert([{ pro_id: ids.pro, author_id: ids.marie, rating: 5, body: "Rapide et propre, je recommande." }, { pro_id: ids.pro, author_id: ids.paul, rating: 4, body: "Bon travail, un peu en retard." }]).then(({ error }) => error && console.warn("  (avis pro ignorés :", error.message + ")"));
  log("Pro abonné + 2 avis");

  // Association + événements
  const { data: asso, error: e2 } = await db.from("associations").insert({ user_id: ids.asso, commune_id: commune.id, nom: "Les Amis de Villeneuve", categorie: "culture", description: "Fêtes de village, brocante annuelle, ateliers.", email: "test+asso@onseditout.fr", rna: "W999000001", is_verified: true }).select("id").single();
  die(e2, "association");
  await db.from("evenements").insert([
    { commune_id: commune.id, author_id: ids.asso, organisateur_type: "association", association_id: asso.id, organisateur_nom: "Les Amis de Villeneuve", titre: "Brocante de printemps", description: "Exposants dès 7h, buvette sur place.", starts_at: inDays(10, 8), ends_at: inDays(10, 18), lieu: "Place de la Mairie" },
    { commune_id: commune.id, author_id: ids.mairie, organisateur_type: "mairie", organisateur_nom: "Mairie", titre: "Conseil municipal", description: "Séance publique.", starts_at: inDays(4, 20), lieu: "Salle du conseil" },
  ]);
  log("Association vérifiée + 2 événements");

  // Mairie : agent + alerte officielle
  await db.from("commune_agents").insert({ user_id: ids.mairie, commune_id: commune.id, role: "agent" }).then(({ error }) => die(error, "commune_agents"));
  await db.from("alertes_officielles").insert({ commune_id: commune.id, title: "Coupure d'eau jeudi matin", body: "Intervention sur le réseau de 8h à 12h, rue de la Gare.", starts_at: inDays(2, 8), ends_at: inDays(2, 12) });
  log("Agent mairie + alerte officielle");

  // Vigilance
  await db.from("vigilance_members").insert([{ user_id: ids.marie, commune_id: commune.id }, { user_id: ids.karim, commune_id: commune.id }, { user_id: ids.lucie, commune_id: commune.id }]);
  await db.from("vigilance_signalements").insert({ author_id: ids.karim, commune_id: commune.id, title: "Voiture inconnue stationnée depuis 3 jours", description: "Break gris rue des Lilas, personne ne la reconnaît." });
  log("Vigilance : 3 membres + 1 signalement");

  // Ambassadrice + parrainages
  const { data: amb, error: e3 } = await db.from("ambassadeurs").insert({ user_id: ids.amb, commune: COMMUNE.nom, ref_code: "AMB-TEST1", statut: "actif", motivation: "J'anime le groupe Facebook du village.", conditions_version: "2026-09", conditions_accepted_at: new Date().toISOString() }).select("id").single();
  if (e3) console.warn("  (ambassadeurs ignoré :", e3.message + ")");
  else {
    await db.from("parrainages").insert([
      { ambassadeur_id: amb.id, filleul_user_id: ids.marie, type: "habitant" }, { ambassadeur_id: amb.id, filleul_user_id: ids.karim, type: "habitant" },
      { ambassadeur_id: amb.id, filleul_user_id: ids.lucie, type: "habitant" }, { ambassadeur_id: amb.id, filleul_user_id: ids.paul, type: "habitant" },
      { ambassadeur_id: amb.id, filleul_user_id: ids.pro, type: "habitant" }, { ambassadeur_id: amb.id, filleul_user_id: ids.pro, type: "pro" },
    ]);
    log("Ambassadrice AMB-TEST1 : 5 habitants + 1 pro parrainés (50 pts disponibles)");
  }

  // Message de contact
  await db.from("contact_messages").insert({ nom: "Paul Fictif", email: "test+paul@onseditout.fr", sujet: "Question", message: "Est-ce que le site marche aussi pour les hameaux ?" }).then(({ error }) => error && console.warn("  (contact ignoré :", error.message + ")"));

  console.log(`
Ville de test prête : ${url.replace(/\/$/, "").replace("https://", "")} → https://onseditout.fr/${COMMUNE.slug}
Comptes (mot de passe ${PASSWORD}) :
${USERS.map((u) => `  ${u.email.padEnd(34)} ${u.name}`).join("\n")}
Lien ambassadeur : https://onseditout.fr/?ref=AMB-TEST1
`);
}

(process.argv.includes("--reset") ? reset() : seed()).catch((e) => { console.error(e); process.exit(1); });
