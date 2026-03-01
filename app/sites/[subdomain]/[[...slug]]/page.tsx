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
  const { data: website, error: wsError } = await supabaseServer
    .from("websites")
    .select("id, name, subdomain, branding_config, status")
    .eq("subdomain", subdomain)
    .single();

  if (wsError || !website) {
    console.log("[SiteRenderer] Website not found:", subdomain, wsError);
    return null;
  }

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

  const { data: deployment } = await supabaseServer
    .from("deployments")
    .select("id, snapshot_json")
    .eq("website_id", website.id)
    .eq("is_live", true)
    .order("deployed_at", { ascending: false })
    .limit(1)
    .single();

  let blocks: { type: string; props: Record<string, any> }[] = [];

  if (deployment?.snapshot_json) {
    const snapshotPages = deployment.snapshot_json.pages;
    let pageData = null;

    if (Array.isArray(snapshotPages)) {
      pageData = snapshotPages.find((p: { id: string }) => p.id === page.id);
    } else if (snapshotPages && typeof snapshotPages === "object") {
      pageData = snapshotPages[page.id];
    }

    if (pageData?.components) {
      blocks = pageData.components;
    }
  }

  if (blocks.length === 0) {
    const { data: components } = await supabaseServer
      .from("components")
      .select("id, component_type, content, order_key, is_locked")
      .eq("page_id", page.id)
      .eq("is_locked", false)
      .order("order_key", { ascending: true });

    blocks = (components ?? []).map((c) => ({
      type: c.component_type,
      props: c.content ?? {},
    }));
  }

  return {
    siteName: website.name,
    branding: website.branding_config ?? {},
    page: { title: page.title, blocks },
    websiteStatus: website.status,
  };
}

// ─── Component renderers ──────────────────────────────────────────────────────

function renderNavbar(
  props: Record<string, any>,
  siteName: string,
  colors: BrandColors
) {
  const links: { label: string; href: string }[] = Array.isArray(props.links) ? props.links : [];
  const logo = props.logo_text ?? props.brand ?? props.logo ?? siteName;

  return `
    <nav style="background:${colors.navBg};padding:0 40px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;box-shadow:0 1px 0 rgba(255,255,255,0.08);">
      <div style="font-weight:800;font-size:18px;color:#FFFFFF;letter-spacing:-0.3px;">${esc(logo)}</div>
      ${links.length > 0 ? `
        <div style="display:flex;align-items:center;gap:28px;">
          ${links.map((l) => `<a href="${esc(l.href ?? "#")}" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">${esc(l.label)}</a>`).join("")}
        </div>
      ` : ""}
    </nav>`;
}

function renderHero(props: Record<string, any>, colors: BrandColors) {
  const headline = props.headline ?? props.title ?? props.heading ?? "Welcome";
  const sub = props.subheadline ?? props.subtitle ?? props.subheading ?? props.description ?? "";
  const ctaText = props.ctaText ?? props.cta_text ?? props.buttonText ?? "";
  const ctaLink = props.ctaLink ?? props.cta_link ?? props.buttonLink ?? "#";
  const style = props.style ?? "centered";
  const isLeft = style === "left-aligned" || style === "split";

  return `
    <section style="background:${colors.bgLight};padding:80px 40px;">
      <div style="max-width:900px;margin:0 auto;text-align:${isLeft ? "left" : "center"};">
        <h1 style="font-size:clamp(40px,6vw,68px);font-weight:900;line-height:1.05;color:${colors.primary};margin:0 0 20px;">${esc(headline)}</h1>
        ${sub ? `<p style="font-size:18px;color:${colors.textSecondary};max-width:560px;line-height:1.7;margin:0 ${isLeft ? "0" : "auto"} 32px;">${esc(sub)}</p>` : ""}
        ${ctaText ? `
          <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:${isLeft ? "flex-start" : "center"};">
            <a href="${esc(ctaLink)}" style="display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 28px;background:${colors.primary};color:#FFFFFF;font-size:15px;font-weight:700;border-radius:100px;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${esc(ctaText)} →</a>
          </div>
        ` : ""}
      </div>
    </section>`;
}

