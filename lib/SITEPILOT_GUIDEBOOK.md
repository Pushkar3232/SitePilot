# 🚀 SitePilot — Complete Project Guidebook
> AI-Powered Multi-Tenant Website Builder Platform  
> Version 1.0 | Full Build Reference

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Tenant Setup](#5-authentication--tenant-setup)
6. [Subdomain Routing](#6-subdomain-routing)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Subscription Plans & Stripe Payments](#8-subscription-plans--stripe-payments)
9. [AI Chatbot & JSON Generation](#9-ai-chatbot--json-generation)
10. [Atomic Component System](#10-atomic-component-system)
11. [Template Engine](#11-template-engine)
12. [Drag & Drop Builder](#12-drag--drop-builder)
13. [Branding & Asset Management (Cloudinary)](#13-branding--asset-management-cloudinary)
14. [Draft, Preview & Publish Workflow](#14-draft-preview--publish-workflow)
15. [Version Control](#15-version-control)
16. [Domain Management](#16-domain-management)
17. [Usage Monitoring & Analytics Dashboard](#17-usage-monitoring--analytics-dashboard)
18. [Tenant Lifecycle Management](#18-tenant-lifecycle-management)
19. [Real-Time Collaboration](#19-real-time-collaboration)
20. [API Routes Reference](#20-api-routes-reference)
21. [Environment Variables](#21-environment-variables)
22. [Build & Deployment Guide](#22-build--deployment-guide)
23. [Demo Flow Script](#23-demo-flow-script)
24. [Checklist — Feature Completion Tracker](#24-checklist--feature-completion-tracker)

---

## 1. Project Overview

### What Is SitePilot?

SitePilot is a **multi-tenant SaaS website builder** where each tenant (a business, restaurant, school, creator, etc.) can create and manage their own branded website — all running on a single shared infrastructure.

Think of it like Squarespace or Wix, but with:
- Full **tenant isolation** (your data never mixes with others)
- An **AI chatbot** that builds your site by asking questions
- **Plan-based feature gating** (Starter, Growth, Pro)
- **Subdomain routing** so every tenant gets `theirname.sitepilot.io`

### Core Problem It Solves

| Old Way | SitePilot Way |
|---|---|
| Manual onboarding by admin | Auto-onboarding with starter site |
| Flat permissions for all users | Role-based access per tenant |
| No AI assistance | Chatbot generates full layout JSON |
| One website per account | Multiple sites based on plan |
| No versioning | Last 20 versions with rollback |
| No usage tracking | Per-tenant analytics dashboard |

---

## 2. Tech Stack

### Final Chosen Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR for published sites + React SPA for builder |
| **Auth** | Firebase Auth | Best-in-class auth, easy JWT integration |
| **Database** | Supabase (PostgreSQL) | Relational data, RLS, real-time, free tier |
| **AI** | Claude API (`claude-sonnet-4-6`) | Best structured JSON output, reliable instruction following |
| **File Storage** | Cloudinary | Image CDN, transforms, free tier, easy SDK |
| **Payments** | Stripe | Industry standard, webhooks, Checkout, Customer Portal |
| **Deployment** | Vercel | Native Next.js support, wildcard domains, edge functions |
| **Drag & Drop** | `dnd-kit` | Modern, accessible, works well with React |
| **Fractional Indexing** | `fractional-indexing` npm | Efficient component ordering without full re-index |
| **Real-time Collab** | Supabase Realtime | Built-in, no extra service needed |
| **Styling** | Tailwind CSS | Utility-first, fast to build |
| **State Management** | Zustand | Lightweight, great for builder state |

### Why NOT Firestore for Main Data?

Firestore is a document database. This project is inherently **relational**:
- Tenants → Websites → Pages → Components (parent-child relationships)
- You need queries like: `WHERE tenant_id = X AND status = published ORDER BY created_at`
- Firestore would require deeply nested collections and multiple round trips for such queries

**Firebase Auth stays** — it handles login, session management, and JWT tokens excellently.  
**Firestore is replaced** by Supabase PostgreSQL for all application data.

---

## 3. Folder Structure

```
sitepilot/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth pages group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/page.tsx   # Post-registration setup
│   │
│   ├── (dashboard)/              # Tenant dashboard (requires auth)
│   │   ├── layout.tsx            # Dashboard shell with sidebar
│   │   ├── page.tsx              # Overview / home
│   │   ├── websites/
│   │   │   ├── page.tsx          # List all websites
│   │   │   └── [websiteId]/
│   │   │       ├── page.tsx      # Website overview
│   │   │       └── builder/
│   │   │           └── page.tsx  # THE MAIN BUILDER
│   │   ├── branding/page.tsx     # Colors, fonts, logo
│   │   ├── domains/page.tsx      # Domain management
│   │   ├── team/page.tsx         # Invite & manage users
│   │   ├── analytics/page.tsx    # Usage metrics
│   │   └── billing/page.tsx      # Stripe plans & payment
│   │
│   ├── sites/                    # Public tenant site renderer
│   │   └── [subdomain]/
│   │       └── [...slug]/
│   │           └── page.tsx      # Renders published site pages
│   │
│   └── api/                      # API Routes
│       ├── auth/
│       ├── tenants/
│       ├── websites/
│       ├── pages/
│       ├── components/
│       ├── ai/
│       ├── assets/
│       ├── deployments/
│       ├── domains/
│       ├── analytics/
│       └── webhooks/
│           └── stripe/
│
├── components/                   # Atomic UI component system
│   ├── atoms/                    # Smallest building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Icon/
│   │   └── Typography/
│   │
│   ├── molecules/                # Combinations of atoms
│   │   ├── FormField/
│   │   ├── Card/
│   │   ├── Dropdown/
│   │   ├── Modal/
│   │   └── Tooltip/
│   │
│   ├── organisms/                # Complex UI sections
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   ├── DataTable/
│   │   └── PlanCard/
│   │
│   └── site-blocks/              # Website builder components
│       ├── HeroBlock/
│       ├── NavbarBlock/
│       ├── FeaturesBlock/
│       ├── GalleryBlock/
│       ├── TestimonialsBlock/
│       ├── ContactFormBlock/
│       ├── PricingBlock/
│       ├── FooterBlock/
│       └── CTABlock/
│
├── lib/                          # Core logic and utilities
│   ├── supabase.ts               # Supabase client + server helpers
│   ├── firebase.ts               # Firebase Auth init
│   ├── stripe.ts                 # Stripe client
│   ├── cloudinary.ts             # Cloudinary config
│   ├── claude.ts                 # Claude API wrapper
│   ├── rbac.ts                   # Permission checker
│   ├── plan-limits.ts            # Plan enforcement helpers
│   └── fractional-index.ts      # Component ordering utility
│
├── middleware.ts                  # Subdomain routing logic
├── hooks/                        # Custom React hooks
├── store/                        # Zustand stores (builder state, etc.)
├── types/                        # TypeScript type definitions
├── utils/                        # Generic helpers
└── constants/                    # Plan configs, component types, etc.
```

---

## 4. Database Schema

> All tables live in Supabase PostgreSQL. Row-Level Security (RLS) is enabled on every tenant-specific table.

### Full Schema

```sql
-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                         -- 'Starter', 'Growth', 'Pro'
  max_websites INT NOT NULL DEFAULT 1,
  max_pages_per_site INT NOT NULL DEFAULT 5,
  storage_limit_mb INT NOT NULL DEFAULT 100,
  ai_credits_per_month INT NOT NULL DEFAULT 10,
  custom_domain_allowed BOOLEAN DEFAULT FALSE,
  max_collaborators INT NOT NULL DEFAULT 1,
  price_monthly_cents INT NOT NULL DEFAULT 0,
  stripe_price_id TEXT                        -- Stripe price ID for this plan
);

-- Seed plans
INSERT INTO plans VALUES
  (gen_random_uuid(), 'Starter', 1, 5, 100, 10, false, 1, 0, 'price_starter_xxx'),
  (gen_random_uuid(), 'Growth', 3, 20, 500, 50, true, 5, 1900, 'price_growth_xxx'),
  (gen_random_uuid(), 'Pro', 10, 100, 2000, 200, true, 20, 4900, 'price_pro_xxx');


-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                  -- used for subdomain: slug.sitepilot.io
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'active'                -- 'active' | 'suspended' | 'offboarded'
    CHECK (status IN ('active', 'suspended', 'offboarded')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,          -- Links to Firebase Auth
  email TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor'
    CHECK (role IN ('owner', 'admin', 'editor', 'developer', 'viewer')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- WEBSITES TABLE
-- ============================================
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,                      -- e.g. 'myrestaurant' → myrestaurant.sitepilot.io
  custom_domain TEXT UNIQUE,                  -- e.g. 'www.myrestaurant.com'
  domain_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  branding_config JSONB DEFAULT '{}'::jsonb,  -- colors, fonts, logo
  favicon_url TEXT,
  seo_default JSONB DEFAULT '{}'::jsonb,      -- default title/description/og
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- PAGES TABLE
-- ============================================
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,                         -- e.g. '/', '/about', '/contact'
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  seo_meta JSONB DEFAULT '{}'::jsonb,
  nav_order INT DEFAULT 0,                    -- position in navigation
  is_home BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, slug)
);


-- ============================================
-- COMPONENTS TABLE (per page)
-- ============================================
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                         -- 'hero', 'navbar', 'gallery', etc.
  props JSONB NOT NULL DEFAULT '{}'::jsonb,   -- all component data/content
  order_key TEXT NOT NULL,                    -- fractional index for ordering
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- DEPLOYMENTS (version snapshots on publish)
-- ============================================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  deployed_by UUID REFERENCES users(id),
  snapshot_json JSONB NOT NULL,               -- full page tree at deploy time
  is_live BOOLEAN DEFAULT FALSE,              -- only one can be live at a time
  deployed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- PAGE VERSIONS (auto-saved draft history)
-- ============================================
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  content_snapshot JSONB NOT NULL,            -- components array at save time
  saved_by UUID REFERENCES users(id),
  label TEXT,                                 -- optional label like 'Before redesign'
  saved_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ASSETS (Cloudinary references)
-- ============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  size_bytes INT NOT NULL DEFAULT 0,
  asset_type TEXT DEFAULT 'image'
    CHECK (asset_type IN ('image', 'video', 'font', 'document')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- AI USAGE LOG
-- ============================================
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action_type TEXT,                           -- 'generate_layout', 'suggest_copy', 'seo_optimize'
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- USAGE METRICS (daily aggregated)
-- ============================================
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  bandwidth_mb FLOAT DEFAULT 0,
  UNIQUE(website_id, date)
);


-- ============================================
-- DOMAIN VERIFICATIONS
-- ============================================
CREATE TABLE domain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cname_target TEXT NOT NULL,                 -- what user should point their CNAME to
  verified BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Example policy (repeat for each table):
CREATE POLICY tenant_isolation ON websites
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## 5. Authentication & Tenant Setup

### Flow Overview

```
User visits /register
    ↓
Fills: name, email, password, organization name, picks plan
    ↓
Firebase Auth creates user → returns Firebase UID + JWT
    ↓
App calls POST /api/tenants/onboard
    ↓
Backend creates: tenant + user + starter website + starter page
    ↓
Stripe customer created (even on free plan, for future upgrades)
    ↓
Redirect to /onboarding (AI chatbot to fill in first website details)
```

### Firebase Auth Setup

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
```

### JWT Verification in API Routes

```typescript
// lib/auth-server.ts
import { adminAuth } from './firebase-admin';
import { supabase } from './supabase';

export async function verifyRequestAndGetUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No token');

  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);

  // Fetch user from Supabase using firebase_uid
  const { data: user } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('firebase_uid', decoded.uid)
    .single();

  if (!user) throw new Error('User not found');
  return user;
}
```

### Onboarding API

```typescript
// app/api/tenants/onboard/route.ts
export async function POST(req: Request) {
  const { orgName, planId, firebaseUid, email } = await req.json();

  const slug = slugify(orgName) + '-' + nanoid(4); // e.g. "pizza-palace-x7k2"

  // 1. Create tenant
  const { data: tenant } = await supabase.from('tenants').insert({
    name: orgName, slug, plan_id: planId, status: 'active'
  }).select().single();

  // 2. Create owner user
  await supabase.from('users').insert({
    firebase_uid: firebaseUid, email,
    tenant_id: tenant.id, role: 'owner'
  });

  // 3. Create starter website
  const { data: website } = await supabase.from('websites').insert({
    tenant_id: tenant.id,
    name: `${orgName} Website`,
    subdomain: slug,
    status: 'draft',
    branding_config: DEFAULT_BRANDING
  }).select().single();

  // 4. Create default homepage
  await supabase.from('pages').insert({
    website_id: website.id,
    title: 'Home', slug: '/',
    status: 'draft', is_home: true, nav_order: 0
  });

  // 5. Create Stripe customer
  const customer = await stripe.customers.create({ email, name: orgName });
  await supabase.from('subscriptions').insert({
    tenant_id: tenant.id,
    stripe_customer_id: customer.id,
    status: 'active'
  });

  return Response.json({ tenant, website });
}
```

---

## 6. Subdomain Routing

This makes every tenant's site accessible at `tenantslug.sitepilot.io`.

### Step 1: Vercel Wildcard Domain

In your Vercel project settings → Domains → add `*.sitepilot.io` and `sitepilot.io`.

### Step 2: Next.js Middleware

```typescript
// middleware.ts (root of project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Split host: "pizza-palace.sitepilot.io" → "pizza-palace"
  const [subdomain, ...rest] = host.split('.');
  const rootDomain = rest.join('.');

  // Only intercept tenant subdomains (not www or app)
  if (
    rootDomain === 'sitepilot.io' &&
    subdomain !== 'www' &&
    subdomain !== 'app'
  ) {
    // Rewrite to /sites/[subdomain]/[...slug]
    url.pathname = `/sites/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Step 3: Tenant Site Renderer

```typescript
// app/sites/[subdomain]/[...slug]/page.tsx
import { supabase } from '@/lib/supabase';
import { PageRenderer } from '@/components/site-blocks/PageRenderer';

export default async function TenantSitePage({
  params
}: {
  params: { subdomain: string; slug: string[] }
}) {
  const pageSlug = '/' + (params.slug?.join('/') || '');

  // Fetch tenant by subdomain
  const { data: website } = await supabase
    .from('websites')
    .select('*, tenants(*)')
    .eq('subdomain', params.subdomain)
    .eq('status', 'published')
    .single();

  if (!website) return <div>Site not found</div>;

  // Fetch the latest live deployment snapshot
  const { data: deployment } = await supabase
    .from('deployments')
    .select('snapshot_json')
    .eq('website_id', website.id)
    .eq('is_live', true)
    .single();

  if (!deployment) return <div>No published content yet</div>;

  const page = deployment.snapshot_json.pages?.find(
    (p: any) => p.slug === pageSlug
  );

  return (
    <PageRenderer
      components={page?.components || []}
      branding={website.branding_config}
    />
  );
}
```

---

## 7. Role-Based Access Control (RBAC)

### Permission Matrix

| Action | Owner | Admin | Editor | Developer | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage billing & plan | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete tenant / account | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite / remove users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage domains | ✅ | ✅ | ❌ | ✅ | ❌ |
| Publish website | ✅ | ✅ | ❌ | ✅ | ❌ |
| Edit content & pages | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create new pages | ✅ | ✅ | ✅ | ✅ | ❌ |
| Use AI builder | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload assets | ✅ | ✅ | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| View website | ✅ | ✅ | ✅ | ✅ | ✅ |

### Implementation

```typescript
// lib/rbac.ts
export const PERMISSIONS = {
  manage_billing: ['owner'],
  invite_users: ['owner', 'admin'],
  manage_domains: ['owner', 'admin', 'developer'],
  publish_website: ['owner', 'admin', 'developer'],
  edit_content: ['owner', 'admin', 'editor', 'developer'],
  upload_assets: ['owner', 'admin', 'editor', 'developer'],
  use_ai: ['owner', 'admin', 'editor', 'developer'],
  view_analytics: ['owner', 'admin', 'editor', 'developer', 'viewer'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(userRole: string, action: Permission): boolean {
  return (PERMISSIONS[action] as readonly string[]).includes(userRole);
}

// Middleware for API routes
export function requirePermission(action: Permission) {
  return async (req: Request, user: any) => {
    if (!hasPermission(user.role, action)) {
      throw new Error(`Permission denied: '${user.role}' cannot '${action}'`);
    }
  };
}
```

### Frontend Permission Guard

```tsx
// components/atoms/PermissionGate.tsx
export function PermissionGate({
  action,
  children,
  fallback = null
}: {
  action: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!hasPermission(user.role, action)) return <>{fallback}</>;
  return <>{children}</>;
}

// Usage:
<PermissionGate action="publish_website">
  <PublishButton />
</PermissionGate>
```

---

## 8. Subscription Plans & Stripe Payments

### Plan Config

```typescript
// constants/plans.ts
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    max_websites: 1,
    max_pages_per_site: 5,
    storage_limit_mb: 100,
    ai_credits_per_month: 10,
    custom_domain_allowed: false,
    max_collaborators: 1,
  },
  growth: {
    name: 'Growth',
    price: 19,
    max_websites: 3,
    max_pages_per_site: 20,
    storage_limit_mb: 500,
    ai_credits_per_month: 50,
    custom_domain_allowed: true,
    max_collaborators: 5,
  },
  pro: {
    name: 'Pro',
    price: 49,
    max_websites: 10,
    max_pages_per_site: 100,
    storage_limit_mb: 2000,
    ai_credits_per_month: 200,
    custom_domain_allowed: true,
    max_collaborators: 20,
  },
};
```

### Plan Limit Enforcement

```typescript
// lib/plan-limits.ts
export async function enforceLimits(
  tenantId: string,
  action: 'create_website' | 'create_page' | 'upload_asset' | 'use_ai',
  extra?: { fileSizeBytes?: number; websiteId?: string }
) {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, plans(*)')
    .eq('id', tenantId)
    .single();

  const plan = tenant.plans;

  switch (action) {
    case 'create_website': {
      const count = await supabase
        .from('websites')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .neq('status', 'archived');
      if ((count.count || 0) >= plan.max_websites)
        throw new PlanLimitError(`Your ${plan.name} plan allows ${plan.max_websites} website(s). Upgrade to add more.`);
      break;
    }
    case 'create_page': {
      const count = await supabase
        .from('pages')
        .select('id', { count: 'exact' })
        .eq('website_id', extra?.websiteId);
      if ((count.count || 0) >= plan.max_pages_per_site)
        throw new PlanLimitError(`Your plan allows ${plan.max_pages_per_site} pages per site.`);
      break;
    }
    case 'upload_asset': {
      const result = await supabase.rpc('get_tenant_storage_mb', { tid: tenantId });
      const currentMb = result.data || 0;
      const incomingMb = (extra?.fileSizeBytes || 0) / (1024 * 1024);
      if (currentMb + incomingMb > plan.storage_limit_mb)
        throw new PlanLimitError(`Storage limit of ${plan.storage_limit_mb}MB exceeded.`);
      break;
    }
    case 'use_ai': {
      const count = await supabase
        .from('ai_usage_log')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', getStartOfMonth());
      if ((count.count || 0) >= plan.ai_credits_per_month)
        throw new PlanLimitError(`AI credits exhausted for this month. Upgrade for more.`);
      break;
    }
  }
}
```

### Stripe Integration

```typescript
// app/api/billing/create-checkout/route.ts
export async function POST(req: Request) {
  const user = await verifyRequestAndGetUser(req);
  const { planPriceId } = await req.json();

  await requirePermission('manage_billing')(req, user);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.tenants.stripe_customer_id,
    line_items: [{ price: planPriceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.APP_URL}/dashboard/billing`,
    metadata: { tenant_id: user.tenant_id }
  });

  return Response.json({ url: session.url });
}


// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Webhook signature failed', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const newPlanId = await getPlanIdByStripePrice(priceId);

      await supabase
        .from('tenants')
        .update({ plan_id: newPlanId })
        .eq('stripe_customer_id', sub.customer);

      await supabase
        .from('subscriptions')
        .update({ status: sub.status })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      // Revert tenant to free Starter plan
      const starterPlan = await getStarterPlan();
      await supabase
        .from('tenants')
        .update({ plan_id: starterPlan.id })
        .eq('stripe_customer_id', event.data.object.customer);
      break;
    }
    case 'invoice.payment_failed': {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', event.data.object.customer);
      break;
    }
  }

  return Response.json({ received: true });
}
```

---

## 9. AI Chatbot & JSON Generation

### Chatbot Conversation Flow

```
Step 1: User picks a category
  → Restaurant | Portfolio | Business | E-commerce | Blog | Landing Page

Step 2: Chatbot asks 5 targeted questions
  Q1: "What's your business/brand name?"
  Q2: "Describe what you do in one sentence."
  Q3: "What's the vibe? (Modern & Minimal / Bold & Colorful / Classic & Elegant)"
  Q4: "What pages do you need? (Home / About / Contact / Gallery / Pricing)"
  Q5: "Drop your logo if you have one — or skip for now."

Step 3: User confirms → "Generate My Website"

Step 4: Single Claude API call with all answers

Step 5: Claude returns TWO JSON objects:
  → content.json  (all text: headings, descriptions, CTA labels, nav items)
  → config.json   (colors, fonts, component list, visibility flags)

Step 6: Merge with template base → render in builder instantly
```

### Claude API Call

```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function generateWebsiteFromPrompt(answers: {
  category: string;
  businessName: string;
  description: string;
  vibe: string;
  pages: string[];
}) {
  const systemPrompt = `You are a website layout generator for a SaaS website builder.
You MUST return ONLY a valid JSON object with exactly two keys: "content" and "config".
Do NOT include any explanation, markdown, or text outside the JSON.

The "content" key contains all text content.
The "config" key contains all visual/layout configuration.

Schema:
{
  "content": {
    "siteName": string,
    "tagline": string,
    "navbar": { "links": [{ "label": string, "href": string }] },
    "hero": { "heading": string, "subheading": string, "ctaLabel": string, "ctaHref": string },
    "features": { "heading": string, "items": [{ "icon": string, "title": string, "description": string }] },
    "about": { "heading": string, "body": string },
    "contact": { "heading": string, "email": string, "phone": string },
    "footer": { "copyright": string, "links": [{ "label": string, "href": string }] }
  },
  "config": {
    "colors": { "primary": string, "secondary": string, "background": string, "text": string, "accent": string },
    "fonts": { "heading": string, "body": string },
    "components": ["navbar", "hero", "features", "about", "contact", "footer"],
    "layout": { "heroStyle": "centered|left-aligned|full-bleed", "navStyle": "sticky|static" }
  }
}`;

  const userPrompt = `
Business Category: ${answers.category}
Business Name: ${answers.businessName}
Description: ${answers.description}
Visual Vibe: ${answers.vibe}
Required Pages: ${answers.pages.join(', ')}

Generate a complete website configuration for this business.
`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Clean up any accidental markdown fences
  const clean = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
```

### AI Credit Deduction

```typescript
// After every Claude API call:
await supabase.from('ai_usage_log').insert({
  tenant_id: tenantId,
  user_id: userId,
  action_type: 'generate_layout',
  prompt_tokens: response.usage.input_tokens,
  completion_tokens: response.usage.output_tokens,
});
```

---

## 10. Atomic Component System

### Structure Rules

- **Atoms** — Cannot be broken down further. No business logic. Pure UI only.
- **Molecules** — 2-3 atoms working together. May have local state.
- **Organisms** — Full sections of the UI. May call hooks.
- **Site Blocks** — The actual website sections rendered in the builder and on published sites.

### Example Atom — Button

```tsx
// components/atoms/Button/Button.tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  children
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
}
```

### Site Block — Hero

Every site block receives `props` (from the JSON) and an optional `isEditing` flag.

```tsx
// components/site-blocks/HeroBlock/HeroBlock.tsx
type HeroProps = {
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage?: string;
  style?: 'centered' | 'left-aligned';
};

export function HeroBlock({ props, isEditing }: { props: HeroProps; isEditing?: boolean }) {
  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center"
      style={{ backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined }}
    >
      <div className="text-center max-w-3xl px-6">
        <h1 className="text-5xl font-bold text-[var(--color-text)] mb-4">
          {props.heading}
        </h1>
        <p className="text-xl text-[var(--color-text)] opacity-80 mb-8">
          {props.subheading}
        </p>
        <a href={props.ctaHref} className="btn-primary">
          {props.ctaLabel}
        </a>
      </div>
    </section>
  );
}
```

---

## 11. Template Engine

### Template Structure

A template is a JSON object that defines the initial state of a website before customization.

```typescript
// constants/templates.ts
export const TEMPLATES = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    thumbnail: '/templates/restaurant.png',
    pages: [
      {
        title: 'Home', slug: '/', is_home: true,
        components: [
          { type: 'navbar', order_key: 'a', props: { logo: '', links: [{ label: 'Menu', href: '/menu' }, { label: 'Contact', href: '/contact' }] } },
          { type: 'hero', order_key: 'b', props: { heading: 'Welcome to [Name]', subheading: 'Fresh, local ingredients. Every single day.', ctaLabel: 'View Menu', ctaHref: '/menu' } },
          { type: 'features', order_key: 'c', props: { heading: 'Why Choose Us', items: [/* ... */] } },
          { type: 'gallery', order_key: 'd', props: { images: [] } },
          { type: 'footer', order_key: 'e', props: { copyright: '© 2025 [Name]' } },
        ]
      }
    ]
  },
  portfolio: { /* ... */ },
  startup: { /* ... */ },
};
```

### Template Picker UI

Show cards with thumbnail previews. On selection → load template JSON into the builder state. If AI generation was used → override template JSON with AI output.

---

## 12. Drag & Drop Builder

### Library: `dnd-kit`

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Fractional Indexing for Order

```bash
npm install fractional-indexing
```

```typescript
import { generateKeyBetween } from 'fractional-indexing';

// Inserting a new component between components at 'a' and 'b':
const newKey = generateKeyBetween('a', 'b'); // returns 'a5' or similar

// Prepend (before first):
const firstKey = generateKeyBetween(null, existingFirstKey);

// Append (after last):
const lastKey = generateKeyBetween(existingLastKey, null);
```

**Why:** When a user drags component B between A and C, you only update B's `order_key`. You don't have to rewrite every other component's index. One DB write per drag.

### Builder Store (Zustand)

```typescript
// store/builder.ts
import { create } from 'zustand';

interface BuilderState {
  components: Component[];
  selectedComponentId: string | null;
  isDirty: boolean;  // unsaved changes flag
  setComponents: (components: Component[]) => void;
  updateComponentProps: (id: string, props: Partial<any>) => void;
  reorderComponent: (id: string, newOrderKey: string) => void;
  selectComponent: (id: string | null) => void;
  addComponent: (type: string, afterKey: string | null) => void;
  removeComponent: (id: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  components: [],
  selectedComponentId: null,
  isDirty: false,
  setComponents: (components) => set({ components }),
  updateComponentProps: (id, newProps) => set((state) => ({
    isDirty: true,
    components: state.components.map(c =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    )
  })),
  // ... other actions
}));
```

### Auto-save

```typescript
// In builder page, auto-save to DB every 30 seconds if dirty
useEffect(() => {
  const interval = setInterval(async () => {
    if (isDirty) {
      await savePageComponents(pageId, components);
      setIsDirty(false);
    }
  }, 30000);
  return () => clearInterval(interval);
}, [isDirty, components]);
```

---

## 13. Branding & Asset Management (Cloudinary)

### Branding Config Structure

Stored in `websites.branding_config` as JSONB:

```json
{
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#2D3436",
    "background": "#FFFFFF",
    "text": "#2D3436",
    "accent": "#FDCB6E"
  },
  "typography": {
    "headingFont": "Playfair Display",
    "bodyFont": "Inter",
    "baseFontSize": 16
  },
  "logo": {
    "url": "https://res.cloudinary.com/sitepilot/image/upload/tenants/abc/logo.png",
    "alt": "Brand Logo",
    "width": 160
  }
}
```

### CSS Variables Injection

On every published page render, inject branding as CSS custom properties:

```typescript
export function generateBrandingCSS(branding: BrandingConfig): string {
  return `
    :root {
      --color-primary: ${branding.colors.primary};
      --color-secondary: ${branding.colors.secondary};
      --color-bg: ${branding.colors.background};
      --color-text: ${branding.colors.text};
      --color-accent: ${branding.colors.accent};
      --font-heading: '${branding.typography.headingFont}', serif;
      --font-body: '${branding.typography.bodyFont}', sans-serif;
      --font-base-size: ${branding.typography.baseFontSize}px;
    }
  `;
}
```

### Cloudinary Asset Upload

```typescript
// app/api/assets/upload/route.ts
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: Request) {
  const user = await verifyRequestAndGetUser(req);
  await enforceLimits(user.tenant_id, 'upload_asset', { fileSizeBytes: fileSize });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `sitepilot/tenants/${user.tenant_id}`,
        resource_type: 'auto',
      },
      (error, result) => error ? reject(error) : resolve(result)
    ).end(buffer);
  }) as any;

  // Save reference to DB
  await supabase.from('assets').insert({
    tenant_id: user.tenant_id,
    filename: file.name,
    cloudinary_public_id: result.public_id,
    cloudinary_url: result.secure_url,
    size_bytes: result.bytes,
    uploaded_by: user.id,
  });

  return Response.json({ url: result.secure_url });
}
```

---

## 14. Draft, Preview & Publish Workflow

### Three States of a Page

| State | Description | Who can see it |
|---|---|---|
| **Draft** | Being edited, not live | Only logged-in tenant users |
| **Preview** | Render exactly as it will look | Tenant users via preview link |
| **Published** | Served at the subdomain | Everyone |

### Publish Flow

```typescript
// app/api/websites/[id]/publish/route.ts
export async function POST(req: Request) {
  const user = await verifyRequestAndGetUser(req);
  await requirePermission('publish_website')(req, user);

  // Fetch full website with all pages and components
  const { data: website } = await supabase
    .from('websites')
    .select('*, pages(*, components(*))')
    .eq('id', params.id)
    .eq('tenant_id', user.tenant_id)
    .single();

  // Build deployment snapshot
  const snapshot = {
    websiteId: website.id,
    publishedAt: new Date().toISOString(),
    branding: website.branding_config,
    pages: website.pages.map((page: any) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      seo_meta: page.seo_meta,
      components: page.components
        .sort((a: any, b: any) => a.order_key.localeCompare(b.order_key))
        .map((c: any) => ({ type: c.type, props: c.props }))
    }))
  };

  // Run in transaction
  // 1. Deactivate all previous live deployments
  await supabase
    .from('deployments')
    .update({ is_live: false })
    .eq('website_id', website.id);

  // 2. Create new live deployment
  const { data: deployment } = await supabase
    .from('deployments')
    .insert({
      website_id: website.id,
      deployed_by: user.id,
      snapshot_json: snapshot,
      is_live: true,
    })
    .select()
    .single();

  // 3. Update website status
  await supabase
    .from('websites')
    .update({ status: 'published' })
    .eq('id', website.id);

  return Response.json({ deployment, liveUrl: `https://${website.subdomain}.sitepilot.io` });
}
```

---

## 15. Version Control

### Auto-Save Versioning

Triggered automatically every 10 minutes during editing, and on every manual save and every publish event.

```typescript
// lib/versioning.ts
const MAX_VERSIONS_PER_PAGE = 20;

