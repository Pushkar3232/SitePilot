# 🗄️ SitePilot — Complete Database Schema Reference
> Full Schema Documentation · Every Table · Every Column · Every Relationship  
> Database: Supabase (PostgreSQL 15) · ORM: Prisma · Security: Row-Level Security (RLS)

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table: plans](#3-table-plans)
4. [Table: tenants](#4-table-tenants)
5. [Table: users](#5-table-users)
6. [Table: subscriptions](#6-table-subscriptions)
7. [Table: websites](#7-table-websites)
8. [Table: pages](#8-table-pages)
9. [Table: components](#9-table-components)
10. [Table: deployments](#10-table-deployments)
11. [Table: page_versions](#11-table-page_versions)
12. [Table: assets](#12-table-assets)
13. [Table: ai_usage_log](#13-table-ai_usage_log)
14. [Table: usage_metrics](#14-table-usage_metrics)
15. [Table: domain_verifications](#15-table-domain_verifications)
16. [Table: team_invitations](#16-table-team_invitations)
17. [Table: audit_logs](#17-table-audit_logs)
18. [JSONB Field Schemas](#18-jsonb-field-schemas)
19. [Enums & Allowed Values](#19-enums--allowed-values)
20. [Row-Level Security Policies](#20-row-level-security-policies)
21. [Indexes](#21-indexes)
22. [Database Functions & Triggers](#22-database-functions--triggers)
23. [Prisma Schema](#23-prisma-schema)
24. [Seed Data](#24-seed-data)
25. [Migration Files](#25-migration-files)
26. [Data Flow Examples](#26-data-flow-examples)

---

## 1. Architecture Overview

### Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Multi-tenancy model** | Shared schema, row-level isolation | Scales to thousands of tenants, easy to manage, single DB |
| **Tenant isolation method** | PostgreSQL Row-Level Security (RLS) | Database enforces isolation even if application has bugs |
| **IDs** | UUID v4 everywhere | No sequential guessing, globally unique, safe to expose in URLs |
| **JSON storage** | JSONB (not JSON) | JSONB is indexed, queryable, and faster than plain JSON |
| **Timestamps** | `TIMESTAMPTZ` (with timezone) | Avoids timezone ambiguity for global users |
| **Soft deletes** | `status` enum field (not `deleted_at`) | Cleaner queries, no accidental data recovery issues |
| **Ordering** | Fractional index string in `order_key` | Single DB write on drag-and-drop reorder |

### Table Hierarchy

```
plans                          ← No parent (global config)
│
└── tenants                    ← Belongs to a plan
    │
    ├── users                  ← Belong to a tenant
    │
    ├── subscriptions          ← One subscription per tenant
    │
    ├── assets                 ← All media files for a tenant
    │
    ├── ai_usage_log           ← AI credit consumption per tenant
    │
    ├── team_invitations       ← Pending user invites
    │
    ├── audit_logs             ← All admin actions
    │
    └── websites               ← One or more websites per tenant
        │
        ├── domain_verifications  ← Custom domain DNS records
        │
        ├── deployments           ← Published snapshots (version history of live site)
        │
        └── pages                 ← Pages inside a website
            │
            ├── page_versions     ← Draft version history per page
            │
            └── components        ← Blocks on a page (hero, navbar, etc.)
```

### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public
```

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    ┌──────────┐          ┌──────────────┐        ┌───────────────────┐ │
│    │  plans   │──────────│   tenants    │────────│   subscriptions   │ │
│    │          │  1    N  │              │  1   1 │                   │ │
│    └──────────┘          └──────┬───────┘        └───────────────────┘ │
│                                 │                                       │
│              ┌──────────────────┼───────────────────────┐              │
│              │                  │                        │              │
│              ▼                  ▼                        ▼              │
│        ┌──────────┐      ┌──────────────┐        ┌──────────────┐     │
│        │  users   │      │   websites   │        │    assets    │     │
│        │          │      │              │        │              │     │
│        └──────────┘      └──────┬───────┘        └──────────────┘     │
│                                 │                                       │
│              ┌──────────────────┼────────────────────────┐             │
│              │                  │                         │             │
│              ▼                  ▼                         ▼             │
│    ┌──────────────────┐  ┌──────────────┐    ┌──────────────────────┐ │
│    │domain_verifications│ │  deployments │    │       pages          │ │
│    │                  │  │              │    │                      │ │
│    └──────────────────┘  └──────────────┘    └──────────┬───────────┘ │
│                                                          │              │
│                                    ┌─────────────────────┤             │
│                                    │                     │             │
│                                    ▼                     ▼             │
│                           ┌──────────────┐    ┌──────────────────────┐│
│                           │ page_versions│    │     components       ││
│                           │              │    │                      ││
│                           └──────────────┘    └──────────────────────┘│
│                                                                         │
│    ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│    │   ai_usage_log   │    │  usage_metrics   │    │  audit_logs   │  │
│    │  (tenant-scoped) │    │ (website-scoped) │    │(tenant-scoped)│  │
│    └──────────────────┘    └──────────────────┘    └───────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

  LEGEND:
  1    = one side of relationship
  N    = many side of relationship
  ──── = foreign key relationship
  ─┬── = has many
```

---

## 3. Table: `plans`

> Defines the subscription tiers available on the platform. This is global — not tenant-specific. No RLS needed.

### Purpose
Stores the feature limits and pricing for each plan tier (Starter, Growth, Pro). Every tenant has exactly one active plan at a time.

### Schema

```sql
CREATE TABLE plans (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Plan Identity ────────────────────────────────────────────────────
  name                    TEXT          NOT NULL UNIQUE,
  -- Human-readable name shown in UI: 'Starter', 'Growth', 'Pro'

  slug                    TEXT          NOT NULL UNIQUE,
  -- Machine-readable key: 'starter', 'growth', 'pro'
  -- Used in code for plan comparisons

  description             TEXT,
  -- Short marketing copy: 'Perfect for getting started'

  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  -- FALSE = plan is discontinued, hidden from new signups but existing tenants keep it

  -- ── Website Limits ───────────────────────────────────────────────────
  max_websites            INT           NOT NULL DEFAULT 1,
  -- How many active (non-archived) websites this tenant can create
  -- Starter=1, Growth=3, Pro=10

  max_pages_per_site      INT           NOT NULL DEFAULT 5,
  -- Max pages inside a single website
  -- Starter=5, Growth=20, Pro=100

  -- ── Storage Limits ───────────────────────────────────────────────────
  storage_limit_mb        INT           NOT NULL DEFAULT 100,
  -- Total Cloudinary storage quota across all assets for this tenant, in MB
  -- Starter=100, Growth=500, Pro=2000

  -- ── AI Limits ────────────────────────────────────────────────────────
  ai_credits_per_month    INT           NOT NULL DEFAULT 10,
  -- Number of AI generation actions per calendar month
  -- Each call to Claude (generate layout, suggest copy, SEO) = 1 credit
  -- Starter=10, Growth=50, Pro=200

  -- ── Feature Flags ────────────────────────────────────────────────────
  custom_domain_allowed   BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Whether tenant can connect their own domain (e.g., www.mybusiness.com)
  -- Starter=false, Growth=true, Pro=true

  version_history_limit   INT           NOT NULL DEFAULT 5,
  -- How many saved page versions are kept per page
  -- Starter=5, Growth=20, Pro=50

  collaboration_enabled   BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Whether real-time multi-user editing is enabled
  -- Starter=false, Growth=true, Pro=true

  max_collaborators       INT           NOT NULL DEFAULT 1,
  -- Max number of users (including owner) in this tenant
  -- Starter=1, Growth=5, Pro=20

  analytics_enabled       BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Whether the analytics dashboard is available
  -- Starter=false, Growth=true, Pro=true

  priority_support        BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Whether tenant gets priority support badge
  -- Starter=false, Growth=false, Pro=true

  -- ── Pricing ──────────────────────────────────────────────────────────
  price_monthly_cents     INT           NOT NULL DEFAULT 0,
  -- Price in cents (USD). 0 = free. 1900 = $19.00/month
  -- Starter=0, Growth=1900, Pro=4900

  price_yearly_cents      INT           NOT NULL DEFAULT 0,
  -- Annual billing price. Usually 2 months free.
  -- Starter=0, Growth=19000, Pro=49000

  stripe_monthly_price_id TEXT,
  -- Stripe Price ID for monthly billing (e.g., 'price_1Oz...')
  -- Retrieved from Stripe Dashboard after creating the product

  stripe_yearly_price_id  TEXT,
  -- Stripe Price ID for annual billing

  -- ── Metadata ─────────────────────────────────────────────────────────
  display_order           INT           NOT NULL DEFAULT 0,
  -- Controls left-to-right display order on pricing page
  -- Starter=1, Growth=2, Pro=3

  badge_text              TEXT,
  -- Optional badge shown on plan card: 'Most Popular', 'Best Value'

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `plans.id` ← referenced by `tenants.plan_id` (one plan → many tenants)

### Sample Data

```
id        | name     | slug    | max_websites | max_pages | storage_mb | ai_credits | price_cents
──────────┼──────────┼─────────┼──────────────┼───────────┼────────────┼────────────┼────────────
uuid-1    | Starter  | starter |      1       |     5     |    100     |     10     |     0
uuid-2    | Growth   | growth  |      3       |    20     |    500     |     50     |   1900
uuid-3    | Pro      | pro     |     10       |   100     |   2000     |    200     |   4900
```

---

## 4. Table: `tenants`

> The central entity of the entire platform. Everything belongs to a tenant.

### Purpose
Represents one independent organization using the platform. Could be a restaurant, portfolio owner, startup, school, etc.

### Schema

```sql
CREATE TABLE tenants (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Organization Identity ────────────────────────────────────────────
  name                    TEXT          NOT NULL,
  -- The organization's display name: 'Pizza Palace', 'John Doe Portfolio'

  slug                    TEXT          NOT NULL UNIQUE,
  -- URL-safe identifier. Auto-generated from name on signup.
  -- Used as subdomain: slug.sitepilot.io
  -- Format: lowercase, hyphens only, 3-40 chars
  -- Example: 'pizza-palace-x7k2' (suffix added to ensure uniqueness)

  -- ── Plan & Subscription ──────────────────────────────────────────────
  plan_id                 UUID          NOT NULL REFERENCES plans(id),
  -- Current active plan for this tenant
  -- Updated automatically when Stripe subscription changes

  -- ── Lifecycle Status ─────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'suspended', 'offboarded', 'pending')),
  -- 'active'     → Normal operating state
  -- 'suspended'  → Payment failed or admin suspended. Users cannot log in.
  -- 'offboarded' → Tenant has cancelled. Data retained for 90 days then deleted.
  -- 'pending'    → Registration started but not completed (email not verified)

  -- ── Stripe Billing ───────────────────────────────────────────────────
  stripe_customer_id      TEXT          UNIQUE,
  -- Stripe Customer ID (e.g., 'cus_Oz1234abcd')
  -- Created on signup even for free plan (for future upgrades)

  -- ── Branding (top-level defaults) ────────────────────────────────────
  logo_url                TEXT,
  -- Optional tenant-level logo URL (Cloudinary). May be overridden per website.

  timezone                TEXT          NOT NULL DEFAULT 'UTC',
  -- IANA timezone string: 'America/New_York', 'Asia/Kolkata'
  -- Used for analytics date grouping

  locale                  TEXT          NOT NULL DEFAULT 'en',
  -- ISO 639-1 language code: 'en', 'es', 'fr', 'de'

  -- ── Metadata ─────────────────────────────────────────────────────────
  onboarding_completed    BOOLEAN       NOT NULL DEFAULT FALSE,
  -- FALSE until user completes the AI chatbot onboarding flow
  -- Used to show/hide the onboarding wizard

  offboard_scheduled_at   TIMESTAMPTZ,
  -- Set when status = 'offboarded'. Data deleted 90 days after this timestamp.

  last_active_at          TIMESTAMPTZ,
  -- Updated on each API request. Used to detect inactive tenants.

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `tenants.plan_id` → `plans.id`
- `tenants.id` ← `users.tenant_id` (one tenant → many users)
- `tenants.id` ← `websites.tenant_id` (one tenant → many websites)
- `tenants.id` ← `subscriptions.tenant_id` (one tenant → one subscription)
- `tenants.id` ← `assets.tenant_id` (one tenant → many assets)
- `tenants.id` ← `ai_usage_log.tenant_id`
- `tenants.id` ← `audit_logs.tenant_id`
- `tenants.id` ← `team_invitations.tenant_id`

### Notes
- `slug` is immutable after creation to prevent subdomain breakage
- Changing `plan_id` directly is done ONLY by the Stripe webhook handler — never by user-facing APIs
- When `status = 'suspended'`, all API routes return `403 Tenant Suspended`

---

## 5. Table: `users`

> Represents a person who has access to a tenant's dashboard.

### Purpose
Stores all users of the platform, linked both to Supabase Auth (for login) and to a specific tenant (for data access). A person can be a member of only one tenant.

### Schema

```sql
CREATE TABLE users (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Supabase Auth Link ──────────────────────────────────────────────
  supabase_auth_id        TEXT          NOT NULL UNIQUE,
  -- Supabase Authentication UID (e.g., 'xKj7dP2mNqR...')
  -- This is the bridge between Supabase Auth session and our DB record
  -- Used in every API request to resolve the user

  -- ── Profile ──────────────────────────────────────────────────────────
  email                   TEXT          NOT NULL,
  -- User's email address (mirrors Supabase Auth email)
  -- NOT UNIQUE at DB level because different tenants could theoretically have
  -- the same email in future (though Supabase enforces global uniqueness)

  full_name               TEXT,
  -- Display name. 'John Doe'. Optional but encouraged.

  avatar_url              TEXT,
  -- Profile picture URL (Cloudinary or external)

  -- ── Tenant Assignment ────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Which tenant this user belongs to
  -- ON DELETE CASCADE: if tenant is deleted, all its users are deleted

  -- ── Role & Permissions ───────────────────────────────────────────────
  role                    TEXT          NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('owner', 'admin', 'editor', 'developer', 'viewer')),
  -- 'owner'     → Full access. Created on tenant signup. Only one per tenant.
  --               Can manage billing, delete account, invite all roles.
  -- 'admin'     → Almost full access. Can manage users, domains, publish.
  --               Cannot manage billing or delete the tenant.
  -- 'editor'    → Can create/edit all content and use AI.
  --               Cannot publish, manage domains, or manage users.
  -- 'developer' → Like admin for technical tasks. Can publish, manage domains.
  --               Cannot manage billing or invite users.
  -- 'viewer'    → Read-only. Can view websites and analytics but cannot edit.

  -- ── Invitation Tracking ──────────────────────────────────────────────
  invited_by              UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- Who invited this user. NULL if they are the original owner.

  invitation_accepted_at  TIMESTAMPTZ,
  -- When the invited user clicked the invite link and set their password
  -- NULL = invite was sent but not yet accepted

  -- ── Status ───────────────────────────────────────────────────────────
  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  -- FALSE = user has been deactivated. They cannot log in.
  -- We don't delete users, we deactivate them.

  -- ── Preferences ──────────────────────────────────────────────────────
  preferences             JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- User-specific UI preferences stored as JSON.
  -- See JSONB schemas section for full structure.
  -- Example: { "theme": "dark", "sidebar_collapsed": false, "notifications": {...} }

  -- ── Session Tracking ─────────────────────────────────────────────────
  last_login_at           TIMESTAMPTZ,
  -- Timestamp of most recent successful login

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `users.tenant_id` → `tenants.id`
- `users.invited_by` → `users.id` (self-referential)
- `users.id` ← `deployments.deployed_by`
- `users.id` ← `page_versions.saved_by`
- `users.id` ← `assets.uploaded_by`
- `users.id` ← `ai_usage_log.user_id`
- `users.id` ← `audit_logs.performed_by`

### Business Rules
- Exactly one user per tenant must have `role = 'owner'`
- `role` cannot be changed to 'owner' via API — only by direct migration (if ownership transfer is needed)
- Deactivating the owner account (`is_active = false`) triggers a warning and requires assigning a new owner

---

## 6. Table: `subscriptions`

> Tracks the billing relationship between a tenant and Stripe.

### Purpose
Mirrors the Stripe subscription state in our database. Updated exclusively via Stripe webhooks — never directly by user actions.

### Schema

```sql
CREATE TABLE subscriptions (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Tenant Link ──────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  -- UNIQUE: one subscription record per tenant
  -- ON DELETE CASCADE: deleted with tenant

  -- ── Stripe References ────────────────────────────────────────────────
  stripe_subscription_id  TEXT          UNIQUE,
  -- Stripe Subscription object ID: 'sub_1Oz1234abcd'
  -- NULL for free plan tenants (no Stripe subscription created)

  stripe_customer_id      TEXT          NOT NULL,
  -- Stripe Customer ID: 'cus_Oz1234abcd'
  -- Created for ALL tenants (even free) to make upgrades seamless

  stripe_price_id         TEXT,
  -- The specific Stripe Price being subscribed to
  -- Maps to a row in plans table via stripe_monthly_price_id or stripe_yearly_price_id

  -- ── Billing Status ───────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'active'
                          CHECK (status IN (
                            'active',
                            'trialing',
                            'past_due',
                            'cancelled',
                            'unpaid',
                            'incomplete',
                            'paused'
                          )),
  -- 'active'     → Paid and current
  -- 'trialing'   → In free trial period, no payment yet
  -- 'past_due'   → Payment failed, retrying. Features still accessible.
  -- 'cancelled'  → User cancelled. Access until period end.
  -- 'unpaid'     → Multiple payment retries failed. Access revoked.
  -- 'incomplete' → Initial payment failed during signup
  -- 'paused'     → Stripe-level pause (no charges, no access)

  billing_cycle           TEXT          DEFAULT 'monthly'
                          CHECK (billing_cycle IN ('monthly', 'yearly', 'none')),
  -- 'none' for free plan tenants

  -- ── Period ───────────────────────────────────────────────────────────
  current_period_start    TIMESTAMPTZ,
  -- When the current billing period started
  -- NULL for free plan

  current_period_end      TIMESTAMPTZ,
  -- When the current billing period ends (next charge date)
  -- NULL for free plan

  trial_end               TIMESTAMPTZ,
  -- When the trial period ends. NULL if no trial.

  -- ── Cancellation ─────────────────────────────────────────────────────
  cancel_at_period_end    BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE = tenant cancelled but still has access until current_period_end
  -- This comes directly from Stripe

  cancelled_at            TIMESTAMPTZ,
  -- When the subscription was cancelled (if cancel_at_period_end happened)

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Webhook → Field Mapping

| Stripe Event | Fields Updated |
|---|---|
| `customer.subscription.created` | All fields populated |
| `customer.subscription.updated` | `status`, `stripe_price_id`, `current_period_end`, `cancel_at_period_end` |
| `customer.subscription.deleted` | `status = 'cancelled'`, `cancelled_at` |
| `invoice.payment_failed` | `status = 'past_due'` |
| `invoice.payment_succeeded` | `status = 'active'` |

---

## 7. Table: `websites`

> A website owned by a tenant. A tenant can have multiple websites depending on their plan.

### Purpose
Each website is an independent site with its own domain, pages, branding, and deployment history.

### Schema

```sql
CREATE TABLE websites (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Ownership ────────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Which tenant owns this website

  -- ── Identity & Display ───────────────────────────────────────────────
  name                    TEXT          NOT NULL,
  -- Internal display name shown in tenant dashboard: 'Main Website', 'Blog'

  description             TEXT,
  -- Optional internal description: 'Our primary marketing site'

  -- ── Subdomain (auto-assigned) ─────────────────────────────────────────
  subdomain               TEXT          UNIQUE,
  -- The sitepilot.io subdomain: 'pizza-palace-x7k2'
  -- Full URL: pizza-palace-x7k2.sitepilot.io
  -- Auto-generated on creation. Immutable once set.

  -- ── Custom Domain (optional, plan-gated) ─────────────────────────────
  custom_domain           TEXT          UNIQUE,
  -- The tenant's own domain: 'www.pizzapalace.com'
  -- NULL if not configured or not allowed by plan
  -- Must be verified before it goes live (see domain_verifications table)

  domain_verified         BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE once DNS CNAME verification passes
  -- Site serves on custom_domain only when this is TRUE

  -- ── Lifecycle Status ─────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'archived', 'suspended')),
  -- 'draft'     → Being built, not publicly accessible
  -- 'published' → Live at subdomain/custom domain
  -- 'archived'  → Hidden but data retained (used on plan downgrade)
  -- 'suspended' → Admin-suspended, returns 403

  -- ── Branding Config (JSONB) ───────────────────────────────────────────
  branding_config         JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- Full branding configuration for this website.
  -- Injected as CSS custom properties on all pages.
  -- See JSONB schemas section (Section 18) for full structure.

  -- ── SEO Defaults ─────────────────────────────────────────────────────
  seo_defaults            JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- Default SEO values applied when a page doesn't have its own.
  -- { "title_template": "%s | Pizza Palace", "description": "...", "og_image": "..." }

  -- ── Analytics ────────────────────────────────────────────────────────
  analytics_enabled       BOOLEAN       NOT NULL DEFAULT TRUE,
  -- Whether the tracking pixel is injected into this site's pages

  -- ── Template ─────────────────────────────────────────────────────────
  template_id             TEXT,
  -- Which starter template was used: 'restaurant', 'portfolio', 'business'
  -- NULL if site was built from scratch

  -- ── AI Generation ────────────────────────────────────────────────────
  ai_generated            BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE if the initial content was generated by the AI chatbot

  -- ── Favicon ──────────────────────────────────────────────────────────
  favicon_url             TEXT,
  -- Cloudinary URL to the favicon (must be square, min 32×32)

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  published_at            TIMESTAMPTZ,
  -- Set to NOW() on first publish. Never reset (even on republish).

  last_deployed_at        TIMESTAMPTZ
  -- Updated every time a new deployment is created
);
```

### Relationships
- `websites.tenant_id` → `tenants.id`
- `websites.id` ← `pages.website_id`
- `websites.id` ← `deployments.website_id`
- `websites.id` ← `domain_verifications.website_id`
- `websites.id` ← `usage_metrics.website_id`

---

## 8. Table: `pages`

> A single page within a website (e.g., Home, About, Contact).

### Purpose
Each page contains an ordered list of components. Pages have their own URL slug, SEO settings, and draft/publish status independent of the website.

### Schema

```sql
CREATE TABLE pages (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Parent Website ───────────────────────────────────────────────────
  website_id              UUID          NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

  -- ── Page Identity ────────────────────────────────────────────────────
  title                   TEXT          NOT NULL,
  -- Display name shown in the builder navigation panel: 'Home', 'About Us'

  slug                    TEXT          NOT NULL,
  -- URL path for this page: '/', '/about', '/contact', '/our-menu'
  -- Must start with '/'
  -- Must be unique within a website (enforced by composite unique constraint)

  -- ── Status ───────────────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'hidden')),
  -- 'draft'     → Only visible in builder preview
  -- 'published' → Live to public (included in deployment snapshots)
  -- 'hidden'    → Published but removed from navigation (accessible by direct URL)

  -- ── Home Page Flag ────────────────────────────────────────────────────
  is_home                 BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE for the page that serves as the root URL '/'
  -- Only one page per website can be is_home = TRUE

  -- ── Navigation ───────────────────────────────────────────────────────
  show_in_nav             BOOLEAN       NOT NULL DEFAULT TRUE,
  -- Whether this page appears in the generated site navigation

  nav_order               INT           NOT NULL DEFAULT 0,
  -- Position of this page in the navigation menu (ascending order)
  -- 0 = first, 1 = second, etc.

  nav_label               TEXT,
  -- Optional custom label for the nav link (defaults to `title` if NULL)

  -- ── SEO ──────────────────────────────────────────────────────────────
  seo_meta                JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- Page-specific SEO settings. Overrides website seo_defaults.
  -- { "title": "...", "description": "...", "og_image": "...", "no_index": false }
  -- See JSONB schemas section for full structure.

  -- ── Page Config ──────────────────────────────────────────────────────
  page_config             JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- Page-level layout settings.
  -- { "show_navbar": true, "show_footer": true, "background_color": null,
  --   "max_width": "1280px", "padding": "0" }

  -- ── Password Protection ───────────────────────────────────────────────
  password_protected      BOOLEAN       NOT NULL DEFAULT FALSE,
  password_hash           TEXT,
  -- If password_protected is TRUE, visitors must enter this password
  -- Stored as bcrypt hash

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Constraints ──────────────────────────────────────────────────────
  UNIQUE(website_id, slug)
  -- Ensures no two pages on the same website share a URL path
);
```

### Relationships
- `pages.website_id` → `websites.id`
- `pages.id` ← `components.page_id`
- `pages.id` ← `page_versions.page_id`

### Business Rules
- When `is_home = TRUE`, `slug` must equal `'/'`
- Only one `is_home = TRUE` page allowed per website (enforced by partial unique index)
- Deleting a page does NOT affect the live site until next publish

---

## 9. Table: `components`

> The individual building blocks placed on a page. This is the core of the website builder.

### Purpose
Each component is a content block on a page — a hero section, a navbar, a gallery, etc. Components are ordered using fractional indexing and store all their configuration and content in a single `props` JSONB field.

### Schema

```sql
CREATE TABLE components (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Parent Page ──────────────────────────────────────────────────────
  page_id                 UUID          NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  -- ── Component Type ───────────────────────────────────────────────────
  type                    TEXT          NOT NULL
                          CHECK (type IN (
                            'navbar',
                            'hero',
                            'features',
                            'gallery',
                            'testimonials',
                            'pricing',
                            'cta',
                            'contact_form',
                            'team',
                            'faq',
                            'stats',
                            'blog_grid',
                            'video_embed',
                            'map',
                            'rich_text',
                            'image_text',
                            'footer',
                            'custom_html'
                          )),
  -- Determines which React component renders this block.
  -- 'navbar'        → Top navigation bar with logo and links
  -- 'hero'          → Full-width header section with headline + CTA
  -- 'features'      → Icon grid showing key features/services
  -- 'gallery'       → Image grid or carousel
  -- 'testimonials'  → Customer review cards
  -- 'pricing'       → Pricing plan comparison cards
  -- 'cta'           → Call-to-action banner with button
  -- 'contact_form'  → Email contact form
  -- 'team'          → Team member cards with photo + bio
  -- 'faq'           → Accordion question & answer section
  -- 'stats'         → Animated number counter section
  -- 'blog_grid'     → Grid of blog post cards
  -- 'video_embed'   → Embedded video (YouTube/Vimeo)
  -- 'map'           → Google Maps embed
  -- 'rich_text'     → Free-form WYSIWYG text section
  -- 'image_text'    → Image on one side, text on the other
  -- 'footer'        → Bottom footer with links and copyright
  -- 'custom_html'   → Pro plan only: raw HTML block

  -- ── Ordering ─────────────────────────────────────────────────────────
  order_key               TEXT          NOT NULL,
  -- Fractional indexing string for ordering without full re-index.
  -- Examples: 'a0', 'a1', 'a2' or 'a0V', 'a1' (between values)
  -- When dragging B between A and C: only B's order_key changes.
  -- Generated using the 'fractional-indexing' npm package.
  -- Sort components with: ORDER BY order_key ASC

  -- ── Visibility ───────────────────────────────────────────────────────
  is_visible              BOOLEAN       NOT NULL DEFAULT TRUE,
  -- FALSE = component is hidden (not rendered on published site or preview)
  -- Allows temporarily hiding sections without deleting them

  is_locked               BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE = only owner/admin can edit this component
  -- Useful for protecting headers/footers from editor changes

  -- ── Content & Configuration ──────────────────────────────────────────
  props                   JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- ALL content and configuration for this component.
  -- Structure varies by component type.
  -- See Section 18 (JSONB Field Schemas) for per-type documentation.

  -- ── AI Generation Tracking ───────────────────────────────────────────
  ai_generated            BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE if this component's content was generated by the AI chatbot

  -- ── Plan Gating ──────────────────────────────────────────────────────
  required_plan           TEXT          DEFAULT NULL,
  -- If set, this component type is only available on this plan or higher
  -- NULL = available on all plans
  -- 'growth' = Growth and Pro only
  -- 'pro' = Pro only (used for 'custom_html' type)

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `components.page_id` → `pages.id`

### How Ordering Works (Fractional Indexing)

```
Initial state:        order_key = 'a0', 'a1', 'a2', 'a3'
Drag 'a3' to top:     update a3's order_key = generateKeyBetween(null, 'a0') → 'Zz'
Result sorted:        'Zz', 'a0', 'a1', 'a2'

Only ONE database write needed. Compare this to integer indexing where
you'd need to update ALL records with index >= new position.
```

---

## 10. Table: `deployments`

> An immutable snapshot of the entire website at the moment of publishing.

### Purpose
When a tenant publishes, the entire current state of all pages and components is frozen into a `snapshot_json`. The live public site always reads from the latest `is_live = true` deployment — never from the live components table. This means editors can make changes without affecting the live site.

### Schema

```sql
CREATE TABLE deployments (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Parent Website ───────────────────────────────────────────────────
  website_id              UUID          NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

  -- ── Publisher ────────────────────────────────────────────────────────
  deployed_by             UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- Who clicked 'Publish'. NULL if system-triggered.

  -- ── Snapshot ─────────────────────────────────────────────────────────
  snapshot_json           JSONB         NOT NULL,
  -- The complete frozen state of the website at publish time.
  -- This is what the public-facing site renderer reads from.
  -- Structure:
  -- {
  --   "websiteId": "uuid",
  --   "publishedAt": "ISO timestamp",
  --   "branding": { ...branding_config },
  --   "seoDefaults": { ...seo_defaults },
  --   "pages": [
  --     {
  --       "id": "uuid",
  --       "title": "Home",
  --       "slug": "/",
  --       "seo_meta": { ... },
  --       "components": [
  --         { "type": "hero", "props": { ... }, "is_visible": true },
  --         ...
  --       ]
  --     }
  --   ]
  -- }

  -- ── Live Flag ─────────────────────────────────────────────────────────
  is_live                 BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE = this is the currently active deployment being served publicly
  -- Only ONE deployment per website can be is_live = TRUE at a time
  -- Enforced by trigger: setting is_live=true on new → sets false on all previous

  -- ── Metadata ─────────────────────────────────────────────────────────
  deployed_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Optional Notes ───────────────────────────────────────────────────
  notes                   TEXT
  -- Optional publish message: 'Added new pricing section'
);
```

### Relationships
- `deployments.website_id` → `websites.id`
- `deployments.deployed_by` → `users.id`

### Key Design Note
The public site NEVER reads from `components` table directly. It reads from `deployments.snapshot_json`. This is critical for:
- **Atomic deploys** — the entire site switches at once, no partial states
- **Rollback** — set an older deployment's `is_live = true` to instantly roll back
- **Zero downtime** — editor can change things without affecting live visitors

---

## 11. Table: `page_versions`

> Auto-saved snapshots of a page's components during the editing process.

### Purpose
Provides a draft version history so editors can undo destructive changes. Different from `deployments` — these are draft saves, not published states.

### Schema

```sql
CREATE TABLE page_versions (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Parent Page ──────────────────────────────────────────────────────
  page_id                 UUID          NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  -- ── Who Saved ────────────────────────────────────────────────────────
  saved_by                UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- NULL if auto-saved by system (e.g., timed save)

  -- ── Version Content ──────────────────────────────────────────────────
  content_snapshot        JSONB         NOT NULL,
  -- Array of component states at save time.
  -- [{ "id": "...", "type": "hero", "props": {...}, "order_key": "a0", "is_visible": true }, ...]
  -- Note: We snapshot component STATE, not the component rows themselves.

  -- ── Version Label ─────────────────────────────────────────────────────
  label                   TEXT,
  -- Human-readable label. Auto-generated or manual.
  -- Auto: "Auto-save — 2:34 PM" or "Before AI regeneration"
  -- Manual: Editor can name it: "Homepage before redesign"

  -- ── Trigger ──────────────────────────────────────────────────────────
  trigger                 TEXT          NOT NULL DEFAULT 'auto'
                          CHECK (trigger IN ('auto', 'manual', 'pre_ai', 'pre_restore', 'pre_publish')),
  -- 'auto'         → Triggered by 30-second auto-save timer
  -- 'manual'       → Editor explicitly clicked "Save Version"
  -- 'pre_ai'       → Saved automatically before AI regenerates content
  --                  (so you can undo the AI changes)
  -- 'pre_restore'  → Saved before restoring a different version
  --                  (so the restore itself is undoable)
  -- 'pre_publish'  → Saved at the moment of publishing

  -- ── Metadata ─────────────────────────────────────────────────────────
  saved_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `page_versions.page_id` → `pages.id`
- `page_versions.saved_by` → `users.id`

### Pruning Logic
- Max versions per page is defined by `plans.version_history_limit`
- Starter = 5, Growth = 20, Pro = 50
- A DB trigger or application logic deletes the oldest versions when the limit is exceeded

---

## 12. Table: `assets`

> References to all media files uploaded by a tenant, stored on Cloudinary.

### Purpose
We don't store actual files in the database. Files go to Cloudinary. This table stores the metadata and Cloudinary reference so we can list assets, check storage quotas, and delete them when needed.

### Schema

```sql
CREATE TABLE assets (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Ownership ────────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- ── File Identity ────────────────────────────────────────────────────
  original_filename       TEXT          NOT NULL,
  -- The filename as uploaded: 'my-logo.png', 'hero-background.jpg'

  display_name            TEXT,
  -- Optional custom name set by user in asset manager

  -- ── Cloudinary Data ───────────────────────────────────────────────────
  cloudinary_public_id    TEXT          NOT NULL UNIQUE,
  -- Cloudinary's internal ID: 'sitepilot/tenants/uuid/my-logo-xk7j'
  -- Used for Cloudinary API calls (transformations, deletion)

  cloudinary_url          TEXT          NOT NULL,
  -- The full Cloudinary CDN URL:
  -- 'https://res.cloudinary.com/sitepilot/image/upload/v1234/sitepilot/tenants/...'

  secure_url              TEXT          NOT NULL,
  -- HTTPS version of cloudinary_url (always use this in img src)

  -- ── File Metadata ────────────────────────────────────────────────────
  asset_type              TEXT          NOT NULL DEFAULT 'image'
                          CHECK (asset_type IN ('image', 'video', 'raw', 'audio')),
  -- Cloudinary resource type

  format                  TEXT,
  -- File extension: 'jpg', 'png', 'webp', 'svg', 'mp4', 'pdf'

  size_bytes              BIGINT        NOT NULL DEFAULT 0,
  -- File size in bytes. Used for storage quota calculation.

  width                   INT,
  -- Image width in pixels. NULL for non-image types.

  height                  INT,
  -- Image height in pixels. NULL for non-image types.

  -- ── Upload Info ──────────────────────────────────────────────────────
  uploaded_by             UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- Who uploaded this file

  upload_source           TEXT          DEFAULT 'manual'
                          CHECK (upload_source IN ('manual', 'ai_generated', 'import')),
  -- 'manual'       → User uploaded directly
  -- 'ai_generated' → Generated/fetched by AI system
  -- 'import'       → Imported from external URL

  -- ── Tags ─────────────────────────────────────────────────────────────
  tags                    TEXT[]        NOT NULL DEFAULT '{}',
  -- Array of strings for filtering in the asset manager
  -- e.g., ['logo', 'hero', 'team']

  -- ── Usage Tracking ───────────────────────────────────────────────────
  used_in_websites        UUID[]        NOT NULL DEFAULT '{}',
  -- Array of website IDs where this asset is currently referenced
  -- Updated when component props containing this asset URL are saved

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Relationships
- `assets.tenant_id` → `tenants.id`
- `assets.uploaded_by` → `users.id`

### Storage Quota Calculation

```sql
-- Get total storage used by a tenant in MB
SELECT
  SUM(size_bytes) / 1048576.0 AS storage_used_mb
FROM assets
WHERE tenant_id = $1;
```

---

## 13. Table: `ai_usage_log`

> Tracks every AI credit consumption event per tenant.

### Purpose
AI calls are expensive. This table enables per-tenant monthly quota enforcement and provides usage data for the analytics dashboard.

### Schema

```sql
CREATE TABLE ai_usage_log (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Who Used It ──────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                 UUID          REFERENCES users(id) ON DELETE SET NULL,

  -- ── What Was Done ────────────────────────────────────────────────────
  action_type             TEXT          NOT NULL
                          CHECK (action_type IN (
                            'generate_layout',
                            'suggest_copy',
                            'seo_optimize',
                            'regenerate_section',
                            'suggest_color_palette',
                            'generate_page'
                          )),
  -- 'generate_layout'       → Full website layout from chatbot answers
  -- 'suggest_copy'          → Headline/copy suggestion for a component
  -- 'seo_optimize'          → Generate SEO meta for a page
  -- 'regenerate_section'    → Re-generate one component's content
  -- 'suggest_color_palette' → Suggest brand color palette
  -- 'generate_page'         → Generate an entire new page

  -- ── Context ──────────────────────────────────────────────────────────
  website_id              UUID          REFERENCES websites(id) ON DELETE SET NULL,
  page_id                 UUID          REFERENCES pages(id) ON DELETE SET NULL,
  -- Optional: which website/page triggered this

  -- ── Token Usage ──────────────────────────────────────────────────────
  prompt_tokens           INT           NOT NULL DEFAULT 0,
  -- Number of tokens in the request sent to Claude

  completion_tokens       INT           NOT NULL DEFAULT 0,
  -- Number of tokens in Claude's response

  total_tokens            INT           GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  -- Auto-calculated total. Used for cost monitoring.

  -- ── Cost Tracking ────────────────────────────────────────────────────
  estimated_cost_usd      NUMERIC(8,6)  NOT NULL DEFAULT 0,
  -- Estimated API cost in USD based on Claude pricing
  -- For cost monitoring/optimization purposes only

  -- ── Status ───────────────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'success'
                          CHECK (status IN ('success', 'failed', 'rate_limited')),
  -- Even failed attempts are logged to prevent abuse

  error_message           TEXT,
  -- Error message if status = 'failed'

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Quota Query

```sql
-- Check how many AI credits used this month by a tenant
SELECT COUNT(*) AS credits_used
FROM ai_usage_log
WHERE tenant_id = $1
  AND status = 'success'
  AND created_at >= date_trunc('month', NOW());
```

---

## 14. Table: `usage_metrics`

> Daily aggregated website analytics data.

### Purpose
Stores traffic and engagement data collected by the tracking pixel embedded in published sites. Aggregated daily for efficient querying.

### Schema

```sql
CREATE TABLE usage_metrics (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Scoping ──────────────────────────────────────────────────────────
  website_id              UUID          NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  date                    DATE          NOT NULL,
  -- One row per website per day

  -- ── Traffic Metrics ──────────────────────────────────────────────────
  page_views              INT           NOT NULL DEFAULT 0,
  -- Total number of page loads that day

  unique_visitors         INT           NOT NULL DEFAULT 0,
  -- Estimated unique visitors (based on fingerprint/session)

  sessions                INT           NOT NULL DEFAULT 0,
  -- Number of distinct user sessions

  -- ── Performance ──────────────────────────────────────────────────────
  bandwidth_mb            NUMERIC(10,3) NOT NULL DEFAULT 0,
  -- Total data served in MB

  avg_load_time_ms        INT,
  -- Average page load time in milliseconds

  -- ── Engagement ───────────────────────────────────────────────────────
  bounce_rate             NUMERIC(5,2),
  -- Percentage of single-page sessions (0.00 to 100.00)

  avg_session_duration_s  INT,
  -- Average time spent on site in seconds

  -- ── Traffic Sources ──────────────────────────────────────────────────
  referrer_breakdown      JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- { "direct": 120, "google": 45, "twitter": 12, "other": 8 }

  top_pages               JSONB         NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "slug": "/", "views": 200 }, { "slug": "/menu", "views": 80 }]

  -- ── Geographic ───────────────────────────────────────────────────────
  country_breakdown       JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- { "US": 150, "IN": 45, "UK": 30, "other": 20 }

  -- ── Device ───────────────────────────────────────────────────────────
  device_breakdown        JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- { "mobile": 180, "desktop": 120, "tablet": 20 }

  -- ── Constraint ───────────────────────────────────────────────────────
  UNIQUE(website_id, date)
  -- One row per website per day. Use UPSERT when recording events.
);
```

### Raw Event Collection

Events are collected via API and batched into daily aggregates:

```sql
-- The raw events table (high-volume, auto-purged after 7 days)
CREATE TABLE raw_page_events (
  id          BIGSERIAL     PRIMARY KEY,
  website_id  UUID          NOT NULL,
  page_slug   TEXT          NOT NULL,
  visitor_id  TEXT,         -- anonymous fingerprint
  referrer    TEXT,
  country     TEXT,         -- from IP geolocation
  device      TEXT,         -- 'mobile', 'desktop', 'tablet'
  user_agent  TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
-- Partitioned by day for performance. Purged after 7 days.
-- Daily cron job aggregates into usage_metrics.
```

---

## 15. Table: `domain_verifications`

> Tracks the DNS verification status for custom domains.

### Schema

```sql
CREATE TABLE domain_verifications (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Target Website ───────────────────────────────────────────────────
  website_id              UUID          NOT NULL UNIQUE REFERENCES websites(id) ON DELETE CASCADE,
  -- UNIQUE: one verification record per website

  -- ── Domain Details ───────────────────────────────────────────────────
  domain                  TEXT          NOT NULL,
  -- The domain the tenant wants to connect: 'www.mybakery.com'

  cname_target            TEXT          NOT NULL,
  -- What the tenant must point their CNAME to: 'mybakery-x7k2.sitepilot.io'
  -- Shown to user as an instruction

  -- ── Verification Status ───────────────────────────────────────────────
  verified                BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE once DNS CNAME check passes

  verification_attempts   INT           NOT NULL DEFAULT 0,
  -- How many times we've checked. For monitoring/alerting.

  last_checked_at         TIMESTAMPTZ,
  -- When was the most recent DNS check attempt

  first_verified_at       TIMESTAMPTZ,
  -- When verification first succeeded

  -- ── SSL ──────────────────────────────────────────────────────────────
  ssl_provisioned         BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE once Vercel/Caddy has provisioned an SSL certificate for this domain

  ssl_provisioned_at      TIMESTAMPTZ,

  -- ── Error Tracking ───────────────────────────────────────────────────
  last_error              TEXT,
  -- Last DNS resolution error message: 'NXDOMAIN', 'SERVFAIL', 'Incorrect CNAME target'

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## 16. Table: `team_invitations`

> Tracks pending email invitations sent to new team members.

### Schema

```sql
CREATE TABLE team_invitations (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Scope ────────────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by              UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- ── Invite Details ───────────────────────────────────────────────────
  email                   TEXT          NOT NULL,
  -- The email address the invitation was sent to

  role                    TEXT          NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('admin', 'editor', 'developer', 'viewer')),
  -- The role the invited person will receive when they accept
  -- Note: 'owner' cannot be invited — ownership is transferred, not shared

  -- ── Token ────────────────────────────────────────────────────────────
  token                   TEXT          NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  -- Secure random token included in the invite URL
  -- URL format: https://app.sitepilot.io/accept-invite?token=xxx

  -- ── Status ───────────────────────────────────────────────────────────
  status                  TEXT          NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  -- 'pending'  → Email sent, waiting for acceptance
  -- 'accepted' → User clicked link and created account
  -- 'expired'  → Token expired after 7 days without acceptance
  -- 'revoked'  → Admin cancelled the invitation

  -- ── Expiry ───────────────────────────────────────────────────────────
  expires_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  -- Invitations expire 7 days after being sent

  accepted_at             TIMESTAMPTZ,
  -- When the invited person accepted (clicked the link)

  -- ── Metadata ─────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Constraints ──────────────────────────────────────────────────────
  UNIQUE(tenant_id, email)
  -- Cannot send two pending invitations to the same email for the same tenant
);
```

---

## 17. Table: `audit_logs`

> Immutable record of all significant actions taken in the platform.

### Purpose
Security, compliance, and debugging. Answers "who did what, when?"

### Schema

```sql
CREATE TABLE audit_logs (
  -- ── Identity ────────────────────────────────────────────────────────
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Scope ────────────────────────────────────────────────────────────
  tenant_id               UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  performed_by            UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- NULL if action was performed by system (e.g., automated downgrade)

  -- ── Event ────────────────────────────────────────────────────────────
  action                  TEXT          NOT NULL,
  -- Dot-notation action name:
  -- 'website.created', 'website.published', 'website.deleted'
  -- 'page.created', 'page.deleted'
  -- 'user.invited', 'user.role_changed', 'user.removed'
  -- 'billing.plan_upgraded', 'billing.plan_downgraded'
  -- 'domain.added', 'domain.verified', 'domain.removed'
  -- 'tenant.settings_updated', 'tenant.offboarded'

  resource_type           TEXT,
  -- The type of resource affected: 'website', 'page', 'user', 'subscription'

  resource_id             UUID,
  -- The UUID of the affected resource

  -- ── Details ──────────────────────────────────────────────────────────
  metadata                JSONB         NOT NULL DEFAULT '{}'::jsonb,
  -- Additional context about the action.
  -- For 'user.role_changed': { "from": "editor", "to": "admin", "user_id": "..." }
  -- For 'billing.plan_upgraded': { "from_plan": "starter", "to_plan": "growth" }
  -- For 'website.published': { "deployment_id": "...", "pages_count": 5 }

  -- ── Request Context ──────────────────────────────────────────────────
  ip_address              INET,
  -- IP address of the request

  user_agent              TEXT,
  -- Browser/client user agent string

  -- ── Timestamp ────────────────────────────────────────────────────────
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- Audit logs are NEVER updated or deleted
);
```

---

## 18. JSONB Field Schemas

> Detailed documentation of every JSONB field used across all tables.

---

### `websites.branding_config`

```json
{
  "colors": {
    "primary":    "#FF6B35",
    "secondary":  "#2D3436",
    "background": "#FFFFFF",
    "surface":    "#F8F9FA",
    "text":       "#2D3436",
    "text_muted": "#636E72",
    "accent":     "#FDCB6E",
    "danger":     "#D63031",
    "success":    "#00B894"
  },
  "typography": {
    "heading_font":   "Playfair Display",
    "body_font":      "Inter",
    "base_font_size": 16,
    "line_height":    1.6,
    "heading_weight": 700
  },
  "logo": {
    "url":    "https://res.cloudinary.com/.../logo.png",
    "alt":    "Pizza Palace",
    "width":  160,
    "height": 50
  },
  "spacing": {
    "section_padding_y": "80px",
    "container_max_width": "1280px"
  },
  "border_radius": {
    "button": "8px",
    "card":   "12px",
    "input":  "6px"
  }
}
```

---

### `pages.seo_meta`

```json
{
  "title":        "Our Menu | Pizza Palace",
  "description":  "Fresh Italian pizzas made with local ingredients. View our full menu.",
  "og_title":     "Pizza Palace Menu",
  "og_description": "Hand-crafted pizzas since 2012.",
  "og_image":     "https://res.cloudinary.com/.../menu-og.jpg",
  "og_type":      "website",
  "twitter_card": "summary_large_image",
  "canonical_url": "https://www.pizzapalace.com/menu",
  "no_index":     false,
  "no_follow":    false,
  "structured_data": {}
}
```

---

### `components.props` — By Component Type

#### `navbar`
```json
{
  "logo": {
    "url":  "https://res.cloudinary.com/.../logo.png",
    "alt":  "Pizza Palace",
    "width": 140
  },
  "links": [
    { "label": "Home",    "href": "/",        "is_external": false },
    { "label": "Menu",    "href": "/menu",     "is_external": false },
    { "label": "Contact", "href": "/contact",  "is_external": false }
  ],
  "style":             "sticky",
  "background_color":  "transparent",
  "text_color":        "#FFFFFF",
  "show_cta_button":   true,
  "cta_label":         "Order Now",
  "cta_href":          "/order",
  "mobile_breakpoint": 768
}
```

#### `hero`
```json
{
  "heading":           "Authentic Italian Pizza",
  "subheading":        "Made fresh daily with locally sourced ingredients.",
  "cta_primary_label": "View Menu",
  "cta_primary_href":  "/menu",
  "cta_secondary_label": "Our Story",
  "cta_secondary_href":  "/about",
  "background_type":   "image",
  "background_image":  "https://res.cloudinary.com/.../hero-bg.jpg",
  "background_overlay_opacity": 0.4,
  "background_color":  "#1A1A2E",
  "text_align":        "center",
  "min_height":        "80vh",
  "heading_size":      "5xl",
  "text_color":        "#FFFFFF"
}
```

#### `features`
```json
{
  "heading":    "Why Choose Us",
  "subheading": "We've been serving the community for over 10 years.",
  "layout":     "3-column",
  "items": [
    {
      "icon":        "flame",
      "title":       "Wood-Fired Oven",
      "description": "Our pizzas are cooked at 900°F for perfect crispiness.",
      "icon_color":  "#FF6B35"
    },
    {
      "icon":        "leaf",
      "title":       "Fresh Ingredients",
      "description": "Locally sourced produce, never frozen.",
      "icon_color":  "#00B894"
    }
  ]
}
```

#### `gallery`
```json
{
  "heading":    "Our Food",
  "layout":     "masonry",
  "columns":    3,
  "images": [
    {
      "url":     "https://res.cloudinary.com/.../pizza-1.jpg",
      "alt":     "Margherita Pizza",
      "caption": "Classic Margherita"
    }
  ],
  "enable_lightbox": true,
  "show_captions":   true
}
```

#### `testimonials`
```json
{
  "heading":  "What Our Customers Say",
  "layout":   "grid",
  "reviews": [
    {
      "name":       "Sarah M.",
      "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
      "rating":     5,
      "text":       "Best pizza in the city, hands down!",
      "source":     "Google",
      "date":       "2024-11-15"
    }
  ]
}
```

#### `contact_form`
```json
{
  "heading":      "Get In Touch",
  "subheading":   "We'd love to hear from you.",
  "recipient_email": "hello@pizzapalace.com",
  "fields": [
    { "name": "name",    "label": "Your Name",    "type": "text",     "required": true },
    { "name": "email",   "label": "Email",         "type": "email",    "required": true },
    { "name": "phone",   "label": "Phone",         "type": "tel",      "required": false },
    { "name": "message", "label": "Message",       "type": "textarea", "required": true }
  ],
  "submit_label":        "Send Message",
  "success_message":     "Thanks! We'll get back to you within 24 hours.",
  "show_address":        true,
  "address":             "123 Main St, Chicago, IL 60601",
  "show_phone":          true,
  "phone":               "+1 (312) 555-0123",
  "show_business_hours": true,
  "business_hours":      "Mon–Fri: 11am–10pm, Sat–Sun: 10am–11pm"
}
```

#### `footer`
```json
{
  "logo_url":   "https://res.cloudinary.com/.../logo-white.png",
  "tagline":    "Authentic Italian since 2012.",
  "columns": [
    {
      "heading": "Quick Links",
      "links": [
        { "label": "Menu",    "href": "/menu" },
        { "label": "About",   "href": "/about" },
        { "label": "Contact", "href": "/contact" }
      ]
    }
  ],
  "social_links": [
    { "platform": "instagram", "url": "https://instagram.com/pizzapalace" },
    { "platform": "facebook",  "url": "https://facebook.com/pizzapalace" }
  ],
  "copyright":           "© 2025 Pizza Palace. All rights reserved.",
  "show_powered_by":     true,
  "background_color":    "#1A1A2E",
  "text_color":          "#FFFFFF"
}
```

---

### `users.preferences`

```json
{
  "theme":              "light",
  "sidebar_collapsed":  false,
  "default_website_id": "uuid-of-last-used-website",
  "notifications": {
    "email_on_comment":  true,
    "email_on_publish":  true,
    "email_on_billing":  true
  },
  "builder": {
    "show_grid":         false,
    "auto_save_interval": 30,
    "default_view":      "desktop"
  }
}
```

---

## 19. Enums & Allowed Values

### Quick Reference: All CHECK Constraints

| Table | Column | Allowed Values |
|---|---|---|
| `tenants` | `status` | `active`, `suspended`, `offboarded`, `pending` |
| `users` | `role` | `owner`, `admin`, `editor`, `developer`, `viewer` |
| `subscriptions` | `status` | `active`, `trialing`, `past_due`, `cancelled`, `unpaid`, `incomplete`, `paused` |
| `subscriptions` | `billing_cycle` | `monthly`, `yearly`, `none` |
| `websites` | `status` | `draft`, `published`, `archived`, `suspended` |
| `pages` | `status` | `draft`, `published`, `hidden` |
| `components` | `type` | `navbar`, `hero`, `features`, `gallery`, `testimonials`, `pricing`, `cta`, `contact_form`, `team`, `faq`, `stats`, `blog_grid`, `video_embed`, `map`, `rich_text`, `image_text`, `footer`, `custom_html` |
| `assets` | `asset_type` | `image`, `video`, `raw`, `audio` |
| `assets` | `upload_source` | `manual`, `ai_generated`, `import` |
| `page_versions` | `trigger` | `auto`, `manual`, `pre_ai`, `pre_restore`, `pre_publish` |
| `ai_usage_log` | `action_type` | `generate_layout`, `suggest_copy`, `seo_optimize`, `regenerate_section`, `suggest_color_palette`, `generate_page` |
| `ai_usage_log` | `status` | `success`, `failed`, `rate_limited` |
| `team_invitations` | `role` | `admin`, `editor`, `developer`, `viewer` |
| `team_invitations` | `status` | `pending`, `accepted`, `expired`, `revoked` |

---

## 20. Row-Level Security Policies

> These policies ensure one tenant's data is NEVER accessible to another tenant's queries.

### How RLS Works Here

Before every database query, the application sets a session variable:

```sql
-- Set in a transaction wrapper before every query
SELECT set_config('app.current_tenant_id', 'uuid-of-tenant', true);
```

Then PostgreSQL automatically filters all queries using the RLS policies.

### Enabling RLS

```sql
-- Enable RLS on all tenant-specific tables
ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE components           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- ── tenants ──────────────────────────────────────────────────────────────
CREATE POLICY tenant_self_access ON tenants
  USING (id = current_setting('app.current_tenant_id', true)::uuid);

-- ── users ──────────────────────────────────────────────────────────────
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ── websites ──────────────────────────────────────────────────────────
CREATE POLICY websites_tenant_isolation ON websites
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ── pages (via websites) ──────────────────────────────────────────────
CREATE POLICY pages_tenant_isolation ON pages
  USING (
    website_id IN (
      SELECT id FROM websites
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ── components (via pages → websites) ────────────────────────────────
CREATE POLICY components_tenant_isolation ON components
  USING (
    page_id IN (
      SELECT p.id FROM pages p
      JOIN websites w ON w.id = p.website_id
      WHERE w.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ── Direct tenant_id tables ──────────────────────────────────────────
-- (Same pattern for: assets, ai_usage_log, subscriptions,
--  team_invitations, audit_logs)

CREATE POLICY assets_tenant_isolation ON assets
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY ai_log_tenant_isolation ON ai_usage_log
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ── Public site access (bypass RLS for published sites) ──────────────
-- The site renderer needs to read deployment snapshots without a tenant session.
-- Solution: Use the Supabase service role key ONLY for the public renderer,
-- but only query the snapshot_json field, never raw components.

-- Alternatively, create a special read-only policy for deployments:
CREATE POLICY deployments_public_read ON deployments
  FOR SELECT
  USING (is_live = TRUE);
  -- Anyone can read live deployments (the snapshot is already sanitized)
```

---

## 21. Indexes

> Performance-critical indexes for the most common query patterns.

```sql
-- ── tenants ──────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_tenants_slug
  ON tenants(slug);
-- Used on every page request to resolve tenant from subdomain

CREATE INDEX idx_tenants_stripe_customer
  ON tenants(stripe_customer_id);
-- Used by Stripe webhook handler to find tenant from customer ID

CREATE INDEX idx_tenants_status
  ON tenants(status)
  WHERE status != 'active';
-- Used for admin queries to find suspended/offboarded tenants

-- ── users ──────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_users_firebase_uid
  ON users(firebase_uid);
-- Used on every API request to resolve user from Firebase JWT

CREATE INDEX idx_users_tenant_id
  ON users(tenant_id);
-- Used to list all team members for a tenant

CREATE INDEX idx_users_email
  ON users(email);
-- Used to check for duplicate invitations

-- ── websites ──────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_websites_subdomain
  ON websites(subdomain)
  WHERE subdomain IS NOT NULL;
-- Used by middleware to route subdomain requests

CREATE UNIQUE INDEX idx_websites_custom_domain
  ON websites(custom_domain)
  WHERE custom_domain IS NOT NULL;
-- Used to route custom domain requests

CREATE INDEX idx_websites_tenant_id
  ON websites(tenant_id);
-- Used to list all websites for a tenant

CREATE INDEX idx_websites_status
  ON websites(tenant_id, status);
-- Used to count active websites for plan limit checking

-- ── pages ──────────────────────────────────────────────────────────────
CREATE INDEX idx_pages_website_id
  ON pages(website_id);
-- Used to fetch all pages for a website

CREATE UNIQUE INDEX idx_pages_website_slug
  ON pages(website_id, slug);
-- Used to find a specific page by URL slug on a published site

CREATE UNIQUE INDEX idx_pages_home_page
  ON pages(website_id)
  WHERE is_home = TRUE;
-- Ensures only ONE home page per website

-- ── components ──────────────────────────────────────────────────────
CREATE INDEX idx_components_page_id_order
  ON components(page_id, order_key ASC);
-- Primary query: fetch all components for a page in order

CREATE INDEX idx_components_type
  ON components(page_id, type);
-- Used to find specific component types (e.g., find navbar)

-- ── deployments ────────────────────────────────────────────────────
CREATE INDEX idx_deployments_website_id
  ON deployments(website_id, deployed_at DESC);
-- Used to list deployment history for a website

CREATE UNIQUE INDEX idx_deployments_live
  ON deployments(website_id)
  WHERE is_live = TRUE;
-- Ensures only ONE live deployment per website at a time

-- ── page_versions ──────────────────────────────────────────────────
CREATE INDEX idx_page_versions_page_id_date
  ON page_versions(page_id, saved_at DESC);
-- Used to list version history for a page

-- ── assets ─────────────────────────────────────────────────────────
CREATE INDEX idx_assets_tenant_id
  ON assets(tenant_id, created_at DESC);
-- Used to list assets in asset manager

CREATE UNIQUE INDEX idx_assets_cloudinary_id
  ON assets(cloudinary_public_id);
-- Used to prevent duplicate uploads

-- ── ai_usage_log ───────────────────────────────────────────────────
CREATE INDEX idx_ai_usage_tenant_month
  ON ai_usage_log(tenant_id, created_at DESC);
-- Used for monthly credit counting

-- ── usage_metrics ──────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_metrics_website_date
  ON usage_metrics(website_id, date);
-- Used for UPSERT and date range queries

CREATE INDEX idx_metrics_date
  ON usage_metrics(date DESC);
-- Used for platform-wide analytics queries

-- ── team_invitations ───────────────────────────────────────────────
CREATE INDEX idx_invitations_token
  ON team_invitations(token)
  WHERE status = 'pending';
-- Used to validate invitation links
```

---

## 22. Database Functions & Triggers

### Trigger: Auto-update `updated_at`

```sql
-- Create the function once
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that has updated_at
CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_websites
  BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_pages
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_components
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (Repeat for users, subscriptions, domain_verifications)
```

### Trigger: Enforce Single Live Deployment

```sql
-- When a new deployment is set to is_live = TRUE,
-- automatically set all other deployments for the same website to FALSE
CREATE OR REPLACE FUNCTION enforce_single_live_deployment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_live = TRUE THEN
    UPDATE deployments
    SET is_live = FALSE
    WHERE website_id = NEW.website_id
      AND id != NEW.id
      AND is_live = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_live_deployment
  AFTER INSERT OR UPDATE ON deployments
  FOR EACH ROW EXECUTE FUNCTION enforce_single_live_deployment();
```

### Trigger: Enforce Single Home Page

```sql
CREATE OR REPLACE FUNCTION enforce_single_home_page()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_home = TRUE THEN
    UPDATE pages
    SET is_home = FALSE
    WHERE website_id = NEW.website_id
      AND id != NEW.id
      AND is_home = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_home_page
  AFTER INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION enforce_single_home_page();
```

### Function: Get Storage Used (MB)

```sql
CREATE OR REPLACE FUNCTION get_tenant_storage_mb(tid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(size_bytes), 0) / 1048576.0
  FROM assets
  WHERE tenant_id = tid;
$$ LANGUAGE SQL STABLE;
```

### Function: Get Monthly AI Credits Used

```sql
CREATE OR REPLACE FUNCTION get_monthly_ai_credits(tid UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM ai_usage_log
  WHERE tenant_id = tid
    AND status = 'success'
    AND created_at >= date_trunc('month', NOW());
$$ LANGUAGE SQL STABLE;
```

### Function: Get Total Page Views (Last N Days)

```sql
CREATE OR REPLACE FUNCTION get_total_page_views(tid UUID, since TIMESTAMPTZ)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(m.page_views), 0)
  FROM usage_metrics m
  JOIN websites w ON w.id = m.website_id
  WHERE w.tenant_id = tid
    AND m.date >= since::DATE;
$$ LANGUAGE SQL STABLE;
```

### Function: Prune Old Page Versions

```sql
-- Called by application after saving a new version
CREATE OR REPLACE FUNCTION prune_page_versions(p_page_id UUID, max_versions INT)
RETURNS VOID AS $$
DECLARE
  v_count INT;
  v_ids UUID[];
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM page_versions WHERE page_id = p_page_id;

  IF v_count > max_versions THEN
    SELECT ARRAY_AGG(id ORDER BY saved_at DESC)
    INTO v_ids
    FROM page_versions
    WHERE page_id = p_page_id;

    DELETE FROM page_versions
    WHERE id = ANY(v_ids[max_versions+1:]);
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 23. Prisma Schema

> Use this in your Next.js project for type-safe DB access.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Plan {
  id                    String    @id @default(uuid())
  name                  String    @unique
  slug                  String    @unique
  description           String?
  isActive              Boolean   @default(true) @map("is_active")
  maxWebsites           Int       @map("max_websites")
  maxPagesPerSite       Int       @map("max_pages_per_site")
  storageLimitMb        Int       @map("storage_limit_mb")
  aiCreditsPerMonth     Int       @map("ai_credits_per_month")
  customDomainAllowed   Boolean   @default(false) @map("custom_domain_allowed")
  versionHistoryLimit   Int       @default(5) @map("version_history_limit")
  collaborationEnabled  Boolean   @default(false) @map("collaboration_enabled")
  maxCollaborators      Int       @default(1) @map("max_collaborators")
  analyticsEnabled      Boolean   @default(false) @map("analytics_enabled")
  prioritySupport       Boolean   @default(false) @map("priority_support")
  priceMonthly          Int       @default(0) @map("price_monthly_cents")
  priceYearly           Int       @default(0) @map("price_yearly_cents")
  stripeMonthlyPriceId  String?   @map("stripe_monthly_price_id")
  stripeYearlyPriceId   String?   @map("stripe_yearly_price_id")
  displayOrder          Int       @default(0) @map("display_order")
  badgeText             String?   @map("badge_text")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  tenants               Tenant[]

  @@map("plans")
}

model Tenant {
  id                  String        @id @default(uuid())
  name                String
  slug                String        @unique
  planId              String        @map("plan_id")
  status              String        @default("active")
  stripeCustomerId    String?       @unique @map("stripe_customer_id")
  logoUrl             String?       @map("logo_url")
  timezone            String        @default("UTC")
  locale              String        @default("en")
  onboardingCompleted Boolean       @default(false) @map("onboarding_completed")
  offboardScheduledAt DateTime?     @map("offboard_scheduled_at")
  lastActiveAt        DateTime?     @map("last_active_at")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  plan                Plan          @relation(fields: [planId], references: [id])
  users               User[]
  websites            Website[]
  subscription        Subscription?
  assets              Asset[]
  aiUsageLogs         AiUsageLog[]
  teamInvitations     TeamInvitation[]
  auditLogs           AuditLog[]

  @@map("tenants")
}

model User {
  id                  String        @id @default(uuid())
  firebaseUid         String        @unique @map("firebase_uid")
  email               String
  fullName            String?       @map("full_name")
  avatarUrl           String?       @map("avatar_url")
  tenantId            String        @map("tenant_id")
  role                String        @default("editor")
  invitedBy           String?       @map("invited_by")
  invitationAcceptedAt DateTime?    @map("invitation_accepted_at")
  isActive            Boolean       @default(true) @map("is_active")
  preferences         Json          @default("{}")
  lastLoginAt         DateTime?     @map("last_login_at")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  tenant              Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  inviter             User?         @relation("UserInvitedBy", fields: [invitedBy], references: [id])
  invitees            User[]        @relation("UserInvitedBy")
  deployments         Deployment[]
  pageVersions        PageVersion[]
  assets              Asset[]
  aiUsageLogs         AiUsageLog[]
  auditLogs           AuditLog[]

  @@map("users")
}

model Subscription {
  id                    String    @id @default(uuid())
  tenantId              String    @unique @map("tenant_id")
  stripeSubscriptionId  String?   @unique @map("stripe_subscription_id")
  stripeCustomerId      String    @map("stripe_customer_id")
  stripePriceId         String?   @map("stripe_price_id")
  status                String    @default("active")
  billingCycle          String    @default("none") @map("billing_cycle")
  currentPeriodStart    DateTime? @map("current_period_start")
  currentPeriodEnd      DateTime? @map("current_period_end")
  trialEnd              DateTime? @map("trial_end")
  cancelAtPeriodEnd     Boolean   @default(false) @map("cancel_at_period_end")
  cancelledAt           DateTime? @map("cancelled_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model Website {
  id                  String                @id @default(uuid())
  tenantId            String                @map("tenant_id")
  name                String
  description         String?
  subdomain           String?               @unique
  customDomain        String?               @unique @map("custom_domain")
  domainVerified      Boolean               @default(false) @map("domain_verified")
  status              String                @default("draft")
  brandingConfig      Json                  @default("{}") @map("branding_config")
  seoDefaults         Json                  @default("{}") @map("seo_defaults")
  analyticsEnabled    Boolean               @default(true) @map("analytics_enabled")
  templateId          String?               @map("template_id")
  aiGenerated         Boolean               @default(false) @map("ai_generated")
  faviconUrl          String?               @map("favicon_url")
  createdAt           DateTime              @default(now()) @map("created_at")
  updatedAt           DateTime              @updatedAt @map("updated_at")
  publishedAt         DateTime?             @map("published_at")
  lastDeployedAt      DateTime?             @map("last_deployed_at")

  tenant              Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pages               Page[]
  deployments         Deployment[]
  domainVerification  DomainVerification?
  usageMetrics        UsageMetric[]

  @@map("websites")
}

model Page {
  id                  String          @id @default(uuid())
  websiteId           String          @map("website_id")
  title               String
  slug                String
  status              String          @default("draft")
  isHome              Boolean         @default(false) @map("is_home")
  showInNav           Boolean         @default(true) @map("show_in_nav")
  navOrder            Int             @default(0) @map("nav_order")
  navLabel            String?         @map("nav_label")
  seoMeta             Json            @default("{}") @map("seo_meta")
  pageConfig          Json            @default("{}") @map("page_config")
  passwordProtected   Boolean         @default(false) @map("password_protected")
  passwordHash        String?         @map("password_hash")
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  website             Website         @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  components          Component[]
  versions            PageVersion[]

  @@unique([websiteId, slug])
  @@map("pages")
}

model Component {
  id              String    @id @default(uuid())
  pageId          String    @map("page_id")
  type            String
  orderKey        String    @map("order_key")
  isVisible       Boolean   @default(true) @map("is_visible")
  isLocked        Boolean   @default(false) @map("is_locked")
  props           Json      @default("{}")
  aiGenerated     Boolean   @default(false) @map("ai_generated")
  requiredPlan    String?   @map("required_plan")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  page            Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@map("components")
}

model Deployment {
  id            String    @id @default(uuid())
  websiteId     String    @map("website_id")
  deployedBy    String?   @map("deployed_by")
  snapshotJson  Json      @map("snapshot_json")
  isLive        Boolean   @default(false) @map("is_live")
  deployedAt    DateTime  @default(now()) @map("deployed_at")
  notes         String?

  website       Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  user          User?     @relation(fields: [deployedBy], references: [id], onDelete: SetNull)

  @@map("deployments")
}

model PageVersion {
  id               String    @id @default(uuid())
  pageId           String    @map("page_id")
  savedBy          String?   @map("saved_by")
  contentSnapshot  Json      @map("content_snapshot")
  label            String?
  trigger          String    @default("auto")
  savedAt          DateTime  @default(now()) @map("saved_at")

  page             Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  user             User?     @relation(fields: [savedBy], references: [id], onDelete: SetNull)

  @@map("page_versions")
}

model Asset {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  originalFilename    String    @map("original_filename")
  displayName         String?   @map("display_name")
  cloudinaryPublicId  String    @unique @map("cloudinary_public_id")
  cloudinaryUrl       String    @map("cloudinary_url")
  secureUrl           String    @map("secure_url")
  assetType           String    @default("image") @map("asset_type")
  format              String?
  sizeBytes           BigInt    @default(0) @map("size_bytes")
  width               Int?
  height              Int?
  uploadedBy          String?   @map("uploaded_by")
  uploadSource        String    @default("manual") @map("upload_source")
  tags                String[]  @default([])
  usedInWebsites      String[]  @default([]) @map("used_in_websites")
  createdAt           DateTime  @default(now()) @map("created_at")

  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  uploader            User?     @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  @@map("assets")
}

model AiUsageLog {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  userId              String?   @map("user_id")
  actionType          String    @map("action_type")
  websiteId           String?   @map("website_id")
  pageId              String?   @map("page_id")
  promptTokens        Int       @default(0) @map("prompt_tokens")
  completionTokens    Int       @default(0) @map("completion_tokens")
  estimatedCostUsd    Decimal   @default(0) @map("estimated_cost_usd") @db.Decimal(8,6)
  status              String    @default("success")
  errorMessage        String?   @map("error_message")
  createdAt           DateTime  @default(now()) @map("created_at")

  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user                User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("ai_usage_log")
}

model UsageMetric {
  id                    String    @id @default(uuid())
  websiteId             String    @map("website_id")
  date                  DateTime  @db.Date
  pageViews             Int       @default(0) @map("page_views")
  uniqueVisitors        Int       @default(0) @map("unique_visitors")
  sessions              Int       @default(0)
  bandwidthMb           Decimal   @default(0) @map("bandwidth_mb") @db.Decimal(10,3)
  avgLoadTimeMs         Int?      @map("avg_load_time_ms")
  bounceRate            Decimal?  @map("bounce_rate") @db.Decimal(5,2)
  avgSessionDurationS   Int?      @map("avg_session_duration_s")
  referrerBreakdown     Json      @default("{}") @map("referrer_breakdown")
  topPages              Json      @default("[]") @map("top_pages")
  countryBreakdown      Json      @default("{}") @map("country_breakdown")
  deviceBreakdown       Json      @default("{}") @map("device_breakdown")

  website               Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@unique([websiteId, date])
  @@map("usage_metrics")
}

model DomainVerification {
  id                    String    @id @default(uuid())
  websiteId             String    @unique @map("website_id")
  domain                String
  cnameTarget           String    @map("cname_target")
  verified              Boolean   @default(false)
  verificationAttempts  Int       @default(0) @map("verification_attempts")
  lastCheckedAt         DateTime? @map("last_checked_at")
  firstVerifiedAt       DateTime? @map("first_verified_at")
  sslProvisioned        Boolean   @default(false) @map("ssl_provisioned")
  sslProvisionedAt      DateTime? @map("ssl_provisioned_at")
  lastError             String?   @map("last_error")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  website               Website   @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@map("domain_verifications")
}

model TeamInvitation {
  id          String    @id @default(uuid())
  tenantId    String    @map("tenant_id")
  invitedBy   String    @map("invited_by")
  email       String
  role        String    @default("editor")
  token       String    @unique @default(cuid())
  status      String    @default("pending")
  expiresAt   DateTime  @map("expires_at")
  acceptedAt  DateTime? @map("accepted_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  inviter     User      @relation(fields: [invitedBy], references: [id], onDelete: Cascade)

  @@unique([tenantId, email])
  @@map("team_invitations")
}

model AuditLog {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  performedBy   String?   @map("performed_by")
  action        String
  resourceType  String?   @map("resource_type")
  resourceId    String?   @map("resource_id")
  metadata      Json      @default("{}")
  ipAddress     String?   @map("ip_address")
  userAgent     String?   @map("user_agent")
  createdAt     DateTime  @default(now()) @map("created_at")

  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user          User?     @relation(fields: [performedBy], references: [id], onDelete: SetNull)

  @@map("audit_logs")
}
```

---

## 24. Seed Data

```sql
-- ============================================
-- SEED: Plans
-- ============================================
INSERT INTO plans (
  id, name, slug, description,
  max_websites, max_pages_per_site, storage_limit_mb, ai_credits_per_month,
  custom_domain_allowed, version_history_limit, collaboration_enabled,
  max_collaborators, analytics_enabled, priority_support,
  price_monthly_cents, price_yearly_cents,
  display_order, badge_text
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Starter', 'starter', 'Perfect for getting started — completely free.',
  1, 5, 100, 10,
  false, 5, false,
  1, false, false,
  0, 0,
  1, NULL
),
(
  '00000000-0000-0000-0000-000000000002',
  'Growth', 'growth', 'For growing businesses that need more power.',
  3, 20, 500, 50,
  true, 20, true,
  5, true, false,
  1900, 19000,
  2, 'Most Popular'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Pro', 'pro', 'Maximum power for professional teams.',
  10, 100, 2000, 200,
  true, 50, true,
  20, true, true,
  4900, 49000,
  3, 'Best Value'
);
```

---

## 25. Migration Files

### How to Run Migrations

```bash
# Initial migration
npx prisma migrate dev --name init

# After schema changes
npx prisma migrate dev --name add_column_xyz

# Production deployment
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate

# Seed the database
npx prisma db seed
```

### Migration Order

```
001_create_plans.sql
002_create_tenants.sql
003_create_users.sql
004_create_subscriptions.sql
005_create_websites.sql
006_create_pages.sql
007_create_components.sql
008_create_deployments.sql
009_create_page_versions.sql
010_create_assets.sql
011_create_ai_usage_log.sql
012_create_usage_metrics.sql
013_create_domain_verifications.sql
014_create_team_invitations.sql
015_create_audit_logs.sql
016_create_raw_page_events.sql
017_enable_rls.sql
018_create_rls_policies.sql
019_create_indexes.sql
020_create_functions.sql
021_create_triggers.sql
022_seed_plans.sql
```

---

## 26. Data Flow Examples

### Flow 1: New Tenant Signs Up

```
POST /api/tenants/onboard
{
  "email": "owner@pizzapalace.com",
  "orgName": "Pizza Palace",
  "planId": "00000000-0000-0000-0000-000000000001",  ← Starter plan
  "firebaseUid": "xKj7dP2..."
}

DB Writes (in order):
1. INSERT INTO tenants → id: "abc-123", slug: "pizza-palace-x7k2"
2. INSERT INTO users → role: 'owner', firebase_uid: "xKj7dP2..."
3. INSERT INTO websites → subdomain: "pizza-palace-x7k2", status: 'draft'
4. INSERT INTO pages → slug: '/', is_home: true, status: 'draft'
5. INSERT INTO components (5 default ones) → navbar, hero, features, gallery, footer
6. [Stripe API] Create Customer → returns "cus_Oz1234"
7. INSERT INTO subscriptions → stripe_customer_id: "cus_Oz1234", status: 'active'
```

### Flow 2: Editor Saves a Page Change

```
PUT /api/components/component-uuid
Headers: Authorization: Bearer <firebase-jwt>
{
  "props": { "heading": "New Heading Text" }
}

DB Writes:
1. UPDATE components SET props = {...}, updated_at = NOW()
   WHERE id = 'component-uuid'
   -- (RLS automatically filters to current tenant)

2. [Background - every 30 seconds if dirty]
   INSERT INTO page_versions
   (page_id, content_snapshot, saved_by, trigger)
   VALUES (page-uuid, [...current components...], user-uuid, 'auto')

3. [Background - if version count > plan limit]
   DELETE FROM page_versions
   WHERE id IN (oldest versions...)
```

### Flow 3: Publishing a Website

```
POST /api/websites/website-uuid/publish

DB Reads:
1. SELECT * FROM websites WHERE id = 'website-uuid'
   JOIN pages WITH components (ordered by order_key)
   -- Reads the CURRENT draft state

DB Writes (in transaction):
2. UPDATE deployments SET is_live = FALSE
   WHERE website_id = 'website-uuid'
   -- Deactivates all previous deployments

3. INSERT INTO deployments
   (website_id, deployed_by, snapshot_json, is_live)
   -- Frozen snapshot of entire site at this moment

4. UPDATE websites SET status = 'published', last_deployed_at = NOW()

5. INSERT INTO page_versions (trigger = 'pre_publish')
   -- Saves draft state at publish time

6. INSERT INTO audit_logs (action = 'website.published')
```

### Flow 4: Public Site Request

```
Request: GET pizza-palace-x7k2.sitepilot.io/menu

Middleware reads subdomain → "pizza-palace-x7k2"
Rewrites to: /sites/pizza-palace-x7k2/menu

DB Reads (2 queries only):
1. SELECT id, branding_config FROM websites
   WHERE subdomain = 'pizza-palace-x7k2'
   AND status = 'published'

2. SELECT snapshot_json FROM deployments
   WHERE website_id = 'website-uuid'
   AND is_live = TRUE

Renderer:
→ Find page with slug '/menu' in snapshot_json.pages
→ Render components array through ComponentFactory
→ Inject branding as CSS variables
→ Return HTML

NO queries to components, pages tables.
Public site reads are completely isolated from draft edits.
```

### Flow 5: Stripe Upgrade Webhook

```
POST /api/webhooks/stripe
Event: customer.subscription.updated
{
  customer: "cus_Oz1234",
  items: [{ price: { id: "price_growth_xxx" } }],
  status: "active"
}

DB Operations:
1. SELECT id FROM plans WHERE stripe_monthly_price_id = 'price_growth_xxx'
   → Returns Growth plan ID

2. UPDATE tenants SET plan_id = 'growth-plan-uuid'
   WHERE stripe_customer_id = 'cus_Oz1234'
   → Limits now update immediately. No restart needed.

3. UPDATE subscriptions SET status = 'active', stripe_price_id = 'price_growth_xxx'
   WHERE stripe_customer_id = 'cus_Oz1234'

4. INSERT INTO audit_logs (action = 'billing.plan_upgraded')
```

---

> **Schema Version:** 1.0  
> **Database:** PostgreSQL 15 via Supabase  
> **ORM:** Prisma 5.x  
> **Last Updated:** Project Kickoff
>
> This schema document is the single source of truth. Any changes to the database must be reflected here first before writing migration files.