function renderFeatures(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "Features";
  const subtitle = props.subtitle ?? props.description ?? "";
  const featureList: { icon?: string; title: string; description: string }[] = Array.isArray(props.features) ? props.features : [];
  const columns = props.columns ?? 3;
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const featureCards = featureList
    .map(
      (f) => `
      <div style="background:#FFFFFF;border:1px solid ${colors.border};border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="width:44px;height:44px;border-radius:12px;background:${colors.bgLight};display:flex;align-items:center;justify-content:center;font-size:20px;">✦</div>
        <h3 style="font-size:16px;font-weight:700;color:${colors.textPrimary};margin:0;">${esc(f.title)}</h3>
        <p style="font-size:14px;color:${colors.textSecondary};margin:0;line-height:1.65;">${esc(f.description)}</p>
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:52px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};max-width:520px;margin:0 auto;line-height:1.65;">${esc(subtitle)}</p>` : ""}
        </div>
        ${featureList.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:20px;">${featureCards}</div>` : ""}
      </div>
    </section>`;
}

function renderTestimonials(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "What Our Clients Say";
  const subtitle = props.subtitle ?? "";
  const list: { quote: string; author: string; role?: string }[] = Array.isArray(props.testimonials) ? props.testimonials : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const cards = list
    .map(
      (t) => `
      <div style="background:#FFFFFF;border:1px solid ${colors.border};border-radius:16px;padding:28px;display:flex;flex-direction:column;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <p style="font-size:15px;color:${colors.textPrimary};line-height:1.7;margin:0;">"${esc(t.quote)}"</p>
        <div>
          <p style="font-size:14px;font-weight:700;color:${colors.primary};margin:0;">${esc(t.author)}</p>
          ${t.role ? `<p style="font-size:13px;color:${colors.textSecondary};margin:4px 0 0;">${esc(t.role)}</p>` : ""}
        </div>
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:52px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};max-width:520px;margin:0 auto;">${esc(subtitle)}</p>` : ""}
        </div>
        ${list.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:20px;">${cards}</div>` : ""}
      </div>
    </section>`;
}

function renderPricing(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "Pricing";
  const subtitle = props.subtitle ?? "";
  const plans: { name: string; price: string; period?: string; features: string[]; highlighted?: boolean; ctaText?: string }[] = Array.isArray(props.plans) ? props.plans : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const planCards = plans
    .map(
      (p) => `
      <div style="background:#FFFFFF;border:2px solid ${p.highlighted ? colors.primary : colors.border};border-radius:20px;padding:32px 28px;display:flex;flex-direction:column;gap:0;position:relative;${p.highlighted ? `box-shadow:0 8px 32px rgba(0,0,0,0.12);transform:scale(1.03);` : ""}">
        ${p.highlighted ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:${colors.primary};color:#FFF;font-size:12px;font-weight:700;padding:4px 14px;border-radius:100px;">Most Popular</div>` : ""}
        <h3 style="font-size:18px;font-weight:800;color:${colors.textPrimary};margin:0 0 8px;">${esc(p.name)}</h3>
        <div style="font-size:38px;font-weight:900;color:${colors.primary};margin:0 0 20px;">${esc(p.price)}<span style="font-size:14px;font-weight:400;color:${colors.textSecondary};">${esc(p.period ?? "")}</span></div>
        <ul style="list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:10px;flex:1;">
          ${(p.features ?? []).map((f) => `<li style="font-size:14px;color:${colors.textSecondary};display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#3A9E8A;flex-shrink:0;"></span>${esc(f)}</li>`).join("")}
        </ul>
        <a href="#" style="display:block;text-align:center;padding:12px 0;background:${p.highlighted ? colors.primary : "transparent"};color:${p.highlighted ? "#FFF" : colors.primary};border:2px solid ${colors.primary};border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;">${esc(p.ctaText ?? "Get Started")}</a>
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:52px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};max-width:520px;margin:0 auto;">${esc(subtitle)}</p>` : ""}
        </div>
        ${plans.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:24px;align-items:start;">${planCards}</div>` : ""}
      </div>
    </section>`;
}

function renderCta(props: Record<string, any>, colors: BrandColors) {
  const headline = props.headline ?? props.title ?? "Ready to get started?";
  const sub = props.subheadline ?? props.subtitle ?? props.description ?? "";
  const btnText = props.buttonText ?? props.ctaText ?? props.cta_text ?? "Get Started";
  const btnLink = props.buttonLink ?? props.ctaLink ?? "#";

  return `
    <section style="background:${colors.primary};padding:80px 40px;">
      <div style="max-width:700px;margin:0 auto;text-align:center;">
        <h2 style="font-size:clamp(28px,4vw,48px);font-weight:900;color:#FFFFFF;margin:0 0 16px;line-height:1.1;">${esc(headline)}</h2>
        ${sub ? `<p style="font-size:17px;color:rgba(255,255,255,0.8);margin:0 0 32px;line-height:1.65;">${esc(sub)}</p>` : ""}
        <a href="${esc(btnLink)}" style="display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 32px;background:#FFFFFF;color:${colors.primary};font-size:15px;font-weight:800;border-radius:100px;text-decoration:none;">${esc(btnText)} →</a>
      </div>
    </section>`;
}

function renderStats(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "";
  const stats: { value: string; label: string; prefix?: string; suffix?: string }[] = Array.isArray(props.stats) ? props.stats : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const statItems = stats
    .map(
      (s) => `
      <div style="text-align:center;padding:24px;">
        <div style="font-size:48px;font-weight:900;color:${colors.primary};margin-bottom:8px;">${esc(s.prefix ?? "")}${esc(s.value)}${esc(s.suffix ?? "")}</div>
        <div style="font-size:15px;color:${colors.textSecondary};font-weight:500;">${esc(s.label)}</div>
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:64px 40px;">
      <div style="max-width:1000px;margin:0 auto;">
        ${title ? `<h2 style="font-size:clamp(24px,3vw,36px);font-weight:800;color:${colors.textPrimary};text-align:center;margin:0 0 40px;">${esc(title)}</h2>` : ""}
        <div style="display:flex;flex-wrap:wrap;justify-content:center;">${statItems}</div>
      </div>
    </section>`;
}

function renderTeam(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "Our Team";
  const subtitle = props.subtitle ?? "";
  const members: { name: string; role: string; bio?: string }[] = Array.isArray(props.members) ? props.members : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const memberCards = members
    .map(
      (m) => `
      <div style="background:#FFFFFF;border:1px solid ${colors.border};border-radius:16px;padding:28px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:${colors.primary}22;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:${colors.primary};margin:0 auto 16px;">${esc(m.name.charAt(0).toUpperCase())}</div>
        <h3 style="font-size:16px;font-weight:700;color:${colors.textPrimary};margin:0 0 4px;">${esc(m.name)}</h3>
        <p style="font-size:13px;color:${colors.primary};font-weight:600;margin:0 0 12px;">${esc(m.role)}</p>
        ${m.bio ? `<p style="font-size:14px;color:${colors.textSecondary};margin:0;line-height:1.6;">${esc(m.bio)}</p>` : ""}
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:52px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};max-width:520px;margin:0 auto;">${esc(subtitle)}</p>` : ""}
        </div>
        ${members.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:20px;">${memberCards}</div>` : ""}
      </div>
    </section>`;
}

function renderFaq(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "Frequently Asked Questions";
  const subtitle = props.subtitle ?? "";
  const questions: { question: string; answer: string }[] = Array.isArray(props.questions) ? props.questions : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const qItems = questions
    .map(
      (q, i) => `
      <div style="border-bottom:1px solid ${colors.border};padding:20px 0;">
        <h3 style="font-size:16px;font-weight:700;color:${colors.textPrimary};margin:0 0 10px;">${esc(q.question)}</h3>
        <p style="font-size:15px;color:${colors.textSecondary};margin:0;line-height:1.7;">${esc(q.answer)}</p>
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:760px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:48px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};margin:0 auto;">${esc(subtitle)}</p>` : ""}
        </div>
        <div>${qItems}</div>
      </div>
    </section>`;
}

function renderContactForm(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "Contact Us";
  const subtitle = props.subtitle ?? "";
  const fields: { name: string; type: string; required?: boolean }[] = Array.isArray(props.fields) ? props.fields : [];
  const submitText = props.submitText ?? "Send Message";
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const inputs = fields
    .map((f) =>
      f.type === "textarea"
        ? `<textarea placeholder="${esc(f.name)}" style="width:100%;padding:12px 16px;border:1px solid ${colors.border};border-radius:10px;font-size:15px;resize:vertical;min-height:120px;font-family:inherit;box-sizing:border-box;outline:none;color:${colors.textPrimary};background:#fff;"></textarea>`
        : `<input type="${esc(f.type ?? "text")}" placeholder="${esc(f.name)}" style="width:100%;padding:12px 16px;border:1px solid ${colors.border};border-radius:10px;font-size:15px;font-family:inherit;box-sizing:border-box;outline:none;color:${colors.textPrimary};background:#fff;" />`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:40px;">
          <h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(title)}</h2>
          ${subtitle ? `<p style="font-size:16px;color:${colors.textSecondary};margin:0 auto;">${esc(subtitle)}</p>` : ""}
        </div>
        <form style="display:flex;flex-direction:column;gap:16px;">
          ${inputs}
          <button type="submit" style="height:48px;background:${colors.primary};color:#FFF;border:none;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">${esc(submitText)}</button>
        </form>
      </div>
    </section>`;
}

function renderGallery(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? "";
  const images: { src: string; alt?: string; caption?: string }[] = Array.isArray(props.images) ? props.images : [];
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  const imgCards = images
    .map(
      (img) => `
      <div style="border-radius:12px;overflow:hidden;background:${colors.bgLight};">
        <img src="${esc(img.src ?? "/api/placeholder/400/300")}" alt="${esc(img.alt ?? "")}" style="width:100%;height:220px;object-fit:cover;display:block;" />
        ${img.caption ? `<p style="font-size:13px;color:${colors.textSecondary};padding:10px 14px;margin:0;">${esc(img.caption)}</p>` : ""}
      </div>`
    )
    .join("");

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1100px;margin:0 auto;">
        ${title ? `<h2 style="font-size:clamp(28px,4vw,44px);font-weight:800;color:${colors.textPrimary};text-align:center;margin:0 0 40px;">${esc(title)}</h2>` : ""}
        ${images.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:16px;">${imgCards}</div>` : ""}
      </div>
    </section>`;
}

function renderRichText(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? props.heading ?? "";
  const content = props.content ?? props.body ?? props.text ?? "";
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:760px;margin:0 auto;">
        ${title ? `<h2 style="font-size:clamp(28px,4vw,40px);font-weight:800;color:${colors.textPrimary};margin:0 0 20px;">${esc(title)}</h2>` : ""}
        ${content ? `<div style="font-size:16px;color:${colors.textSecondary};line-height:1.8;">${esc(content)}</div>` : ""}
      </div>
    </section>`;
}

function renderImageText(props: Record<string, any>, colors: BrandColors, bgIndex: number) {
  const title = props.title ?? props.heading ?? "";
  const content = props.content ?? props.description ?? props.text ?? "";
  const imageSrc = props.image ?? props.imageSrc ?? "/api/placeholder/600/400";
  const imageAlt = props.imageAlt ?? title;
  const imageRight = props.imagePosition === "right";
  const bg = bgIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";

  return `
    <section style="background:${bg};padding:80px 40px;">
      <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:48px;align-items:center;${imageRight ? "flex-direction:row-reverse;" : ""}">
        <img src="${esc(imageSrc)}" alt="${esc(imageAlt)}" style="width:100%;max-width:420px;border-radius:16px;object-fit:cover;flex:1;" />
        <div style="flex:1;min-width:260px;">
          ${title ? `<h2 style="font-size:clamp(28px,4vw,40px);font-weight:800;color:${colors.textPrimary};margin:0 0 16px;">${esc(title)}</h2>` : ""}
          ${content ? `<p style="font-size:16px;color:${colors.textSecondary};line-height:1.8;margin:0;">${esc(content)}</p>` : ""}
        </div>
      </div>
    </section>`;
}

function renderFooter(props: Record<string, any>, siteName: string, colors: BrandColors) {
  const copyright = props.copyright ?? `© ${new Date().getFullYear()} ${siteName}`;
  const links: { label: string; href: string }[] = Array.isArray(props.links) ? props.links : [];
  const columns: { title: string; links: { label: string; href: string }[] }[] = Array.isArray(props.columns) ? props.columns : [];

  const colHtml = columns.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:40px;margin-bottom:40px;justify-content:center;">
        ${columns.map((col) => `
          <div>
            <h4 style="font-size:13px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">${esc(col.title)}</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
              ${(col.links ?? []).map((l) => `<li><a href="${esc(l.href ?? "#")}" style="color:rgba(255,255,255,0.65);text-decoration:none;font-size:14px;">${esc(l.label)}</a></li>`).join("")}
            </ul>
          </div>`).join("")}
       </div>`
    : "";

  const linkHtml = links.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;margin-bottom:20px;">
        ${links.map((l) => `<a href="${esc(l.href ?? "#")}" style="color:rgba(255,255,255,0.65);text-decoration:none;font-size:14px;">${esc(l.label)}</a>`).join("")}
       </div>`
    : "";

  return `
    <footer style="background:${colors.navBg};padding:56px 40px 32px;text-align:center;">
      ${colHtml}
      ${linkHtml}
      <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0;">${esc(copyright)}</p>
    </footer>`;
}

// ─── Escape helper ────────────────────────────────────────────────────────────

function esc(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Brand colors ────────────────────────────────────────────────────────────

interface BrandColors {
  primary: string;
  bgLight: string;
  bgDark: string;
  textPrimary: string;
  textSecondary: string;
  navBg: string;
  border: string;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function TenantSitePage({ params }: SitePageProps) {
  const { subdomain, slug } = await params;
  const pagePath = slug ? `/${slug.join("/")}` : "/";

  const data = await getSiteData(subdomain, pagePath);

  if (!data) {
    notFound();
  }

  const branding = data.branding;
  const colors: BrandColors = {
    primary: branding.primary_color ?? "#8B1A1A",
    bgLight: branding.secondary_color ?? "#F5F5F5",
    bgDark: "#EBEBEB",
    textPrimary: branding.accent_color ?? "#0D0D0D",
    textSecondary: "#555555",
    navBg: branding.nav_color ?? "#111111",
    border: "#E0E0E0",
  };
  const fontFamily = branding.body_font ?? "Inter, system-ui, -apple-system, sans-serif";

  // Render all blocks to an HTML string
  let contentHtml = "";

  // Track section index for alternating backgrounds (skip navbar/footer)
  let sectionIndex = 0;

  for (const block of data.page.blocks) {
    const props = block.props ?? {};

    switch (block.type) {
      case "navbar":
        contentHtml += renderNavbar(props, data.siteName, colors);
        break;
      case "hero":
        contentHtml += renderHero(props, colors);
        sectionIndex++;
        break;
      case "features":
        contentHtml += renderFeatures(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "testimonials":
        contentHtml += renderTestimonials(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "pricing":
        contentHtml += renderPricing(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "cta":
        contentHtml += renderCta(props, colors);
        sectionIndex++;
        break;
      case "stats":
        contentHtml += renderStats(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "team":
        contentHtml += renderTeam(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "faq":
        contentHtml += renderFaq(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "contact_form":
        contentHtml += renderContactForm(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "gallery":
        contentHtml += renderGallery(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "rich_text":
        contentHtml += renderRichText(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "image_text":
        contentHtml += renderImageText(props, colors, sectionIndex);
        sectionIndex++;
        break;
      case "footer":
        contentHtml += renderFooter(props, data.siteName, colors);
        break;
      default:
        // Generic fallback for unknown block types
        {
          const heading = props.heading ?? props.title ?? block.type;
          const subheading = props.subheading ?? props.subtitle ?? props.description ?? "";
          const bg = sectionIndex % 2 === 0 ? colors.bgLight : "#FFFFFF";
          contentHtml += `
            <section style="background:${bg};padding:80px 40px;">
              <div style="max-width:760px;margin:0 auto;text-align:center;">
                <h2 style="font-size:32px;font-weight:800;color:${colors.textPrimary};margin:0 0 12px;">${esc(heading)}</h2>
                ${subheading ? `<p style="font-size:16px;color:${colors.textSecondary};line-height:1.7;">${esc(subheading)}</p>` : ""}
              </div>
            </section>`;
          sectionIndex++;
        }
        break;
    }
  }

  if (data.page.blocks.length === 0) {
    contentHtml = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;background:${colors.bgLight};text-align:center;">
        <h1 style="font-size:36px;font-weight:800;color:${colors.primary};margin:0 0 16px;">${esc(data.siteName)}</h1>
        <p style="font-size:18px;color:${colors.textSecondary};max-width:400px;">
          ${data.websiteStatus === "draft" ? "This website is currently being built. Check back soon!" : "Welcome! Content is coming soon."}
        </p>
      </div>`;
  }

  const globalStyles = `
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; padding: 0; font-family: ${fontFamily}; background: ${colors.bgLight}; color: ${colors.textPrimary}; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; display: block; }
    a { transition: opacity 0.2s; }
    a:hover { opacity: 0.85; }
    input:focus, textarea:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px ${colors.primary}22; }
    @media (max-width: 640px) { nav > div:last-child { display: none; } }
  `;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{data.page.title} — {data.siteName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </html>
  );
}