export async function savePageVersion(
  pageId: string,
  components: Component[],
  userId: string,
  label?: string
) {
  // Save new version
  await supabase.from('page_versions').insert({
    page_id: pageId,
    content_snapshot: { components },
    saved_by: userId,
    label: label || null,
  });

  // Prune old versions — keep only last MAX_VERSIONS_PER_PAGE
  const { data: versions } = await supabase
    .from('page_versions')
    .select('id')
    .eq('page_id', pageId)
    .order('saved_at', { ascending: false });

  if (versions && versions.length > MAX_VERSIONS_PER_PAGE) {
    const idsToDelete = versions.slice(MAX_VERSIONS_PER_PAGE).map(v => v.id);
    await supabase.from('page_versions').delete().in('id', idsToDelete);
  }
}

// Restore a version
export async function restoreVersion(versionId: string, pageId: string) {
  const { data: version } = await supabase
    .from('page_versions')
    .select('content_snapshot')
    .eq('id', versionId)
    .single();

  // First, save current state as a version (so you can undo the restore)
  const currentComponents = await getCurrentComponents(pageId);
  await savePageVersion(pageId, currentComponents, 'system', 'Before restore');

  // Replace components with version snapshot
  await supabase.from('components').delete().eq('page_id', pageId);
  for (const component of version.content_snapshot.components) {
    await supabase.from('components').insert({ ...component, page_id: pageId });
  }
}
```

### Version History UI

Show a right-side panel in the builder listing the last 20 versions with:
- Timestamp (e.g., "2 hours ago")
- Who saved it
- Optional label
- "Restore" button

---

## 16. Domain Management

### Default Subdomain Assignment

Every website automatically gets `{slug}.sitepilot.io` on creation. This requires:
1. Wildcard DNS record: `*.sitepilot.io → your Vercel deployment`
2. Vercel wildcard domain config
3. The middleware routing (see Section 6)

### Custom Domain Flow

```
Tenant enters: www.mybakery.com
    ↓
