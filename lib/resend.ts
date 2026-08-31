import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "On se dit tout <bonjour@onseditout.fr>";

export async function sendWelcomeEmail(to: string, communeName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Bienvenue à ${communeName} 🎉`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
        <h1 style="color:#22223B;">Bienvenue sur On se dit tout !</h1>
        <p style="color:#5C5C72; line-height:1.6;">
          Votre commune de résidence est désormais <strong>${communeName}</strong>.
          Vous avez accès aux annonces locales, aux alertes de la mairie (si certifiée),
          et à la Vigilance de quartier réservée aux habitants.
        </p>
        <p style="color:#5C5C72; line-height:1.6;">
          Vous pouvez changer de ville à tout moment depuis le sélecteur en haut de l'app,
          sans perdre votre ville par défaut.
        </p>
      </div>
    `,
  });
}

export async function sendNewMessageEmail(
  to: string,
  fromName: string,
  annonceTitle: string,
  annonceUrl: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${fromName} vous a répondu sur "${annonceTitle}"`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
        <p style="color:#22223B;"><strong>${fromName}</strong> a répondu à votre annonce
        <strong>${annonceTitle}</strong>.</p>
        <a href="${annonceUrl}" style="display:inline-block; margin-top:12px; padding:12px 22px;
          background:#FF6B5B; color:#fff; border-radius:100px; text-decoration:none; font-weight:700;">
          Voir la conversation
        </a>
      </div>
    `,
  });
}

export async function sendVigilanceAlertEmail(
  to: string[],
  communeName: string,
  signalementTitle: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Nouveau signalement à ${communeName}`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
        <p style="color:#22223B;">Un habitant membre de la vigilance de <strong>${communeName}</strong> a publié :</p>
        <p style="color:#5C5C72; font-weight:600;">${signalementTitle}</p>
        <p style="font-size:12px; color:#8C2E28; background:#FBE4E2; padding:10px 14px; border-radius:10px;">
          🚨 En cas d'urgence réelle, composez toujours le 17 ou le 112.
          Ce réseau ne remplace jamais les secours.
        </p>
      </div>
    `,
  });
}

export async function sendCommuneCertifiedEmail(to: string, communeName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${communeName} est certifiée sur On se dit tout`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
        <p style="color:#22223B;">Votre abonnement mairie est actif.
        <strong>${communeName}</strong> affiche désormais le badge
        <strong>Commune certifiée</strong> et peut publier des alertes officielles
        visibles par tous les habitants.</p>
      </div>
    `,
  });
}
