export const runtime = 'experimental-edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Fallback hardcoded list — used only if the DB lookup fails (network error etc.)
// Keep at least one email here as a safety net
const FALLBACK_ADMIN_EMAILS = ["nbdotwork@gmail.com"];

const PUBLIC_ROUTES = [
  /^\/$/, 
  /^\/products/,
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/banners/,
  /^\/api\/reviews/,
  /^\/login/,
  /^\/checkout/,
  /^\/orders/,
  /^\/register/,
  /^\/search/,
  /^\/api\/search/,
  /^\/auth/,
  /^\/api\/auth/,
  /^\/api\/settings/, // settings must be public so the footer + navbar can read it
];

const ADMIN_ROUTES = [
  /^\/admin/,
  /^\/api\/admin/,
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(r => r.test(pathname));
}
function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(r => r.test(pathname));
}

// Fetch admin emails from the settings table.
// Uses the Supabase REST API directly (no SDK needed) so we don't bloat the edge bundle.
async function fetchAdminEmails(supabaseUrl: string, supabaseAnonKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/settings?key=eq.admin_emails&select=value`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        // edge cache for 60 seconds so we're not hitting the DB on every request
        // @ts-ignore — Next.js edge fetch supports this
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return FALLBACK_ADMIN_EMAILS;
    const rows = await res.json() as { value: string }[];
    if (!rows || rows.length === 0) return FALLBACK_ADMIN_EMAILS;
    const parsed = JSON.parse(rows[0].value) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : FALLBACK_ADMIN_EMAILS;
  } catch {
    return FALLBACK_ADMIN_EMAILS;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isAdminRoute(pathname)) {
    if (!user) return NextResponse.redirect(new URL('/', request.url));

    // Dynamically fetch admin emails from settings table
    const adminEmails = await fetchAdminEmails(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!adminEmails.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  if (!isPublicRoute(pathname) && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};