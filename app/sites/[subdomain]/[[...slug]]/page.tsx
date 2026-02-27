import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

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
 * tenant's website data + page components from the database and renders them.
 */

async function getSiteData(subdomain: string, slug: string) {
  // Find the website by subdomain
  const { data: website, error: wsError } = await supabaseServer
    .from("websites")
    .select("id, name, subdomain, branding_config, status")
    .eq("subdomain", subdomain)
    .single();

  if (wsError || !website) {
    console.log("[SiteRenderer] Website not found:", subdomain, wsError);
    return null;
  }

  // Find the page matching the slug (or homepage)
  let pageQuery = supabaseServer
    .from("pages")
    .select("id, title, slug, is_homepage")
    .eq("website_id", website.id);

  if (slug === "/") {
    pageQuery = pageQuery.eq("is_homepage", true);
  } else {
    pageQuery = pageQuery.eq("slug", slug);
  }

  const { data: page, error: pgError } = await pageQuery.single();
  
  if (pgError || !page) {
    console.log("[SiteRenderer] Page not found for website:", website.id, "slug:", slug, pgError);
    return null;
  }

  // Get the published deployment for this website
  const { data: deployment } = await supabaseServer
    .from("deployments")
    .select("id, snapshot_json")
    .eq("website_id", website.id)
    .eq("is_live", true)
    .order("deployed_at", { ascending: false })
    .limit(1)
    .single();

  // If a deployment snapshot exists, use it; otherwise fetch live components
  let blocks: { type: string; props: Record<string, any> }[] = [];

  if (deployment?.snapshot_json) {
    // Handle both array and object formats for pages in snapshot
    const snapshotPages = deployment.snapshot_json.pages;
    let pageData = null;
    
    if (Array.isArray(snapshotPages)) {
      // Pages stored as array - find by ID
      pageData = snapshotPages.find((p: { id: string }) => p.id === page.id);
    } else if (snapshotPages && typeof snapshotPages === 'object') {
      // Pages stored as object keyed by ID
      pageData = snapshotPages[page.id];
    }
    
    if (pageData?.components) {
      blocks = pageData.components;
    }
  }
  
  // Fallback: fetch components directly from the components table
  // Note: DB uses component_type (not type), content (not props), is_locked (not is_visible)
  if (blocks.length === 0) {
    const { data: components } = await supabaseServer
      .from("components")
      .select("id, component_type, content, order_key, is_locked")
      .eq("page_id", page.id)
      .eq("is_locked", false)  // is_locked=false means visible
      .order("order_key", { ascending: true });

    blocks = (components ?? []).map((c) => ({
      type: c.component_type,  // Map component_type -> type
      props: c.content ?? {},  // Map content -> props
    }));
  }

  return {
    siteName: website.name,
    branding: website.branding_config ?? {},
    page: { title: page.title, blocks },
    websiteStatus: website.status,
  };
}

export default async function TenantSitePage({ params }: SitePageProps) {
  const { subdomain, slug } = await params;
  const pagePath = slug ? `/${slug.join("/")}` : "/";

  const data = await getSiteData(subdomain, pagePath);

  if (!data) {
    notFound();
  }

  const branding = data.branding;
  const primaryColor = branding.primary_color ?? "#8B1A1A";
  const bgLight = branding.secondary_color ?? "#F5F5F5";
  const textColor = branding.accent_color ?? "#0D0D0D";
  const fontFamily = branding.body_font ?? "Inter, system-ui, sans-serif";

  return (
    <html lang="en">
      <head>
        <title>{data.page.title} — {data.siteName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily }}>
        {data.page.blocks.length === 0 ? (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            background: bgLight,
            color: textColor,
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, color: primaryColor }}>
              {data.siteName}
            </h1>
            <p style={{ fontSize: 18, color: '#666', maxWidth: 400 }}>
              {data.websiteStatus === 'draft' 
                ? 'This website is currently being built. Check back soon!'
                : 'Welcome! Content is coming soon.'}
            </p>
          </div>
        ) : (
          data.page.blocks.map((block, i) => {
          const props = block.props ?? {};
          const heading = props.heading ?? props.title ?? props.text ?? block.type;
          const subheading = props.subheading ?? props.subtitle ?? props.description ?? "";

          return (
            <section
              key={i}
              style={{
                padding: block.type === "navbar" ? "16px 32px" : "64px 32px",
                background:
                  block.type === "navbar"
                    ? textColor
                    : block.type === "footer"
                    ? textColor
                    : i % 2 === 0
                    ? bgLight
                    : "#FFFFFF",
                color: block.type === "navbar" || block.type === "footer" ? "#FFFFFF" : textColor,
                textAlign: block.type === "footer" ? "center" : undefined,
                borderBottom: block.type === "navbar" ? `1px solid ${primaryColor}` : undefined,
              }}
            >
              {block.type === "navbar" && (
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {props.brand ?? props.logo_text ?? data.siteName}
                </div>
              )}
              {block.type === "hero" && (
                <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                  <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, color: primaryColor }}>
                    {heading}
                  </h1>
                  {subheading && <p style={{ fontSize: 18, color: "#555" }}>{subheading}</p>}
                </div>
              )}
              {block.type === "footer" && (
                <p style={{ fontSize: 14, color: "#888" }}>
                  {props.text ?? `© ${new Date().getFullYear()} ${data.siteName}`}
                </p>
              )}
              {!["navbar", "hero", "footer"].includes(block.type) && (
                <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                  <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{heading}</h2>
                  {subheading && <p style={{ fontSize: 16, color: "#555" }}>{subheading}</p>}
                </div>
              )}
            </section>
          );
        })
        )}
      </body>
    </html>
  );
}
