import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/sesi", "/onboarding", "/riwayat", "/profil"];
const AUTH_PAGES = ["/login", "/daftar"];

// Next.js 16: middleware.ts berganti nama menjadi proxy.ts.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Pola resmi Supabase: perbarui cookie request DAN buat ulang response,
          // supaya Server Component di belakangnya membaca token yang sudah disegarkan.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() memvalidasi token ke server Auth; jangan pakai getSession() saja.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const matches = (list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && matches(PROTECTED)) {
    return redirectTo(request, response, "/login");
  }
  if (user && matches(AUTH_PAGES)) {
    return redirectTo(request, response, "/dashboard");
  }

  return response;
}

// Redirect tetap membawa cookie sesi yang baru disegarkan.
function redirectTo(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|ico|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
