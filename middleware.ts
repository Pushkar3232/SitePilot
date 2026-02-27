import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware for subdomain-based routing and authentication.
 *
 * SitePilot has two faces:
 *   1. SaaS Dashboard — app.sitepilot.io  (or localhost:3000 in dev)
 *   2. Public Tenant Sites — *.sitepilot.io  (or *.localhost:3000)
 *
 * When a request arrives on a tenant subdomain (e.g. beans-cafe.sitepilot.io)
 * we internally rewrite it to /sites/[subdomain]/[...slug] so Next.js can
 * render the public site.
 *
 * For dashboard routes, we also check authentication status.
 */

const APP_SUBDOMAINS = new Set(["app", "www", ""]);
const PROTECTED_PATHS = ["/dashboard", "/onboarding"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

// Create Supabase client for middleware
function createSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";
  const pathname = url.pathname;

  // Extract subdomain
  // Production: <subdomain>.sitepilot.io
  // Dev:        <subdomain>.localhost:3000
  // Vercel:     site-pilot-alpha.vercel.app (should NOT be treated as subdomain)
  let subdomain = "";

  // Only process subdomains for known domains (sitepilot.pushkarshinde.in and localhost)
  if (hostname.includes("sitepilot.pushkarshinde.in")) {
    const parts = hostname.split(".sitepilot.pushkarshinde.in");
    subdomain = parts[0]; // e.g. "beans-cafe" from "beans-cafe.sitepilot.pushkarshinde.in"
  } else if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    subdomain = parts[0]; // e.g. "beans-cafe" from "beans-cafe.localhost:3000"
  }
  // For Vercel domains (vercel.app, other domains), don't extract subdomain

  // If it's a tenant subdomain, rewrite to /sites/[subdomain]/[...slug]
  if (subdomain && !APP_SUBDOMAINS.has(subdomain)) {
    const path = pathname; // e.g. "/" or "/about"
    url.pathname = `/sites/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  // For main app domain, handle authentication
  if (!subdomain || APP_SUBDOMAINS.has(subdomain)) {
    try {
      // Check if user is accessing protected routes
      const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
      const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));

      if (isProtectedPath) {
        // Temporarily disable auth check to test login flow
        // TODO: Re-enable proper auth validation
        console.log('Protected path accessed:', pathname);
        
        // For now, let the request through and let the client-side handle auth
        return NextResponse.next();

        // Try to parse the Supabase session
        }

      // For auth paths (login, register), just let them through for now  
      if (isAuthPath) {
        return NextResponse.next();
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // On any error, let the request through
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (exclude auth endpoints from subdomain routing)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
