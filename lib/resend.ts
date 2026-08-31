import { Resend } from "resend";
import { layout, btn, box } from "@/lib/email-layout";

// Initialisation paresseuse : le client n'est créé qu'au premier envoi
// (évite le plantage du build quand RESEND_API_KEY n'est pas définie).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquante");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL || "On se dit tout <bonjour@onseditout.fr>";
const SITE = "https://onseditout.fr";
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// ===== Bienvenue (après déclaration de la commune de résidence) =====
export async function sendWelcomeEmail(to: string, communeName: string, slug?: string) {
  const url = slug ? `${SITE}/${slug}` : SITE;
  return getResend().emails.send({
    from: FROM, to,
    subject: `Bienvenue à ${communeName} 🏡`,
    html: layout({
      title: `Bienvenue parmi les habitants de ${esc(communeName)} !`,
      preheader: "Votre commune vous attend : annonces, agenda, pros et mairie.",
      body: `
        <p>Vous venez de rejoindre la page de <strong>${esc(communeName)}</strong>. C'est ici que tout se dit : les annonces d'entraide entre habitants, l'agenda des associations, les professionnels vérifiés du secteur et les informations de la mairie.</p>
        ${box(`<strong>Pour bien commencer :</strong><br>
        📋 Publiez une première annonce (un objet à prêter, un coup de main, un trajet)<br>
        👀 Rejoignez la vigilance de quartier, réservée aux résidents<br>
        💬 Invitez vos voisins, tout part de là`)}
        <p style="text-align:center;margin:26px 0 6px;">${btn(url, `Voir la page de ${esc(communeName)}`)}</p>`,
    }),
  });
}

// ===== Nouveau message privé =====
export async function sendNewMessageEmail(to: string, fromName: string, annonceTitle: string, conversationUrl: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `${fromName} vous a écrit${annonceTitle ? ` · ${annonceTitle}` : ""}`,
    html: layout({
      title: `${esc(fromName)} vous a envoyé un message`,
      preheader: annonceTitle ? `À propos de « ${annonceTitle} »` : "Nouveau message privé sur On se dit tout",
      body: `
        <p><strong>${esc(fromName)}</strong> vous a écrit${annonceTitle ? ` au sujet de votre annonce <em>« ${esc(annonceTitle)} »</em>` : ""}. Répondez directement depuis votre messagerie, votre adresse email n'est jamais partagée.</p>
        <p style="text-align:center;margin:26px 0 6px;">${btn(conversationUrl, "Lire et répondre")}</p>`,
      footerNote: "Vous recevez au plus un email par conversation toutes les 30 minutes.",
    }),
  });
}

// ===== Question publique sur une annonce =====
export async function sendCommentNotificationEmail(to: string, fromName: string, annonceTitle: string, annonceId: string, excerpt: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `${fromName} a une question sur « ${annonceTitle} »`,
    html: layout({
      title: `Une question sur votre annonce`,
      preheader: excerpt.slice(0, 90),
      body: `
        <p><strong>${esc(fromName)}</strong> a posé une question publique sous <em>« ${esc(annonceTitle)} »</em> :</p>
        ${box(`« ${esc(excerpt)} »`)}
        <p>Votre réponse sera visible par tous les habitants, c'est souvent utile aux autres aussi.</p>
        <p style="text-align:center;margin:26px 0 6px;">${btn(`${SITE}/annonce/${annonceId}`, "Répondre")}</p>`,
      footerNote: "Vous pouvez désactiver ces emails dans votre compte.",
    }),
  });
}

// ===== Résumé quotidien de la commune =====
export async function sendDailyDigestEmail(to: string, communeName: string, slug: string, annonces: { title: string; id: string }[], evenements: { titre: string; starts_at: string; lieu: string | null }[]) {
  const a = annonces.map((x) => `<li style="margin:4px 0;"><a href="${SITE}/annonce/${x.id}" style="color:#E8503F;text-decoration:none;font-weight:600;">${esc(x.title)}</a></li>`).join("");
  const e = evenements.map((x) => `<li style="margin:4px 0;"><strong>${new Date(x.starts_at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</strong> · ${esc(x.titre)}${x.lieu ? ` <span style="color:#8A8A99;">— ${esc(x.lieu)}</span>` : ""}</li>`).join("");
  return getResend().emails.send({
    from: FROM, to,
    subject: `Quoi de neuf à ${communeName} aujourd'hui`,
    html: layout({
      title: `Quoi de neuf à ${esc(communeName)}`,
      preheader: `${annonces.length} annonce(s), ${evenements.length} événement(s) depuis hier.`,
      body: `
        ${annonces.length ? `<p style="margin:0 0 6px;font-weight:700;color:#2B2440;">📋 ${annonces.length} nouvelle${annonces.length > 1 ? "s" : ""} annonce${annonces.length > 1 ? "s" : ""}</p><ul style="margin:0 0 16px;padding-left:20px;">${a}</ul>` : ""}
        ${evenements.length ? `<p style="margin:0 0 6px;font-weight:700;color:#2B2440;">📅 ${evenements.length} nouvel${evenements.length > 1 ? "s" : ""} événement${evenements.length > 1 ? "s" : ""}</p><ul style="margin:0 0 16px;padding-left:20px;">${e}</ul>` : ""}
        <p style="text-align:center;margin:26px 0 6px;">${btn(`${SITE}/${slug}`, `Voir la page de ${esc(communeName)}`)}</p>`,
      footerNote: "Résumé envoyé en fin de journée uniquement quand il y a du nouveau. Désactivable dans votre compte.",
    }),
  });
}

// ===== Alerte vigilance de quartier =====
export async function sendVigilanceAlertEmail(to: string[], communeName: string, signalementTitle: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `👀 Vigilance ${communeName} : nouveau signalement`,
    html: layout({
      title: `Nouveau signalement à ${esc(communeName)}`,
      preheader: signalementTitle,
      body: `
        <p>Un résident membre de la vigilance de quartier a publié :</p>
        ${box(`<strong>${esc(signalementTitle)}</strong>`, "#FFF1EF")}
        <p>Consultez le signalement, ajoutez ce que vous avez vu, et restez factuel : pas de noms, pas d'accusations.</p>
        <p style="text-align:center;margin:26px 0 6px;">${btn(`${SITE}`, "Voir la vigilance de ma commune", "#DC2626")}</p>`,
    }),
  });
}

// ===== Commune certifiée =====
export async function sendCommuneCertifiedEmail(to: string, communeName: string, slug?: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `${communeName} est certifiée sur On se dit tout ✓`,
    html: layout({
      title: `${esc(communeName)} est maintenant certifiée`,
      preheader: "Votre espace mairie est ouvert.",
      body: `
        <p>La page de <strong>${esc(communeName)}</strong> affiche désormais le badge officiel. Depuis votre espace mairie, vous pouvez :</p>
        ${box(`📢 Publier des alertes et informations officielles<br>📅 Alimenter l'agenda municipal<br>🏛️ Renseigner les coordonnées et horaires de la mairie<br>🎭 Valoriser les associations de la commune`)}
        <p style="text-align:center;margin:26px 0 6px;">${btn(`${SITE}/mairie`, "Ouvrir mon espace mairie", "#4D8DFF")}</p>`,
    }),
  });
}
