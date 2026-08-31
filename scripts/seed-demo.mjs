// Seed de démonstration : Limetz-Villez devient une commune vivante
// - 6 habitants démo avec annonces variées (toutes catégories, tous statuts)
// - Mairie certifiée + 3 alertes officielles (dont un événement)
// - 1 artisan pro vérifié avec services, visible dans l'encart Pros
// - Module vigilance : membres + 2 signalements
// Usage : node scripts/seed-demo.mjs
// Relançable sans doublons (les annonces démo précédentes sont remplacées)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const DEMO_PASSWORD = "Demo-Onseditout-2026!";

const HABITANTS = [
  { email: "demo.sophie@onseditout.fr", name: "Sophie Martin" },
  { email: "demo.karim@onseditout.fr", name: "Karim Benali" },
  { email: "demo.claire@onseditout.fr", name: "Claire Dubois" },
  { email: "demo.michel@onseditout.fr", name: "Michel Lefèvre" },
  { email: "demo.laura@onseditout.fr", name: "Laura Petit" },
  { email: "demo.thomas@onseditout.fr", name: "Thomas Roux" },
];

const PRO = { email: "demo.atelier.duval@onseditout.fr", name: "Julien Duval" };

async function getOrCreateUser(email, fullName) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error) return data.user;
  // Déjà existant : on le retrouve
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = list.users.find((u) => u.email === email);
  if (!found) throw new Error(`Impossible de créer/retrouver ${email}: ${error.message}`);
  return found;
}

