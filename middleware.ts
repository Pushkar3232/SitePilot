import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for subdomain-based routing.
 *
 * SitePilot has two faces:
 *   1. SaaS Dashboard — app.sitepilot.io  (or localhost:3000 in dev)
 *   2. Public Tenant Sites — *.sitepilot.io  (or *.localhost:3000)
 *
 * When a request arrives on a tenant subdomain (e.g. beans-cafe.sitepilot.io)
 * we internally rewrite it to /sites/[subdomain]/[...slug] so Next.js can
 * render the public site.
 */

const APP_SUBDOMAINS = new Set(["app", "www", ""]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";

  // Extract subdomain
  // Production: <subdomain>.sitepilot.io
  // Dev:        <subdomain>.localhost:3000
  let subdomain = "";

  if (hostname.includes(".")) {
    const parts = hostname.split(".");
    // Handle cases like "beans-cafe.localhost:3000" or "beans-cafe.sitepilot.io"
    if (hostname.includes("localhost")) {
      subdomain = parts[0]; // e.g. "beans-cafe"
    } else {
      // e.g. "beans-cafe.sitepilot.io" → subdomain = "beans-cafe"
      // e.g. "www.sitepilot.io" → subdomain = "www"
      subdomain = parts[0];
    }
  }

  // If it's the main app domain or no subdomain, let the request through normally
  if (!subdomain || APP_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  // Tenant subdomain detected — rewrite to /sites/[subdomain]/[...slug]
  const path = url.pathname; // e.g. "/" or "/about"

  url.pathname = `/sites/${subdomain}${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /*
   * Match all paths except:
   * - _next (Next.js internals)
   * - api   (API routes)
   * - static files (favicon, images, etc.)
   */
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*).*)"],
};