System assigns CNAME target: mybakery-{tenantSlug}.sitepilot.io
    ↓
UI shows instruction: "Add a CNAME record:
  Name: www
  Value: mybakery-tenantslug.sitepilot.io"
    ↓
Background job polls DNS every 5 minutes
    ↓
On verification: set domain_verified = true
SSL auto-provisions via Vercel
```

### DNS Verification Job

```typescript
// lib/domain-verification.ts
import dns from 'dns/promises';

export async function verifyDomain(websiteId: string) {
  const { data: verification } = await supabase
    .from('domain_verifications')
    .select('*')
    .eq('website_id', websiteId)
    .single();

  if (!verification || verification.verified) return;

  try {
    const records = await dns.resolveCname(verification.domain);
    const isVerified = records.some(r => r.includes(verification.cname_target));

    await supabase.from('domain_verifications').update({
      verified: isVerified,
      last_checked_at: new Date().toISOString(),
    }).eq('id', verification.id);

    if (isVerified) {
      await supabase.from('websites').update({
        domain_verified: true
      }).eq('id', websiteId);
    }
  } catch {
    // DNS resolution failed — not verified yet, retry later
    await supabase.from('domain_verifications').update({
      last_checked_at: new Date().toISOString()
    }).eq('id', verification.id);
  }
}
```

---

## 17. Usage Monitoring & Analytics Dashboard

### Event Tracking Script

Inject this into every published page's `<head>`:

```html
<script>
  window.SITEPILOT_WEBSITE_ID = "{{websiteId}}";
  window.addEventListener('load', function() {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        website_id: window.SITEPILOT_WEBSITE_ID,
        page: window.location.pathname,
        referrer: document.referrer,
        timestamp: Date.now()
      })
    });
  });