async function main() {
  // --- Commune ---
  const { data: commune, error: cErr } = await supabase
    .from("communes")
    .select("id, nom, slug")
    .eq("slug", "limetz-villez")
    .single();
  if (cErr || !commune) throw new Error("Commune limetz-villez introuvable. Import des communes fait ?");
  console.log(`🏡 Commune : ${commune.nom}`);

  await supabase.from("communes").update({ is_certified: true }).eq("id", commune.id);
  console.log("✓ Commune certifiée activée");

  // --- Catégories ---
  const { data: cats } = await supabase.from("categories").select("id, label");
  const cat = Object.fromEntries(cats.map((c) => [c.label, c.id]));

  // --- Habitants ---
  const users = [];
  for (const h of HABITANTS) {
    const u = await getOrCreateUser(h.email, h.name);
    await supabase.from("profiles").upsert({
      id: u.id,
      full_name: h.name,
      commune_residence_id: commune.id,
    });
    users.push({ ...h, id: u.id });
  }
  console.log(`✓ ${users.length} habitants démo`);

  // --- Purge des anciennes annonces démo (relançable) ---
  // On récupère aussi les comptes pro pour purger leurs annonces sponsorisées
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const demoAuthIds = allUsers.users
    .filter((u) => u.email?.startsWith("demo.") && (u.email?.endsWith("@onseditout.fr") || u.email?.endsWith("@onsentraide.fr")))
    .map((u) => u.id);
  await supabase.from("annonces").delete().in("author_id", demoAuthIds);

  // --- Annonces ---
  const now = Date.now();
  const h = 3600 * 1000;
  const annonces = [
    { author: 0, cat: "Transport", title: "Covoiturage vers la gare de Vernon, tous les matins", desc: "Départ 7h45 place de la mairie, retour 18h30. Une place régulière disponible, participation essence bienvenue.", statut: "disponible", age: 2 * h },
    { author: 1, cat: "Objets", title: "Perceuse-visseuse Bosch à prêter", desc: "Disponible en semaine après 18h et le week-end. Deux batteries, coffret d'embouts fourni.", statut: "disponible", age: 5 * h },
    { author: 2, cat: "Garde", title: "Recherche garde pour 2 chats, 5 jours fin septembre", desc: "Une visite par jour suffit, nourriture et litière fournies. Petite rémunération ou service en échange.", statut: "disponible", age: 8 * h },
    { author: 3, cat: "Services", title: "Coup de main pour tailler une haie de 15 mètres", desc: "J'ai le taille-haie, il me faut juste des bras et une remorque pour la déchetterie. Samedi matin idéalement.", statut: "reserve", age: 22 * h },
    { author: 4, cat: "Alimentaire", title: "Courgettes et tomates du jardin à donner", desc: "Production généreuse cette année ! Environ 4 kg à récupérer avant dimanche, rue des Peupliers.", statut: "disponible", age: 26 * h },
    { author: 5, cat: "Objets", title: "Donne canapé 2 places, bon état", desc: "Cause déménagement. Tissu gris, à venir chercher sur place (1er étage sans ascenseur, prévoir 2 personnes).", statut: "reserve", age: 2 * 24 * h },
    { author: 0, cat: "Services", title: "Propose aide informatique pour seniors", desc: "Installation de tablette, visio avec les petits-enfants, démarches en ligne. Bénévole, le mercredi après-midi.", statut: "disponible", age: 3 * 24 * h },
    { author: 2, cat: "Transport", title: "Qui monte à Paris jeudi en fin de journée ?", desc: "Je cherche une place vers Paris ou une gare RER jeudi entre 17h et 19h. Participation aux frais évidemment.", statut: "disponible", age: 3 * 24 * h },
    { author: 3, cat: "Objets", title: "Recherche vélo enfant 6-8 ans", desc: "Achat ou emprunt longue durée, pour la rentrée. Même à retaper, mon voisin m'aide à la mécanique !", statut: "disponible", age: 4 * 24 * h },
    { author: 4, cat: "Garde", title: "Sortie d'école le mardi : garde partagée ?", desc: "Je récupère déjà mes deux enfants à 16h30, je peux prendre un ou deux enfants de plus le mardi. On s'organise ?", statut: "disponible", age: 5 * 24 * h },
    { author: 1, cat: "Alimentaire", title: "Œufs frais de nos poules, panier de 6", desc: "Nos quatre poules produisent plus que nous ne consommons. Premier arrivé, premier servi !", statut: "termine", age: 6 * 24 * h },
  ];

  const rows = annonces.map((a) => ({
    author_id: users[a.author].id,
    commune_id: commune.id,
    category_id: cat[a.cat],
    title: a.title,
    description: a.desc,
    statut: a.statut,
    created_at: new Date(now - a.age).toISOString(),
    expires_at: new Date(now - a.age + 30 * 24 * h).toISOString(),
  }));

  const { error: aErr } = await supabase.from("annonces").insert(rows);
  if (aErr) throw new Error("Annonces: " + aErr.message);
  console.log(`✓ ${rows.length} annonces publiées`);

  // --- Alertes officielles mairie ---
  await supabase.from("alertes_officielles").delete().eq("commune_id", commune.id);
  const { error: alErr } = await supabase.from("alertes_officielles").insert([
    {
      commune_id: commune.id,
      title: "🎪 Fête du village — samedi 12 septembre",
      body: "Brocante dès 8h, animations pour enfants l'après-midi, repas champêtre le soir sur la place de la mairie. Inscriptions brocante en mairie avant le 5 septembre.",
      starts_at: new Date(now + 5 * 24 * h).toISOString(),
      ends_at: new Date(now + 13 * 24 * h).toISOString(),
      created_at: new Date(now - 1 * 24 * h).toISOString(),
    },
    {
      commune_id: commune.id,
      title: "💧 Coupure d'eau rue des Tilleuls — mardi 9h-13h",
      body: "Travaux de remplacement d'une vanne. Pensez à faire vos réserves d'eau la veille. Rétablissement prévu en début d'après-midi.",
      starts_at: new Date(now + 2 * 24 * h).toISOString(),
      ends_at: new Date(now + 2 * 24 * h + 4 * h).toISOString(),
      created_at: new Date(now - 2 * 24 * h).toISOString(),
    },
    {
      commune_id: commune.id,
      title: "🚧 Circulation alternée route de Vernon jusqu'au 20 septembre",
      body: "Réfection de la chaussée. Feux temporaires en journée, prévoir 5 minutes supplémentaires aux heures de pointe.",
      created_at: new Date(now - 4 * 24 * h).toISOString(),
    },
  ]);
  if (alErr) throw new Error("Alertes: " + alErr.message);
  
// ---------- Événements (agenda) ----------
await supabase.from("evenements").delete().eq("commune_id", commune.id);
const inDays = (d, h = 10) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
await supabase.from("evenements").insert([
  { commune_id: commune.id, author_id: null, organisateur_type: "mairie", organisateur_nom: "Mairie de Limetz-Villez", titre: "Fête du village 2026", description: "Repas champêtre, jeux pour enfants, bal populaire en soirée. Buvette tenue par le comité des fêtes.", starts_at: inDays(12, 11), lieu: "Place de la Mairie" },
  { commune_id: commune.id, author_id: null, organisateur_type: "mairie", organisateur_nom: "Mairie de Limetz-Villez", titre: "Réunion publique : aménagement de la rue des Vignes", description: "Présentation du projet de sécurisation et échanges avec les riverains.", starts_at: inDays(5, 19), lieu: "Salle des fêtes" },
  { commune_id: commune.id, author_id: null, organisateur_type: "mairie", organisateur_nom: "Mairie de Limetz-Villez", titre: "Marché de producteurs locaux", description: "Fromages, légumes, miel et pain des producteurs du Vexin.", starts_at: inDays(2, 9), lieu: "Parvis de l'église" },
]);
console.log("✓ 3 événements dans l'agenda");

// ---------- Associations et leurs événements ----------
{
  const assoUser = await getOrCreateUser("demo.comite.fetes@onseditout.fr", "Marie Fontaine");
  const assoUser2 = await getOrCreateUser("demo.foot.limetz@onseditout.fr", "David Morin");
  const assoUser3 = await getOrCreateUser("demo.ape.limetz@onseditout.fr", "Nathalie Costa");
  await supabase.from("profiles").upsert([
    { id: assoUser.id, full_name: "Marie Fontaine", commune_residence_id: commune.id },
    { id: assoUser2.id, full_name: "David Morin", commune_residence_id: commune.id },
    { id: assoUser3.id, full_name: "Nathalie Costa", commune_residence_id: commune.id },
  ]);
  await supabase.from("associations").delete().eq("commune_id", commune.id);
  const { data: assos } = await supabase.from("associations").insert([
    { user_id: assoUser.id, commune_id: commune.id, nom: "Comité des fêtes de Limetz-Villez", categorie: "fetes", rna: "W782001234", description: "Nous animons le village toute l'année : fête du village, chasse aux œufs, marché de Noël, feu de la Saint-Jean. Bénévoles bienvenus !", email: "comitedesfetes.limetz@gmail.com", is_verified: true },
    { user_id: assoUser2.id, commune_id: commune.id, nom: "FC Limetz-Villez", categorie: "sport", rna: "W782005678", description: "Club de football amateur, école de foot dès 6 ans, équipe seniors en D3. Entraînements mercredi et vendredi au stade municipal.", telephone: "06 21 43 65 87", is_verified: true },
    { user_id: assoUser3.id, commune_id: commune.id, nom: "APE de l'école des Tilleuls", categorie: "enfance", rna: "W782009012", description: "Association des parents d'élèves : kermesse, vente de sapins, financement des sorties scolaires.", email: "ape.tilleuls@gmail.com", is_verified: false },
  ]).select();
  const byNom = Object.fromEntries((assos ?? []).map((a) => [a.nom, a]));
  const inD = (d, h = 10) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  const ev = [];
  const cf = byNom["Comité des fêtes de Limetz-Villez"];
  const fc = byNom["FC Limetz-Villez"];
  const ape = byNom["APE de l'école des Tilleuls"];
  if (cf) ev.push({ commune_id: commune.id, author_id: cf.user_id, organisateur_type: "association", organisateur_nom: cf.nom, association_id: cf.id, titre: "Loto du comité des fêtes", description: "Nombreux lots : bons d'achat, électroménager, paniers garnis. Buvette et crêpes sur place. Ouverture des portes 19h.", starts_at: inD(9, 20), lieu: "Salle des fêtes" });
  if (fc) ev.push({ commune_id: commune.id, author_id: fc.user_id, organisateur_type: "association", organisateur_nom: fc.nom, association_id: fc.id, titre: "Portes ouvertes école de foot", description: "Séance d'essai gratuite pour les 6-12 ans, inscriptions sur place.", starts_at: inD(3, 14), lieu: "Stade municipal" });
  if (ape) ev.push({ commune_id: commune.id, author_id: ape.user_id, organisateur_type: "association", organisateur_nom: ape.nom, association_id: ape.id, titre: "Vide-grenier de l'APE", description: "Exposants 5 € le mètre, inscription par email. Restauration sur place.", starts_at: inD(20, 8), lieu: "Cour de l'école" });
  if (ev.length) await supabase.from("evenements").insert(ev);
  console.log(`✓ ${(assos ?? []).length} associations, ${ev.length} événements associatifs`);
}

// ---------- Avis clients sur les pros démo ----------
{
  const { data: prosList } = await supabase.from("pro_profiles").select("id, business_name").eq("base_commune_id", commune.id);
  const byName = Object.fromEntries((prosList ?? []).map((p) => [p.business_name, p.id]));
  const h = (i) => users[i % users.length].id;
  const avis = [
    ["L'Atelier Duval", 0, 5, "Cuisine posée en deux jours, finitions impeccables et chantier laissé propre. Je recommande sans hésiter."],
    ["L'Atelier Duval", 1, 5, "Très à l'écoute, devis clair, respecté au centime."],
    ["L'Atelier Duval", 2, 4, "Bon travail, un peu de retard sur la date de début mais prévenu à l'avance."],
    ["Taxi du Vexin", 3, 5, "Ponctuel à 5h du matin pour Roissy, véhicule nickel."],
    ["Taxi du Vexin", 4, 4, "Sérieux et sympathique. Tarif conventionné accepté sans souci."],
    ["Plomberie Rivière", 0, 5, "Dépannage un dimanche soir en 40 minutes. Sauvé !"],
    ["Plomberie Rivière", 5, 3, "Efficace mais tarif de déplacement un peu élevé."],
    ["SF Élec", 1, 5, "Mise aux normes du tableau électrique, explications claires, propre."],
    ["Les Jardins de Manon", 2, 5, "Massifs magnifiques, conseils précieux pour l'entretien."],
    ["Au Four du Village", 3, 5, "La meilleure baguette tradition du secteur, sans discussion."],
  ];
  const rows = avis.filter(([n]) => byName[n]).map(([n, hi, rating, body]) => ({ pro_id: byName[n], author_id: h(hi), rating, body }));
  if (rows.length) {
    await supabase.from("pro_reviews").delete().in("pro_id", Object.values(byName));
    await supabase.from("pro_reviews").insert(rows);
    // Réponse du pro sur un avis
    const { data: first } = await supabase.from("pro_reviews").select("id").eq("pro_id", byName["L'Atelier Duval"]).limit(1).single();
    if (first) await supabase.from("pro_reviews").update({ pro_reply: "Merci beaucoup, c'était un plaisir. À bientôt pour la salle de bain !", replied_at: new Date().toISOString() }).eq("id", first.id);
    console.log(`✓ ${rows.length} avis clients`);
  }
}

console.log("✓ 3 alertes officielles (dont 1 événement)");

  // --- Pro : L'Atelier Duval ---
  const proUser = await getOrCreateUser(PRO.email, PRO.name);
  await supabase.from("profiles").upsert({
    id: proUser.id,
    full_name: PRO.name,
    commune_residence_id: commune.id,
  });
  await supabase.from("pro_profiles").upsert({
    id: proUser.id,
    business_name: "L'Atelier Duval",
    siret: "88234567800017",
    siret_verified: true,
    tagline: "Menuiserie et petits travaux, dans votre village depuis 12 ans",
    description: "Pose de cuisine, dressing sur mesure, réparation de volets, petits travaux d'intérieur. Devis gratuit sous 48h.",
    subscription_status: "active",
    subscription_plan: "premium",
    base_commune_id: commune.id,
    telephone: "06 12 34 56 78",
    email: "contact@atelier-duval.fr",
  });
  const { error: pzErr } = await supabase.from("pro_zones").upsert({ pro_id: proUser.id, commune_id: commune.id });
  if (pzErr) console.log("⚠️ pro_zones Duval:", pzErr.message);
  await supabase.from("pro_services").delete().eq("pro_id", proUser.id);
  await supabase.from("pro_services").insert([
    { pro_id: proUser.id, label: "Pose de cuisine", price_from: 450, price_note: "selon configuration" },
    { pro_id: proUser.id, label: "Réparation de volets", price_from: 80, price_note: "déplacement inclus" },
    { pro_id: proUser.id, label: "Meuble sur mesure", price_from: 300, price_note: "sur devis" },
  ]);
  // Annonce sponsorisée du pro dans le fil
  await supabase.from("annonces").insert({
    author_id: proUser.id,
    commune_id: commune.id,
    category_id: cat["Services"],
    title: "🔨 L'Atelier Duval — menuiserie et petits travaux",
    description: "Artisan à Limetz-Villez : cuisine, dressing, volets, réparations. Devis gratuit sous 48h. SIRET vérifié.",
    statut: "disponible",
    is_sponsored: true,
    sponsored_until: new Date(now + 30 * 24 * h).toISOString(),
    created_at: new Date(now - 10 * h).toISOString(),
    expires_at: new Date(now + 30 * 24 * h).toISOString(),
  });
  console.log("✓ Pro « L'Atelier Duval » (vérifié, abonné, sponsorisé)");

  // --- Pros supplémentaires abonnés : 3 par pack ---
  const PROS_EXTRA = [
    // PREMIUM (bandeau haut de page, avec L'Atelier Duval déjà premium)
    {
      email: "demo.taxi.vexin@onseditout.fr", name: "Patrick Morel",
      business: "Taxi du Vexin", siret: "79345612800019", plan: "premium", tel: "06 45 78 12 30",
      tagline: "Taxi conventionné : gares, aéroports, transport médical",
      description: "Transport toutes distances 7j/7. Conventionné CPAM pour les transports médicaux assis. Réservation par téléphone.",
      services: [
        { label: "Course gare de Vernon", price_from: 18, price_note: "depuis Limetz" },
        { label: "Aéroport Roissy/Orly", price_from: 95, price_note: "forfait" },
        { label: "Transport médical", price_from: null, price_note: "conventionné CPAM" },
      ],
    },
    {
      email: "demo.boulangerie.four@onseditout.fr", name: "Nadia Bensaïd",
      business: "Au Four du Village", siret: "82217834500023", plan: "premium", tel: "01 30 42 15 62",
      tagline: "Boulangerie artisanale : pains spéciaux, commandes et livraison",
      description: "Pain au levain, viennoiseries maison, gâteaux sur commande. Livraison gratuite dans le village pour les personnes à mobilité réduite.",
      services: [
        { label: "Commande de gâteau", price_from: 22, price_note: "6 personnes" },
        { label: "Livraison à domicile", price_from: 0, price_note: "gratuite PMR" },
      ],
    },
    // VISIBILITÉ (sidebar, avec SF Élec)
    {
      email: "demo.elec.sonia@onseditout.fr", name: "Sonia Ferreira",
      business: "SF Élec", siret: "84329871600014", plan: "visibilite", tel: "06 78 90 12 34", mail: "sonia@sf-elec.fr",
      tagline: "Électricienne : dépannage, mise aux normes, bornes de recharge",
      description: "Dépannage rapide, remplacement de tableaux électriques, installation de bornes de recharge et interphones. Devis gratuit.",
      services: [
        { label: "Dépannage électrique", price_from: 70, price_note: "déplacement inclus" },
        { label: "Mise aux normes tableau", price_from: 450, price_note: "sur devis" },
        { label: "Borne de recharge", price_from: 890, price_note: "pose incluse" },
      ],
    },
    {
      email: "demo.plomberie.riviere@onseditout.fr", name: "Marc Rivière",
      business: "Plomberie Rivière", siret: "75412398700031", plan: "visibilite", tel: "06 11 22 33 44",
      tagline: "Plombier chauffagiste : fuites, chaudières, salles de bain",
      description: "Intervention rapide pour fuites et débouchages. Entretien de chaudières, rénovation de salles de bain clé en main.",
      services: [
        { label: "Recherche de fuite", price_from: 90, price_note: "déplacement inclus" },
        { label: "Entretien chaudière", price_from: 110, price_note: "contrat annuel" },
      ],
    },
    {
      email: "demo.coiffure.dom@onseditout.fr", name: "Émilie Vasseur",
      business: "Ciseaux à Domicile", siret: "88976234100012", plan: "visibilite", tel: "07 55 66 77 88",
      tagline: "Coiffeuse à domicile : coupes, couleurs, événements",
      description: "Je me déplace chez vous avec tout le matériel. Coupes homme, femme, enfant, couleurs et chignons de mariage.",
      services: [
        { label: "Coupe femme", price_from: 28, price_note: "à domicile" },
        { label: "Coupe homme/enfant", price_from: 15, price_note: "à domicile" },
      ],
    },
    // ESSENTIEL (section sous les annonces, avec Les Jardins de Manon)
    {
      email: "demo.jardins.manon@onseditout.fr", name: "Manon Girard",
      business: "Les Jardins de Manon", siret: "91456782300021", plan: "essentiel", tel: "06 99 88 77 66",
      tagline: "Paysagiste : entretien, taille, création de massifs",
      description: "Entretien régulier de jardins, taille de haies et d'arbustes, création de massifs et potagers.",
      services: [
        { label: "Entretien de jardin", price_from: 35, price_note: "de l'heure" },
        { label: "Taille de haie", price_from: 60, price_note: "selon longueur" },
      ],
    },
    {
      email: "demo.soutien.hugo@onseditout.fr", name: "Hugo Lambert",
      business: "Soutien Scolaire Hugo", siret: "90123785600017", plan: "essentiel", mail: "hugo.soutien@gmail.com",
      tagline: "Cours particuliers : maths et physique, collège-lycée",
      description: "Étudiant en école d'ingénieur, je donne des cours de maths et physique du collège à la terminale. Premier cours d'essai offert.",
      services: [
        { label: "Cours particulier 1h", price_from: 20, price_note: "chez vous" },
        { label: "Stage vacances 5x2h", price_from: 180, price_note: "forfait" },
      ],
    },
    {
      email: "demo.toilettage.wouaf@onseditout.fr", name: "Céline Dupré",
      business: "Wouaf & Co", siret: "85634219800026", plan: "essentiel", tel: "06 33 44 55 66",
      tagline: "Toilettage canin à domicile, tous gabarits",
      description: "Toilettage complet à domicile dans mon camion aménagé : bain, coupe, griffes. Doux avec les chiens anxieux.",
      services: [
        { label: "Toilettage petit chien", price_from: 35, price_note: "complet" },
        { label: "Toilettage grand chien", price_from: 55, price_note: "complet" },
      ],
    },
  ];

  for (const p of PROS_EXTRA) {
    const u = await getOrCreateUser(p.email, p.name);
    await supabase.from("profiles").upsert({
      id: u.id,
      full_name: p.name,
      commune_residence_id: commune.id,
    });
    const { error: ppErr } = await supabase.from("pro_profiles").upsert({
      id: u.id,
      business_name: p.business,
      siret: p.siret,
      siret_verified: true,
      tagline: p.tagline,
      description: p.description,
      subscription_status: "active",
      subscription_plan: p.plan,
      base_commune_id: commune.id,
      telephone: p.tel ?? null,
      email: p.mail ?? null,
    });
    if (ppErr) console.log(`⚠️ pro_profiles ${p.business}:`, ppErr.message);
    const { error: zErr } = await supabase.from("pro_zones").upsert({ pro_id: u.id, commune_id: commune.id });
    if (zErr) console.log(`⚠️ pro_zones ${p.business}:`, zErr.message);
    await supabase.from("pro_services").delete().eq("pro_id", u.id);
    await supabase.from("pro_services").insert(
      p.services.map((s) => ({ pro_id: u.id, ...s }))
    );
    console.log(`✓ Pro « ${p.business} » (${p.plan})`);
  }

  // --- Vigilance ---
  await supabase.from("vigilance_signalements").delete().eq("commune_id", commune.id);
  for (const u of users.slice(0, 4)) {
    await supabase.from("vigilance_members").upsert({ user_id: u.id, commune_id: commune.id });
  }
  const { error: vErr } = await supabase.from("vigilance_signalements").insert([
    {
      commune_id: commune.id,
      author_id: users[3].id,
      title: "Lampadaire en panne chemin du Lavoir",
      description: "Éteint depuis trois soirs, le passage est très sombre au niveau du n°12. Signalé aussi en mairie.",
      created_at: new Date(now - 20 * h).toISOString(),
    },
    {
      commune_id: commune.id,
      author_id: users[1].id,
      title: "Dépôt sauvage à l'entrée du chemin des Vignes",
      description: "Des gravats et un vieux matelas déposés ce week-end. Photo transmise à la mairie.",
      created_at: new Date(now - 2 * 24 * h).toISOString(),
    },
  ]);
  if (vErr) console.log("⚠️ Vigilance:", vErr.message);
  else console.log("✓ Vigilance : 4 membres, 2 signalements");

  // --- Compte agent mairie ---
  const mairieUser = await getOrCreateUser("demo.mairie@onseditout.fr", "Mairie de Limetz-Villez");
  await supabase.from("profiles").upsert({
    id: mairieUser.id,
    full_name: "Mairie de Limetz-Villez",
    commune_residence_id: commune.id,
  });
  const { error: agErr } = await supabase.from("commune_agents").upsert({
    user_id: mairieUser.id,
    commune_id: commune.id,
    role: "agent",
  });
  if (agErr) console.log("⚠️ Agent mairie:", agErr.message, "(table commune_agents créée ?)");
  else console.log("✓ Compte agent mairie : demo.mairie@onseditout.fr");

  // --- Coordonnées mairie ---
  const { error: coErr } = await supabase.from("mairie_coordonnees").upsert({
    commune_id: commune.id,
    adresse: "2 rue de la Mairie, 78270 Limetz-Villez",
    telephone: "01 30 42 08 33",
    email: "mairie.limetz-villez@wanadoo.fr",
    horaires: "Mar & Jeu 14h-18h, Sam 9h-12h",
    site_web: null,
  });
  if (coErr) console.log("⚠️ Coordonnées mairie:", coErr.message, "(table mairie_coordonnees créée ?)");
  else console.log("✓ Coordonnées mairie renseignées");

  console.log(`\n🎉 Démo prête : http://localhost:3000/${commune.slug}`);
  console.log(`   Connexion habitant démo : demo.sophie@onseditout.fr / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
