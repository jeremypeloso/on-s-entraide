// Gabarit HTML commun à tous les emails transactionnels d'onseditout.fr.
// Compatible avec les principaux clients mail (tables, styles inline, largeur 560px).

const SITE = "https://onseditout.fr";
const INK = "#2B2440";
const CORAL = "#FF6B5B";
const CREAM = "#FFFAF4";

export function btn(href: string, label: string, color = CORAL) {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px;font-family:Arial,Helvetica,sans-serif;">${label}</a>`;
}

export function box(inner: string, bg = "#F7F6F3") {
  return `<div style="background:${bg};border-radius:14px;padding:14px 18px;margin:14px 0;font-size:15px;line-height:1.55;color:#4B4B5C;">${inner}</div>`;
}

export function layout({ title, preheader, body, footerNote }: { title: string; preheader?: string; body: string; footerNote?: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${CREAM};">
  <tr><td align="center" style="padding:28px 14px;">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
      <tr><td align="center" style="padding:0 0 18px;">
        <a href="${SITE}"><img src="${SITE}/logo-email.png" alt="onseditout.fr" height="44" style="height:44px;border:0;"></a>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:22px;padding:32px 30px;font-family:Arial,Helvetica,sans-serif;color:${INK};box-shadow:0 2px 12px rgba(43,36,64,0.06);">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${INK};">${title}</h1>
        <div style="font-size:15px;line-height:1.6;color:#4B4B5C;">${body}</div>
      </td></tr>
      <tr><td style="padding:22px 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8A8A99;text-align:center;">
        ${footerNote ? `<p style="margin:0 0 10px;">${footerNote}</p>` : ""}
        <p style="margin:0 0 10px;">🚨 En cas d'urgence réelle, composez le <strong>17</strong>, le <strong>15</strong> ou le <strong>112</strong>. On se dit tout ne remplace jamais les secours.</p>
        <p style="margin:0;">On se dit tout · <a href="${SITE}" style="color:#8A8A99;">onseditout.fr</a> · Tout ce qui se passe dans votre commune, au même endroit.<br>
        <a href="${SITE}/compte" style="color:#8A8A99;">Gérer mes notifications</a> · <a href="${SITE}/confidentialite" style="color:#8A8A99;">Confidentialité</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
