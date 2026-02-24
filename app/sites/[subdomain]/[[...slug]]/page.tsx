import { notFound } from "next/navigation";

interface SitePageProps {
  params: Promise<{
    subdomain: string;
    slug?: string[];
  }>;
}

/**
 * Public Tenant Site Renderer
 *
 * This page is the entry point for all tenant websites served at
 * <subdomain>.sitepilot.io. The middleware rewrites the request
 * to /sites/[subdomain]/[...slug] and this page fetches the
 * tenant's website data + page components from the API and renders them.
 */

// In production, this would fetch from:
//   GET /api/sites/:subdomain/pages/:slug
async function getSiteData(subdomain: string, slug: string) {
  // TODO: Replace with real API call
  // Simulated data for demonstration
  const mockSites: Record<string, { name: string; pages: Record<string, { title: string; blocks: { type: string; content: string }[] }> }> = {
    "john-portfolio-x7k2": {
      name: "John's Portfolio",
      pages: {
        "/": {
          title: "Home",
          blocks: [
            { type: "navbar", content: "John Doe" },
            { type: "hero", content: "Welcome to my portfolio" },
            { type: "features", content: "My skills and projects" },
            { type: "footer", content: "© 2026 John Doe" },
          ],
        },
        "/about": {
          title: "About",
          blocks: [
            { type: "navbar", content: "John Doe" },
            { type: "hero", content: "About Me" },
            { type: "footer", content: "© 2026 John Doe" },
          ],
        },
      },
    },
  };

  const site = mockSites[subdomain];
  if (!site) return null;

  const page = site.pages[slug] ?? null;
  if (!page) return null;

  return { siteName: site.name, page };
}

export default async function TenantSitePage({ params }: SitePageProps) {
  const { subdomain, slug } = await params;
  const pagePath = slug ? `/${slug.join("/")}` : "/";

  const data = await getSiteData(subdomain, pagePath);

  if (!data) {
    notFound();
  }

  return (
    <html lang="en">
      <head>
        <title>{data.page.title} — {data.siteName}</title>
      </head>
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        {data.page.blocks.map((block, i) => (
          <section
            key={i}
            style={{
              padding: block.type === "navbar" ? "16px 32px" : "64px 32px",
              background: block.type === "navbar" ? "#0D0D0D" : i % 2 === 0 ? "#F5F5F5" : "#FFFFFF",
              color: block.type === "navbar" ? "#FFFFFF" : "#0D0D0D",
              textAlign: block.type === "footer" ? "center" : undefined,
              borderBottom: block.type === "navbar" ? "1px solid #222" : undefined,
            }}
          >
            {block.type === "navbar" && (
              <div style={{ fontWeight: 700, fontSize: 18 }}>{block.content}</div>
            )}
            {block.type === "hero" && (
              <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>{block.content}</h1>
                <p style={{ fontSize: 18, color: "#555" }}>This is a preview of the published page.</p>
              </div>
            )}
            {block.type === "features" && (
              <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{block.content}</h2>
                <p style={{ fontSize: 16, color: "#555" }}>Feature blocks will render real component data here.</p>
              </div>
            )}
            {block.type === "footer" && (
              <p style={{ fontSize: 14, color: "#888" }}>{block.content}</p>
            )}
          </section>
        ))}
      </body>
    </html>
  );
}