</script>
```

### Dashboard Metrics Query

```typescript
// app/api/analytics/dashboard/route.ts
export async function GET(req: Request) {
  const user = await verifyRequestAndGetUser(req);
  const tenantId = user.tenant_id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [pageViews, storageUsed, aiUsed, websiteCount] = await Promise.all([
    supabase.rpc('get_total_page_views', { tid: tenantId, since: thirtyDaysAgo }),
    supabase.rpc('get_storage_used_mb', { tid: tenantId }),
    supabase.from('ai_usage_log')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', getStartOfMonth()),
    supabase.from('websites')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .neq('status', 'archived'),
  ]);

  const plan = user.tenants.plans;

  return Response.json({
    pageViews: pageViews.data,
    storageUsed: storageUsed.data,
    storageLimit: plan.storage_limit_mb,
    aiUsed: aiUsed.count,
    aiLimit: plan.ai_credits_per_month,
    websiteCount: websiteCount.count,
    websiteLimit: plan.max_websites,
    // Upgrade prompts
    alerts: {
      storageWarning: (storageUsed.data / plan.storage_limit_mb) > 0.8,
      aiWarning: ((aiUsed.count || 0) / plan.ai_credits_per_month) > 0.8,
    }
  });
}
```

### Dashboard UI Widgets to Build

- **Page Views Chart** — Line chart, last 30 days (use Recharts)
- **Storage Bar** — Progress bar showing used/total MB
- **AI Credits Bar** — Used/total this month
- **Sites Card** — Count used vs plan limit
- **Upgrade Banner** — Shows when any metric hits 80%

---

## 18. Tenant Lifecycle Management

### Onboarding (see Section 5 for full code)

Key steps: create tenant → create user → create starter website → create homepage → create Stripe customer → send welcome email.

### Plan Upgrade/Downgrade

**Upgrade:** User pays via Stripe Checkout → webhook fires `customer.subscription.updated` → `plan_id` in tenants table updates → new limits apply immediately.

**Downgrade Safety:**

```typescript
export async function handleDowngrade(tenantId: string, newPlanId: string) {
  const newPlan = await getPlan(newPlanId);
  const websites = await getActiveWebsites(tenantId);

  if (websites.length > newPlan.max_websites) {
    // Don't delete — archive excess websites
    const toArchive = websites.slice(newPlan.max_websites);
    await supabase
      .from('websites')
      .update({ status: 'archived' })
      .in('id', toArchive.map(w => w.id));

    // Notify tenant which sites were archived
    await notifyTenant(tenantId, {
      type: 'downgrade_archive_warning',
      archivedSites: toArchive.map(w => w.name)
    });
  }

  await supabase.from('tenants').update({ plan_id: newPlanId }).eq('id', tenantId);
}
```

### Offboarding

```typescript
export async function offboardTenant(tenantId: string, mode: 'graceful' | 'immediate' = 'graceful') {
  if (mode === 'graceful') {
    // Mark as offboarded, keep data for 90 days
    await supabase.from('tenants').update({ status: 'offboarded' }).eq('id', tenantId);
    // Schedule a deletion job in 90 days (use a cron job or Supabase pg_cron)
  } else {
    // Delete all Cloudinary assets
    await deleteAllTenantCloudinaryAssets(tenantId);
    // Cancel Stripe subscription
    await cancelStripeSubscription(tenantId);
    // Hard delete from DB (cascades via foreign keys)
    await supabase.from('tenants').delete().eq('id', tenantId);
  }
}
```

---

## 19. Real-Time Collaboration

### Using Supabase Realtime

Supabase Realtime lets multiple users see live changes without extra infrastructure.

```typescript
// In the builder, subscribe to changes on the components table for this page
const channel = supabase
  .channel(`page-${pageId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'components', filter: `page_id=eq.${pageId}` },
    (payload) => {
      // Another user made a change — update local state
      if (payload.eventType === 'UPDATE') {
        updateComponentInStore(payload.new);
      }
      if (payload.eventType === 'INSERT') {
        addComponentToStore(payload.new);
      }
      if (payload.eventType === 'DELETE') {
        removeComponentFromStore(payload.old.id);
      }
    }
  )
  .subscribe();
```

### Presence (Who's Online)

```typescript
const presenceChannel = supabase.channel(`presence-page-${pageId}`);

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    setOnlineUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        cursor: { x: 0, y: 0 }
      });
    }
  });
```

---

## 20. API Routes Reference

| Method | Route | Description | Auth Required | Permission |
|---|---|---|---|---|
| `POST` | `/api/tenants/onboard` | Create new tenant + user | Firebase JWT | — |
| `GET` | `/api/websites` | List tenant websites | ✅ | viewer |
| `POST` | `/api/websites` | Create new website | ✅ | admin |
| `GET` | `/api/websites/:id` | Get website details | ✅ | viewer |
| `DELETE` | `/api/websites/:id` | Archive website | ✅ | admin |
| `POST` | `/api/websites/:id/publish` | Publish website | ✅ | publish_website |
| `GET` | `/api/pages?websiteId=` | List pages | ✅ | viewer |
| `POST` | `/api/pages` | Create new page | ✅ | edit_content |
| `PUT` | `/api/pages/:id` | Update page | ✅ | edit_content |
| `DELETE` | `/api/pages/:id` | Delete page | ✅ | admin |
| `GET` | `/api/components?pageId=` | Get all components for a page | ✅ | viewer |
| `POST` | `/api/components` | Add component | ✅ | edit_content |
| `PUT` | `/api/components/:id` | Update component props | ✅ | edit_content |
| `DELETE` | `/api/components/:id` | Remove component | ✅ | edit_content |
| `POST` | `/api/ai/generate` | Generate layout from chatbot answers | ✅ | use_ai |
| `POST` | `/api/assets/upload` | Upload to Cloudinary | ✅ | upload_assets |
| `GET` | `/api/assets` | List tenant assets | ✅ | viewer |
| `DELETE` | `/api/assets/:id` | Delete asset | ✅ | admin |
| `GET` | `/api/analytics/dashboard` | Get metrics | ✅ | view_analytics |
| `POST` | `/api/analytics/track` | Track page view | ❌ | — |
| `GET` | `/api/team` | List team members | ✅ | admin |
| `POST` | `/api/team/invite` | Invite user | ✅ | invite_users |
| `DELETE` | `/api/team/:userId` | Remove user | ✅ | invite_users |
| `GET` | `/api/billing/plans` | List plans | ✅ | owner |
| `POST` | `/api/billing/create-checkout` | Start Stripe Checkout | ✅ | manage_billing |
| `POST` | `/api/billing/portal` | Open Stripe Customer Portal | ✅ | manage_billing |
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler | ❌ (sig verified) | — |
| `POST` | `/api/domains/add` | Add custom domain | ✅ | manage_domains |
| `GET` | `/api/domains/verify/:websiteId` | Check DNS verification | ✅ | manage_domains |
| `GET` | `/api/versions?pageId=` | Get version history | ✅ | edit_content |
| `POST` | `/api/versions/restore` | Restore a version | ✅ | edit_content |

---

## 21. Environment Variables

```bash
# .env.local

# ── FIREBASE ──────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SDK_JSON=           # Service account JSON (stringified)

# ── SUPABASE ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # For server-side admin operations

# ── CLAUDE AI ─────────────────────────────────────────────
CLAUDE_API_KEY=

# ── CLOUDINARY ────────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── STRIPE ────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://app.sitepilot.io
NEXT_PUBLIC_ROOT_DOMAIN=sitepilot.io
```

---

## 22. Build & Deployment Guide

### Local Development

```bash
# Clone and install
git clone https://github.com/your-org/sitepilot
cd sitepilot
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values

# Run database migrations
npx supabase db push

# Seed plan data
npm run db:seed

# Start dev server
npm run dev

# For subdomain testing locally, edit /etc/hosts:
# 127.0.0.1 test-tenant.localhost
# Then update NEXT_PUBLIC_ROOT_DOMAIN=localhost in .env.local
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add wildcard domain in Vercel Dashboard:
# Settings → Domains → Add → *.sitepilot.io
# Also add: sitepilot.io (apex domain)
# Also add: app.sitepilot.io (dashboard)
```

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Enable Realtime for components table
# In Supabase Dashboard → Database → Replication → Enable for: components
```

---

## 23. Demo Flow Script

> Follow this exact sequence for your hackathon demo. Total time: ~8–10 minutes.

**1. Platform Overview (30 seconds)**
Open the `app.sitepilot.io` landing page. Show the three plan tiers.

**2. Tenant Registration (1 minute)**
Register as "Pizza Palace" on Growth plan. Show auto-redirect to onboarding. Show Supabase — `pizza-palace-xxxx` row created in `tenants` table.

**3. AI Chatbot Generation (2 minutes)**
- Select "Restaurant" category
- Answer the 5 questions live
- Click "Generate My Website"
- Show the JSON being created (briefly flash the raw JSON in console)
- Watch the builder populate instantly with AI-generated layout

**4. Builder Customization (1.5 minutes)**
- Drag the Gallery block above the Features block
- Click the Hero section → edit the heading text inline
- Upload a logo to Cloudinary → show it appear in the navbar

**5. Branding Panel (30 seconds)**
- Change primary color from default to deep red
- Watch all buttons and headings update in real time across the page

**6. RBAC Demo (1 minute)**
- Open a second browser window (incognito)
- Log in as an Editor-role user
- Show that the Publish button and Billing tab are hidden/disabled

**7. Publish (30 seconds)**
- Switch back to owner
- Click Publish
- Navigate to `pizza-palace-xxxx.sitepilot.io` — live site renders from snapshot

**8. Version History (30 seconds)**
- Open version history panel
- Show the auto-saved versions list
- Click restore on an older version — builder reverts

**9. Analytics Dashboard (30 seconds)**
- Show page views chart
- Show storage used bar with warning at 80%
- Show AI credits used this month

**10. Plan Upgrade (1 minute)**
- Try creating a 4th website → hit plan limit error message
- Click Upgrade → Stripe Checkout opens → use test card `4242 4242 4242 4242`
- Return to dashboard — "3 websites" limit now shows "10 websites"

---

## 24. Checklist — Feature Completion Tracker

### Core Infrastructure
- [ ] Next.js 14 project setup with App Router
- [ ] Firebase Auth initialized
- [ ] Supabase project created and connected
- [ ] All database tables created and migrated
- [ ] Row-Level Security policies active
- [ ] Environment variables configured
- [ ] Vercel project linked and deployed
- [ ] Wildcard domain `*.sitepilot.io` configured on Vercel

### Authentication & Onboarding
- [ ] Register page (email/password + org name + plan selection)
- [ ] Login page
- [ ] Firebase Auth ↔ Supabase user sync
- [ ] Auto-onboarding API (tenant + user + starter site)
- [ ] Stripe customer creation on signup
- [ ] Welcome email on new tenant

### Subdomain Routing
- [ ] `middleware.ts` reads subdomain from host header
- [ ] Rewrites to `/sites/[subdomain]` route
- [ ] `TenantSitePage` renders from live deployment snapshot
- [ ] 404 handling for unknown subdomains

### RBAC
- [ ] Permission constants defined
- [ ] `requirePermission()` middleware for API routes
- [ ] `PermissionGate` component for frontend
- [ ] All 5 roles working: owner, admin, editor, developer, viewer

### Subscription & Payments
- [ ] 3 plans defined in DB (Starter, Growth, Pro)
- [ ] Stripe products and prices created
- [ ] Billing page with plan cards
- [ ] Stripe Checkout integration
- [ ] Stripe Customer Portal integration
- [ ] Stripe webhook handler (updated, deleted, payment failed)
- [ ] Plan limits enforced on: website create, page create, asset upload, AI usage
- [ ] Downgrade safety (archive excess sites, don't delete)

### AI Chatbot
- [ ] Chatbot UI with step-by-step questions
- [ ] Claude API integration
- [ ] `generateWebsiteFromPrompt()` returns `content.json` + `config.json`
- [ ] AI credit deduction and limit check
- [ ] Error handling for malformed Claude JSON output

### Atomic Component System
- [ ] Atoms: Button, Input, Badge, Avatar, Typography, Icon, Spinner
- [ ] Molecules: FormField, Card, Dropdown, Modal, Tooltip
- [ ] Organisms: Navbar, Sidebar, DataTable, PlanCard
- [ ] Site Blocks: Navbar, Hero, Features, Gallery, Testimonials, CTA, Footer, ContactForm

### Template Engine
- [ ] Minimum 3 templates: Restaurant, Portfolio, Business
- [ ] Template picker UI with thumbnails
- [ ] Template JSON loads into builder on selection
- [ ] AI output overrides template base

### Drag & Drop Builder
- [ ] `dnd-kit` installed and configured
- [ ] Components render from JSON in correct order
- [ ] Drag to reorder — fractional indexing updates one record only
- [ ] Add new component (type picker modal)
- [ ] Delete component with confirmation
- [ ] Inline prop editing (click to edit text, image picker)
- [ ] Zustand store for builder state
- [ ] Auto-save every 30 seconds

### Branding
- [ ] Branding panel (color pickers, font selectors, logo upload)
- [ ] CSS variables injected based on branding config
- [ ] Branding updates reflect live in builder preview
- [ ] Cloudinary asset upload and storage quota check

### Draft, Preview & Publish
- [ ] Draft state (default for all new sites)
- [ ] Preview mode (share a `/preview` link)
- [ ] Publish API creates deployment snapshot
- [ ] Published site served from snapshot (immutable)
- [ ] Publish button gated by `publish_website` permission

### Version Control
- [ ] `page_versions` table in DB
- [ ] Auto-save version on edit (every 10 min) + on publish
- [ ] Max 20 versions per page with pruning
- [ ] Version history panel in builder UI
- [ ] Restore from version (saves current state first)

### Domain Management
- [ ] Auto-assign subdomain on website creation
- [ ] Custom domain input (Growth/Pro only)
- [ ] CNAME instructions shown to user
- [ ] DNS verification polling job
- [ ] `domain_verified` flag updated on success

### Analytics
- [ ] Tracking pixel script injected on published pages
- [ ] `/api/analytics/track` endpoint
- [ ] Daily aggregation into `usage_metrics`
- [ ] Dashboard: page views line chart (Recharts)
- [ ] Dashboard: storage bar, AI credits bar, website count
- [ ] Upgrade nudge banner when any metric > 80%

### Tenant Lifecycle
- [ ] Auto-onboarding (covered in Auth section)
- [ ] Plan upgrade triggers limit expansion
- [ ] Plan downgrade archives excess websites gracefully
- [ ] Tenant suspension (status = 'suspended', blocks login)
- [ ] Offboarding: archive or hard delete with Cloudinary cleanup

### Real-Time Collaboration (Bonus)
- [ ] Supabase Realtime subscribed on component table per page
- [ ] Live updates reflected across open builder sessions
- [ ] Presence indicator (avatars of who's editing)

---

> **Last Updated:** Project Kickoff  
> **Maintainers:** Your Team  
> **Stack Version:** Next.js 14 · Supabase · Firebase Auth · Claude claude-sonnet-4-6 · Stripe · Cloudinary · Vercel
