import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendDailyDigestEmail } from "@/lib/resend";

// Résumé quotidien par commune : nouvelles annonces + nouveaux événements des dernières 24 h,
// envoyé aux résidents déclarés qui ont gardé l'option active. Déclenché par Vercel Cron.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [{ data: annonces }, { data: evenements }] = await Promise.all([
    db.from("annonces").select("id, title, commune_id").gte("created_at", since).eq("statut", "disponible"),
    db.from("evenements").select("titre, starts_at, lieu, commune_id").gte("created_at", since),
  ]);

  const byCommune: Record<string, { a: any[]; e: any[] }> = {};
  for (const x of annonces ?? []) (byCommune[x.commune_id] ??= { a: [], e: [] }).a.push(x);
  for (const x of evenements ?? []) (byCommune[x.commune_id] ??= { a: [], e: [] }).e.push(x);
  const communeIds = Object.keys(byCommune);
  if (communeIds.length === 0) return NextResponse.json({ ok: true, communes: 0, sent: 0 });

  const { data: communes } = await db.from("communes").select("id, nom, slug").in("id", communeIds);
  const { data: residents } = await db.from("profiles").select("id, commune_residence_id")
    .in("commune_residence_id", communeIds).neq("notif_digest", false);

  // Emails des résidents (API admin, paginée)
  const emails: Record<string, string> = {};
  let page = 1;
  while (true) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    for (const u of data.users) if (u.email) emails[u.id] = u.email;
    if (data.users.length < 1000) break;
    page++;
  }

  let sent = 0;
  for (const c of communes ?? []) {
    const content = byCommune[c.id];
    const targets = (residents ?? []).filter((r) => r.commune_residence_id === c.id && emails[r.id]);
    for (const r of targets) {
      try {
        await sendDailyDigestEmail(emails[r.id], c.nom, c.slug, content.a, content.e);
        sent++;
      } catch (e) { console.error("digest:", e); }
    }
  }
  return NextResponse.json({ ok: true, communes: communeIds.length, sent });
}
