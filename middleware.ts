import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Chemins toujours accessibles en maintenance
const ALWAYS_OPEN = ["/maintenance", "/admin", "/api/admin", "/connexion", "/api/", "/logo", "/og.png", "/icon.png", "/apple-icon.png"];

// Lecture du réglage maintenance, mise en cache 30 s (Next met en cache le fetch)
async function getMaintenance(): Promise<{ enabled: boolean; message: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_settings?key=eq.maintenance&select=value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 30 },
      }
    );
    const rows = await res.json();
    const v = rows?.[0]?.value ?? {};
    return { enabled: !!v.enabled, message: v.message ?? "" };
  } catch {
    return { enabled: false, message: "" };
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchit la session si besoin (obligatoire avec @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (ALWAYS_OPEN.some((p) => path.startsWith(p))) return response;

  const maintenance = await getMaintenance();
  if (maintenance.enabled) {
    // Les admins passent, pour vérifier le site pendant la maintenance
    let isAdmin = false;
    if (user) {
      const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      isAdmin = !!p?.is_admin;
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url, { status: 503 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};