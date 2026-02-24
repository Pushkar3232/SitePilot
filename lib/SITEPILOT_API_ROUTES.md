# 🛣️ SitePilot — Complete API Routes Reference
> Next.js 14 App Router · Every Route · Every Field · Every Response  
> Auth: Firebase JWT · Database: Supabase PostgreSQL · Version 1.0

---

## 📋 Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Auth Middleware Helper](#2-auth-middleware-helper)
3. [Auth Routes — `/api/auth`](#3-auth-routes)
4. [Tenant Routes — `/api/tenants`](#4-tenant-routes)
5. [Website Routes — `/api/websites`](#5-website-routes)
6. [Page Routes — `/api/pages`](#6-page-routes)
7. [Component Routes — `/api/components`](#7-component-routes)
8. [AI Routes — `/api/ai`](#8-ai-routes)
9. [Asset Routes — `/api/assets`](#9-asset-routes)
10. [Version Routes — `/api/versions`](#10-version-routes)
11. [Domain Routes — `/api/domains`](#11-domain-routes)
12. [Analytics Routes — `/api/analytics`](#12-analytics-routes)
13. [Team Routes — `/api/team`](#13-team-routes)
14. [Billing Routes — `/api/billing`](#14-billing-routes)
15. [Webhook Routes — `/api/webhooks`](#15-webhook-routes)
16. [Error Response Reference](#16-error-response-reference)
17. [Permission Matrix](#17-permission-matrix)
18. [Quick Route Summary Table](#18-quick-route-summary-table)

---

## 1. Global Conventions

### File Structure in Next.js 14 App Router

Each route lives at `app/api/<path>/route.ts`. For dynamic segments, use folder names like `[id]`.

```
app/api/
├── tenants/
│   └── onboard/route.ts
├── websites/
│   ├── route.ts                  → GET /api/websites, POST /api/websites
│   └── [id]/
│       ├── route.ts              → GET /api/websites/:id, DELETE /api/websites/:id
│       └── publish/route.ts      → POST /api/websites/:id/publish
├── pages/
│   ├── route.ts
│   └── [id]/route.ts
├── components/
│   ├── route.ts
│   └── [id]/route.ts
├── ai/
│   └── generate/route.ts
├── assets/
│   ├── route.ts
│   ├── upload/route.ts
│   └── [id]/route.ts
├── versions/
│   ├── route.ts
│   └── restore/route.ts
├── domains/
│   ├── add/route.ts
│   └── verify/[websiteId]/route.ts
├── analytics/
│   ├── dashboard/route.ts
│   └── track/route.ts
├── team/
│   ├── route.ts
│   ├── invite/route.ts
│   └── [userId]/route.ts
├── billing/
│   ├── plans/route.ts
│   ├── create-checkout/route.ts
│   └── portal/route.ts
└── webhooks/
    └── stripe/route.ts
```

### Authentication Header

All protected routes require:

```
Authorization: Bearer <firebase-id-token>
```

The Firebase ID token is obtained client-side after login:

```typescript
const token = await firebase.auth().currentUser?.getIdToken();
```

### Standard Success Response Shape

```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Standard Error Response Shape

```json
{
  "error": "Short error code",
  "message": "Human-readable description"
}
```

### Common HTTP Status Codes Used

| Code | Meaning |
|---|---|
| `200` | OK — successful GET or PUT |
| `201` | Created — successful POST |
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — authenticated but no permission |
| `404` | Not Found |
| `409` | Conflict — e.g. slug already taken |
| `429` | Too Many Requests — plan limit hit |
| `500` | Internal Server Error |

---

## 2. Auth Middleware Helper

Before diving into routes, here is the standard helper used in every protected route. Create this at `lib/auth-middleware.ts`.

```typescript
// lib/auth-middleware.ts
import { adminAuth } from '@/lib/firebase-admin';
import { supabaseServer } from '@/lib/supabase';

export async function verifyRequestAndGetUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Missing token' }), { status: 401 });
  }

  const token = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);  // Firebase Admin SDK

  // Fetch user row from Supabase (includes role + tenant_id)
  const { data: user, error } = await supabaseServer
    .from('users')
    .select('*, tenants(*, plans(*))')
    .eq('firebase_uid', decoded.uid)
    .single();

  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'USER_NOT_FOUND' }), { status: 401 });
  }

  if (user.tenants.status === 'suspended') {
    throw new Response(JSON.stringify({ error: 'TENANT_SUSPENDED' }), { status: 403 });
  }

  return user;
}
```

### Permission Checker

```typescript
// lib/rbac.ts
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner:     ['view', 'edit_content', 'publish_website', 'admin', 'manage_billing', 'invite_users', 'manage_domains', 'use_ai', 'upload_assets', 'view_analytics'],
  admin:     ['view', 'edit_content', 'publish_website', 'admin', 'invite_users', 'manage_domains', 'use_ai', 'upload_assets', 'view_analytics'],
  editor:    ['view', 'edit_content', 'use_ai', 'upload_assets'],
  developer: ['view', 'edit_content', 'publish_website', 'use_ai', 'upload_assets', 'manage_domains'],
  viewer:    ['view'],
};

export function requirePermission(permission: string) {
  return (user: any) => {
    const perms = ROLE_PERMISSIONS[user.role] ?? [];
    if (!perms.includes(permission)) {
      throw new Response(JSON.stringify({ error: 'FORBIDDEN', message: `Requires: ${permission}` }), { status: 403 });
    }
  };
}
```

---

## 3. Auth Routes

### `POST /api/auth/sync`

**Purpose:** Called right after Firebase login to ensure the user record exists in Supabase. Used for social logins or edge cases where the DB row might not yet exist.

**File:** `app/api/auth/sync/route.ts`

**Auth Required:** ✅ Firebase JWT

**Request Body:**
```json
{
  "email": "user@example.com",
  "displayName": "John Doe"
}
```

**Logic:**
1. Verify Firebase JWT.
2. `UPSERT` into `users` table using `firebase_uid` as conflict key.
3. Return the user row with tenant info.

**Success Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "owner",
    "tenant_id": "uuid"
  }
}
```

**Errors:**
- `401` — invalid token
- `500` — DB error

---

## 4. Tenant Routes

### `POST /api/tenants/onboard`

**Purpose:** The **single most important route**. Called once after a new user registers. Creates the entire tenant environment in one atomic operation.

**File:** `app/api/tenants/onboard/route.ts`

**Auth Required:** ✅ Firebase JWT

**Request Body:**
```json
{
  "orgName": "Pizza Palace",
  "planId": "00000000-0000-0000-0000-000000000001",
  "firebaseUid": "xKj7dP2abc123"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `orgName` | string | ✅ | Business/organization name. Used to generate tenant slug. |
| `planId` | UUID | ✅ | UUID of the chosen plan from the `plans` table. |
| `firebaseUid` | string | ✅ | Firebase UID of the registering user. |

**Logic (in order):**
1. Validate input — `orgName` must be 2–60 chars.
2. Generate unique `slug` from `orgName` (e.g., `pizza-palace-x7k2`).
3. Check slug uniqueness. Retry with a new suffix if collision.
4. `INSERT INTO tenants` → creates the tenant row.
5. `INSERT INTO users` → creates the owner user row with `role = 'owner'`.
6. `INSERT INTO websites` → creates the starter website with default subdomain = slug.
7. `INSERT INTO pages` → creates a homepage (`slug = '/'`, `is_home = true`).
8. `INSERT INTO components` → inserts 5 default components: Navbar, Hero, Features, Gallery, Footer.
9. Call **Stripe API** → `stripe.customers.create({ email, name })` → store `stripe_customer_id`.
10. `INSERT INTO subscriptions` → links tenant to plan and Stripe customer.
11. Return created tenant + user data.

**Success Response `201`:**
```json
{
  "tenant": {
    "id": "uuid",
    "slug": "pizza-palace-x7k2",
    "name": "Pizza Palace"
  },
  "user": {
    "id": "uuid",
    "role": "owner"
  },
  "website": {
    "id": "uuid",
    "subdomain": "pizza-palace-x7k2",
    "liveUrl": "https://pizza-palace-x7k2.sitepilot.io"
  }
}
```

**Errors:**
- `400` — missing fields or invalid `orgName`
- `409` — tenant with this Firebase UID already exists
- `500` — DB or Stripe error

---

## 5. Website Routes

### `GET /api/websites`

**Purpose:** List all websites belonging to the authenticated tenant.

**File:** `app/api/websites/route.ts`

**Auth Required:** ✅ | **Permission:** `viewer`

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | ❌ | Filter by status: `draft`, `published`, `archived` |

**Logic:**
1. Verify JWT → get `tenant_id`.
2. Query `websites` table filtered by `tenant_id`.
3. If `status` query param provided, add that filter.
4. Return list ordered by `created_at DESC`.

**Success Response `200`:**
```json
{
  "websites": [
    {
      "id": "uuid",
      "name": "Main Website",
      "subdomain": "pizza-palace-x7k2",
      "status": "published",
      "custom_domain": null,
      "domain_verified": false,
      "last_deployed_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/websites`

**Purpose:** Create a new website for the tenant.

**File:** `app/api/websites/route.ts`

**Auth Required:** ✅ | **Permission:** `admin`

**Request Body:**
```json
{
  "name": "My New Site",
  "templateId": "restaurant-001"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Display name of the website |
| `templateId` | string | ❌ | Optional — pre-populate from a template |

**Logic:**
1. Verify JWT + `admin` permission.
2. **Plan limit check:** Count active websites for this tenant. If `count >= plan.max_websites` → return `429`.
3. Generate subdomain from website name + random suffix.
4. `INSERT INTO websites`.
5. `INSERT INTO pages` → create default homepage.
6. If `templateId` provided → copy template components into the page.
7. Return new website.

**Success Response `201`:**
```json
{
  "website": {
    "id": "uuid",
    "name": "My New Site",
    "subdomain": "my-new-site-a1b2",
    "status": "draft"
  }
}
```

**Errors:**
- `429` — plan website limit reached (include `upgradeUrl` in response)
- `400` — invalid name

---

### `GET /api/websites/:id`

**Purpose:** Fetch a single website with its pages (but not components — those are fetched separately via `/api/components`).

**File:** `app/api/websites/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `viewer`

**Path Params:** `id` — website UUID

**Logic:**
1. Verify JWT → get `tenant_id`.
2. Query website by `id` AND `tenant_id` (tenant isolation).
3. Join `pages` (without components).
4. Return 404 if not found or belongs to different tenant.

**Success Response `200`:**
```json
{
  "website": {
    "id": "uuid",
    "name": "Pizza Palace",
    "subdomain": "pizza-palace-x7k2",
    "status": "published",
    "branding_config": {
      "colors": { "primary": "#E63946" },
      "typography": { "headingFont": "Playfair Display" }
    },
    "seo_meta": {
      "title": "Pizza Palace",
      "description": "Best pizza in town"
    },
    "pages": [
      { "id": "uuid", "title": "Home", "slug": "/", "is_home": true, "status": "draft" },
      { "id": "uuid", "title": "Menu", "slug": "/menu", "status": "draft" }
    ]
  }
}
```

---

### `PUT /api/websites/:id`

**Purpose:** Update website metadata — name, branding config, SEO meta.

**File:** `app/api/websites/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body** (all fields optional):
```json
{
  "name": "Pizza Palace Updated",
  "branding_config": {
    "colors": {
      "primary": "#E63946",
      "secondary": "#457B9D",
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
      "url": "https://res.cloudinary.com/sitepilot/...",
      "alt": "Brand Logo",
      "width": 160
    }
  },
  "seo_meta": {
    "title": "Pizza Palace — Best Pizza In Town",
    "description": "Fresh handmade pizza...",
    "ogImage": "https://..."
  }
}
```

**Success Response `200`:**
```json
{ "website": { "id": "uuid", "name": "Pizza Palace Updated", "updated_at": "..." } }
```

---

### `DELETE /api/websites/:id`

**Purpose:** Archive a website (soft-delete — sets `status = 'archived'`). Does not hard-delete.

**File:** `app/api/websites/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `admin`

**Logic:**
1. Verify JWT + `admin` permission + tenant ownership.
2. `UPDATE websites SET status = 'archived'` — does not delete data.
3. Log to `audit_logs`.

**Success Response `200`:**
```json
{ "message": "Website archived successfully" }
```

---

### `POST /api/websites/:id/publish`

**Purpose:** Publish the website — creates an immutable deployment snapshot that is served at the public subdomain.

**File:** `app/api/websites/[id]/publish/route.ts`

**Auth Required:** ✅ | **Permission:** `publish_website`

**No Request Body** — publishes current draft state.

**Logic:**
1. Verify JWT + `publish_website` permission.
2. Fetch full website with all pages + components (ordered by `order_key`).
3. Build `snapshot_json` object:
   ```json
   {
     "websiteId": "uuid",
     "publishedAt": "ISO string",
     "branding": { ... },
     "pages": [
       {
         "id": "uuid",
         "title": "Home",
         "slug": "/",
         "seo_meta": { ... },
         "components": [
           { "type": "NavbarBlock", "props": { ... } },
           { "type": "HeroBlock", "props": { ... } }
         ]
       }
     ]
   }
   ```
4. In a transaction:
   - `UPDATE deployments SET is_live = false WHERE website_id = :id`
   - `INSERT INTO deployments (snapshot_json, is_live = true)`
   - `UPDATE websites SET status = 'published', last_deployed_at = NOW()`
   - `INSERT INTO page_versions (trigger = 'pre_publish')` for each page
   - `INSERT INTO audit_logs (action = 'website.published')`
5. Return deployment info.

**Success Response `200`:**
```json
{
  "deployment": {
    "id": "uuid",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "liveUrl": "https://pizza-palace-x7k2.sitepilot.io"
}
```

**Errors:**
- `403` — user doesn't have `publish_website` permission (e.g., Editor role)

---

## 6. Page Routes

### `GET /api/pages`

**Purpose:** List all pages for a given website.

**File:** `app/api/pages/route.ts`

**Auth Required:** ✅ | **Permission:** `viewer`

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `websiteId` | UUID | ✅ | The website to list pages for |

**Logic:**
1. Verify JWT + viewer permission.
2. Verify the website belongs to this tenant.
3. Query `pages` where `website_id = websiteId` ordered by `order_key`.

**Success Response `200`:**
```json
{
  "pages": [
    {
      "id": "uuid",
      "title": "Home",
      "slug": "/",
      "is_home": true,
      "status": "draft",
      "order_key": "a0",
      "seo_meta": { "title": "...", "description": "..." },
      "created_at": "..."
    }
  ]
}
```

---

### `POST /api/pages`

**Purpose:** Create a new page inside a website.

**File:** `app/api/pages/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body:**
```json
{
  "websiteId": "uuid",
  "title": "About Us",
  "slug": "/about",
  "seo_meta": {
    "title": "About Us | Pizza Palace",
    "description": "Learn our story..."
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `websiteId` | UUID | ✅ | Parent website UUID |
| `title` | string | ✅ | Display name (e.g., "About Us") |
| `slug` | string | ✅ | URL path — must start with `/` and be unique within this website |
| `seo_meta` | object | ❌ | Optional SEO metadata |

**Logic:**
1. Verify JWT + `edit_content`.
2. **Plan limit check:** Count pages for this website. If `count >= plan.max_pages_per_site` → `429`.
3. Validate slug format (`/[a-z0-9-/]+`).
4. Check slug uniqueness within website.
5. `INSERT INTO pages`.

**Success Response `201`:**
```json
{
  "page": {
    "id": "uuid",
    "title": "About Us",
    "slug": "/about",
    "status": "draft"
  }
}
```

**Errors:**
- `409` — slug already exists in this website
- `429` — page limit for plan reached

---

### `PUT /api/pages/:id`

**Purpose:** Update page title, slug, SEO meta, or status.

**File:** `app/api/pages/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body** (all optional):
```json
{
  "title": "About Pizza Palace",
  "slug": "/about-us",
  "status": "draft",
  "seo_meta": {
    "title": "About | Pizza Palace",
    "description": "Our story...",
    "ogImage": "https://..."
  }
}
```

**Logic:**
1. Verify JWT + permission + tenant ownership of this page.
2. If `slug` is changing, check uniqueness within website.
3. Cannot change `slug` of home page (`is_home = true`).
4. `UPDATE pages`.

**Success Response `200`:**
```json
{ "page": { "id": "uuid", "title": "About Pizza Palace", "slug": "/about-us" } }
```

---

### `DELETE /api/pages/:id`

**Purpose:** Delete a page and all its components.

**File:** `app/api/pages/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `admin`

**Logic:**
1. Verify JWT + `admin` permission.
2. Cannot delete the home page (`is_home = true`) — return `400`.
3. `DELETE FROM components WHERE page_id = :id` (or rely on CASCADE).
4. `DELETE FROM page_versions WHERE page_id = :id`.
5. `DELETE FROM pages WHERE id = :id`.

**Success Response `200`:**
```json
{ "message": "Page deleted" }
```

**Errors:**
- `400` — cannot delete home page

---

## 7. Component Routes

> Components are the individual blocks on a page (Hero, Navbar, Features, etc.).

### `GET /api/components`

**Purpose:** Fetch all components for a specific page, in display order.

**File:** `app/api/components/route.ts`

**Auth Required:** ✅ | **Permission:** `viewer`

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `pageId` | UUID | ✅ | The page to fetch components for |

**Logic:**
1. Verify JWT + viewer.
2. Verify the page belongs to this tenant (via join).
3. Query `components WHERE page_id = pageId ORDER BY order_key ASC`.

**Success Response `200`:**
```json
{
  "components": [
    {
      "id": "uuid",
      "type": "NavbarBlock",
      "order_key": "a0",
      "props": {
        "logo": "https://...",
        "links": [
          { "label": "Home", "href": "/" },
          { "label": "Menu", "href": "/menu" }
        ],
        "ctaText": "Order Now",
        "ctaHref": "/order"
      },
      "is_visible": true
    },
    {
      "id": "uuid",
      "type": "HeroBlock",
      "order_key": "a1",
      "props": {
        "heading": "Best Pizza In Town",
        "subheading": "Fresh ingredients, baked to perfection",
        "backgroundImage": "https://...",
        "ctaText": "Order Now",
        "ctaHref": "/order"
      }
    }
  ]
}
```

---

### `POST /api/components`

**Purpose:** Add a new component block to a page.

**File:** `app/api/components/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body:**
```json
{
  "pageId": "uuid",
  "type": "FeaturesBlock",
  "props": {
    "heading": "Why Choose Us",
    "features": [
      { "icon": "pizza", "title": "Fresh Daily", "description": "..." }
    ]
  },
  "order_key": "a2"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `pageId` | UUID | ✅ | Parent page |
| `type` | string | ✅ | Component type: `NavbarBlock`, `HeroBlock`, `FeaturesBlock`, `GalleryBlock`, `TestimonialsBlock`, `ContactFormBlock`, `PricingBlock`, `FooterBlock`, `CTABlock` |
| `props` | object | ✅ | Component-specific props (see component prop schemas) |
| `order_key` | string | ✅ | Fractional index string for ordering. Client calculates this using `fractional-indexing` npm package. |

**Logic:**
1. Verify JWT + `edit_content`.
2. Validate `type` is one of the allowed component types.
3. `INSERT INTO components`.
4. Return new component with its `id`.

**Success Response `201`:**
```json
{
  "component": {
    "id": "uuid",
    "type": "FeaturesBlock",
    "order_key": "a2",
    "props": { ... }
  }
}
```

---

### `PUT /api/components/:id`

**Purpose:** Update a component's props (e.g., user edited text in the builder) or its `order_key` (drag-and-drop reorder).

**File:** `app/api/components/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body** (one or both):
```json
{
  "props": {
    "heading": "Amazing Pizza Since 1994",
    "subheading": "Family-owned, community-loved"
  },
  "order_key": "a0V"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `props` | object | ❌ | Updated component props (full replace) |
| `order_key` | string | ❌ | New fractional index (only this one record is updated — no full re-index needed) |
| `is_visible` | boolean | ❌ | Show/hide component |

**Logic:**
1. Verify JWT + `edit_content`.
2. Verify component belongs to this tenant.
3. `UPDATE components SET props = $1, order_key = $2, updated_at = NOW()`.
4. The auto-save version system picks this up in the background (every 30s if dirty).

**Success Response `200`:**
```json
{
  "component": {
    "id": "uuid",
    "type": "HeroBlock",
    "props": { "heading": "Amazing Pizza Since 1994" },
    "order_key": "a0V",
    "updated_at": "..."
  }
}
```

---

### `DELETE /api/components/:id`

**Purpose:** Remove a component from a page.

**File:** `app/api/components/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Logic:**
1. Verify JWT + `edit_content` + tenant ownership.
2. `DELETE FROM components WHERE id = :id`.

**Success Response `200`:**
```json
{ "message": "Component deleted" }
```

---

## 8. AI Routes

### `POST /api/ai/generate`

**Purpose:** Send the user's chatbot answers to Claude API and get back a full website layout as structured JSON (component list).

**File:** `app/api/ai/generate/route.ts`

**Auth Required:** ✅ | **Permission:** `use_ai`

**Request Body:**
```json
{
  "websiteId": "uuid",
  "pageId": "uuid",
  "category": "restaurant",
  "answers": {
    "businessName": "Pizza Palace",
    "description": "Family pizza restaurant since 1994",
    "primaryColor": "#E63946",
    "targetAudience": "Families and pizza lovers",
    "topFeatures": ["Fresh ingredients", "Fast delivery", "Dine-in available"]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `websiteId` | UUID | ✅ | Website to generate for |
| `pageId` | UUID | ✅ | Page to populate with generated components |
| `category` | string | ✅ | Site category: `restaurant`, `portfolio`, `business`, `blog`, `ecommerce` |
| `answers` | object | ✅ | User's chatbot answers — used to build the Claude prompt |

**Logic:**
1. Verify JWT + `use_ai` permission.
2. **AI credit check:** Count AI uses this month for tenant. If `count >= plan.ai_credits_per_month` → `429`.
3. Build prompt for Claude:
   ```
   You are a website builder AI. Generate a complete website layout for a {category} website.
   Business: {businessName}. Description: {description}.
   Return ONLY a JSON array of components, each with "type" and "props" fields.
   Component types available: NavbarBlock, HeroBlock, FeaturesBlock, GalleryBlock, FooterBlock...
   ```
4. Call Claude API (`claude-sonnet-4-6`).
5. Parse response JSON — handle malformed output with try/catch.
6. If valid JSON array:
   - `DELETE` existing components on this page.
   - `INSERT` each generated component with calculated `order_key`.
7. `INSERT INTO ai_usage_log` (deduct 1 credit).
8. Return generated components.

**Success Response `201`:**
```json
{
  "components": [
    { "id": "uuid", "type": "NavbarBlock", "props": { ... }, "order_key": "a0" },
    { "id": "uuid", "type": "HeroBlock", "props": { "heading": "Best Pizza In Town" }, "order_key": "a1" },
    { "id": "uuid", "type": "FeaturesBlock", "props": { ... }, "order_key": "a2" }
  ],
  "creditsUsed": 1,
  "creditsRemaining": 49
}
```

**Errors:**
- `429` — AI credits exhausted (include `upgradeUrl`)
- `500` — Claude API error or malformed JSON response

---

## 9. Asset Routes

### `POST /api/assets/upload`

**Purpose:** Upload an image or file to Cloudinary and save a reference in the `assets` table.

**File:** `app/api/assets/upload/route.ts`

**Auth Required:** ✅ | **Permission:** `upload_assets`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | The image or file to upload |
| `type` | string | ❌ | Asset type hint: `logo`, `image`, `document` |

**Logic:**
1. Verify JWT + `upload_assets`.
2. **Storage limit check:** Get current storage used (`SUM(size_bytes)` from `assets`). If adding this file exceeds `plan.storage_limit_mb` → `429`.
3. Convert file to buffer.
4. Upload to Cloudinary with folder `sitepilot/tenants/{tenant_id}`.
5. `INSERT INTO assets` with `cloudinary_public_id`, `cloudinary_url`, `size_bytes`.

**Success Response `201`:**
```json
{
  "asset": {
    "id": "uuid",
    "url": "https://res.cloudinary.com/sitepilot/image/upload/...",
    "filename": "logo.png",
    "size_bytes": 45200,
    "cloudinary_public_id": "sitepilot/tenants/abc/logo_xyz"
  }
}
```

**Errors:**
- `429` — storage quota exceeded
- `400` — no file uploaded or unsupported file type

---

### `GET /api/assets`

**Purpose:** List all assets uploaded by this tenant (for the asset picker in the builder).

**File:** `app/api/assets/route.ts`

**Auth Required:** ✅ | **Permission:** `viewer`

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `type` | string | ❌ | Filter by `image`, `document` |
| `limit` | number | ❌ | Default 50 |
| `offset` | number | ❌ | For pagination |

**Success Response `200`:**
```json
{
  "assets": [
    {
      "id": "uuid",
      "url": "https://res.cloudinary.com/...",
      "filename": "hero-image.jpg",
      "size_bytes": 890000,
      "created_at": "..."
    }
  ],
  "total": 12
}
```

---

### `DELETE /api/assets/:id`

**Purpose:** Delete an asset from Cloudinary and remove from database.

**File:** `app/api/assets/[id]/route.ts`

**Auth Required:** ✅ | **Permission:** `admin`

**Logic:**
1. Verify JWT + `admin` + tenant ownership.
2. Call `cloudinary.uploader.destroy(cloudinary_public_id)`.
3. `DELETE FROM assets WHERE id = :id`.

**Success Response `200`:**
```json
{ "message": "Asset deleted" }
```

---

## 10. Version Routes

### `GET /api/versions`

**Purpose:** List the version history for a page (for the builder's version history panel).

**File:** `app/api/versions/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `pageId` | UUID | ✅ | The page to get versions for |

**Success Response `200`:**
```json
{
  "versions": [
    {
      "id": "uuid",
      "label": "Pre-publish snapshot",
      "trigger": "pre_publish",
      "saved_by": { "id": "uuid", "name": "Jane Doe" },
      "saved_at": "2024-01-15T09:00:00Z"
    },
    {
      "id": "uuid",
      "label": null,
      "trigger": "auto",
      "saved_by": { "id": "uuid", "name": "Jane Doe" },
      "saved_at": "2024-01-15T08:30:00Z"
    }
  ]
}
```

> Note: `content_snapshot` is NOT returned here — it's only fetched when restoring. This keeps the list response lightweight.

---

### `POST /api/versions/restore`

**Purpose:** Restore a page to a previous version.

**File:** `app/api/versions/restore/route.ts`

**Auth Required:** ✅ | **Permission:** `edit_content`

**Request Body:**
```json
{
  "versionId": "uuid",
  "pageId": "uuid"
}
```

**Logic:**
1. Verify JWT + `edit_content`.
2. **Auto-save current state first** — insert a new `page_version` labeled `"Before restore"` so the user can undo.
3. Fetch `content_snapshot` from `page_versions WHERE id = versionId`.
4. `DELETE FROM components WHERE page_id = :pageId`.
5. Re-insert all components from the snapshot.
6. Return restored component list.

**Success Response `200`:**
```json
{
  "message": "Version restored",
  "components": [ ... ]
}
```

---

## 11. Domain Routes

### `POST /api/domains/add`

**Purpose:** Add a custom domain to a website (Growth and Pro plans only).

**File:** `app/api/domains/add/route.ts`

**Auth Required:** ✅ | **Permission:** `manage_domains`

**Request Body:**
```json
{
  "websiteId": "uuid",
  "domain": "www.mybakery.com"
}
```

**Logic:**
1. Verify JWT + `manage_domains`.
2. **Plan check:** If `plan.custom_domain_allowed = false` → `403`.
3. Validate domain format.
4. Check domain is not already used by another tenant.
5. Generate CNAME target: `{websiteSlug}.sitepilot.io`.
6. `UPDATE websites SET custom_domain = :domain`.
7. `INSERT INTO domain_verifications` with `cname_target`, `verified = false`.
8. Return CNAME instructions.

**Success Response `201`:**
```json
{
  "domain": "www.mybakery.com",
  "cnameTarget": "my-bakery-x7k2.sitepilot.io",
  "instructions": "Add a CNAME record: Name=www, Value=my-bakery-x7k2.sitepilot.io",
  "verified": false
}
```

**Errors:**
- `403` — plan doesn't support custom domains
- `409` — domain already claimed

---

### `GET /api/domains/verify/:websiteId`

**Purpose:** Check the current DNS verification status of a website's custom domain. Frontend polls this every 30 seconds.

**File:** `app/api/domains/verify/[websiteId]/route.ts`

**Auth Required:** ✅ | **Permission:** `manage_domains`

**Logic:**
1. Verify JWT + permission.
2. Fetch `domain_verifications` record for this website.
3. If already `verified = true` → return immediately.
4. Call `dns.resolveCname(domain)` → check if it points to the `cname_target`.
5. If verified, `UPDATE domain_verifications SET verified = true`.
6. Update `last_checked_at`.

**Success Response `200`:**
```json
{
  "domain": "www.mybakery.com",
  "verified": false,
  "cnameTarget": "my-bakery-x7k2.sitepilot.io",
  "lastCheckedAt": "2024-01-15T10:00:00Z"
}
```

---

## 12. Analytics Routes

### `POST /api/analytics/track`

**Purpose:** Track a page view event from a published site. This is called by the tracking pixel script injected into every published page.

**File:** `app/api/analytics/track/route.ts`

**Auth Required:** ❌ (public endpoint — no JWT)

**Request Body:**
```json
{
  "website_id": "uuid",
  "page": "/menu",
  "referrer": "https://google.com",
  "timestamp": 1705312800000
}
```

**Logic:**
1. No auth — open endpoint.
2. Validate `website_id` exists.
3. `INSERT INTO raw_page_events`.
4. Return `204 No Content` quickly (fire-and-forget).

**Note:** A background cron job aggregates `raw_page_events` into `usage_metrics` daily.

**Success Response `204`:** (empty body)

---

### `GET /api/analytics/dashboard`

**Purpose:** Fetch all metrics for the analytics dashboard — page views, storage, AI usage, site count.

**File:** `app/api/analytics/dashboard/route.ts`

**Auth Required:** ✅ | **Permission:** `view_analytics`

**Query Params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `days` | number | 30 | Number of days to look back for page views |

**Logic:**
1. Verify JWT + `view_analytics`.
2. Run 4 parallel queries:
   - `get_total_page_views(tenant_id, since)` — Supabase RPC function
   - `get_storage_used_mb(tenant_id)` — Supabase RPC function  
   - Count AI uses this calendar month from `ai_usage_log`
   - Count active websites
3. Build alerts object if any metric > 80% of plan limit.

**Success Response `200`:**
```json
{
  "pageViews": {
    "total": 4820,
    "chartData": [
      { "date": "2024-01-01", "views": 120 },
      { "date": "2024-01-02", "views": 145 }
    ]
  },
  "storage": {
    "usedMb": 78,
    "limitMb": 500,
    "percent": 15.6
  },
  "aiCredits": {
    "used": 12,
    "limit": 50,
    "percent": 24.0
  },
  "websites": {
    "count": 2,
    "limit": 3
  },
  "alerts": {
    "storageWarning": false,
    "aiWarning": false
  }
}
```

---

## 13. Team Routes

### `GET /api/team`

**Purpose:** List all users in the tenant (team members).

**File:** `app/api/team/route.ts`

**Auth Required:** ✅ | **Permission:** `admin`

**Success Response `200`:**
```json
{
  "members": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@pizzapalace.com",
      "role": "owner",
      "avatar_url": "https://...",
      "status": "active",
      "created_at": "..."
    },
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@pizzapalace.com",
      "role": "editor",
      "status": "active"
    }
  ],
  "invitations": [
    {
      "id": "uuid",
      "email": "newmember@example.com",
      "role": "editor",
      "status": "pending",
      "expires_at": "..."
    }
  ]
}
```

---

### `POST /api/team/invite`

**Purpose:** Invite a new user to the tenant via email.

**File:** `app/api/team/invite/route.ts`

**Auth Required:** ✅ | **Permission:** `invite_users`

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "editor"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ | Email address of the invitee |
| `role` | string | ✅ | One of: `admin`, `editor`, `developer`, `viewer` (cannot invite as `owner`) |

**Logic:**
1. Verify JWT + `invite_users`.
2. **Collaborator limit check:** If `active_user_count >= plan.max_collaborators` → `429`.
3. Check if user already in team or has pending invitation.
4. Generate secure invite token.
5. `INSERT INTO team_invitations` with expiry (48 hours).
6. Send invitation email (via SendGrid or similar).

**Success Response `201`:**
```json
{
  "invitation": {
    "id": "uuid",
    "email": "newmember@example.com",
    "role": "editor",
    "expires_at": "2024-01-17T10:00:00Z"
  }
}
```

---

### `DELETE /api/team/:userId`

**Purpose:** Remove a user from the tenant.

**File:** `app/api/team/[userId]/route.ts`

**Auth Required:** ✅ | **Permission:** `invite_users`

**Logic:**
1. Verify JWT + permission.
2. Cannot remove yourself.
3. Cannot remove the `owner`.
4. `DELETE FROM users WHERE id = :userId AND tenant_id = :tenantId`.

**Success Response `200`:**
```json
{ "message": "User removed from team" }
```

---

## 14. Billing Routes

### `GET /api/billing/plans`

**Purpose:** Get all available plans for the billing/upgrade page.

**File:** `app/api/billing/plans/route.ts`

**Auth Required:** ✅ | **Permission:** `owner`

**Success Response `200`:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Starter",
      "slug": "starter",
      "description": "Perfect for getting started — completely free.",
      "price_monthly_cents": 0,
      "price_yearly_cents": 0,
      "max_websites": 1,
      "max_pages_per_site": 5,
      "storage_limit_mb": 100,
      "ai_credits_per_month": 10,
      "custom_domain_allowed": false,
      "max_collaborators": 1,
      "badge_text": null
    },
    {
      "id": "uuid",
      "name": "Growth",
      "price_monthly_cents": 1900,
      "badge_text": "Most Popular"
    },
    {
      "id": "uuid",
      "name": "Pro",
      "price_monthly_cents": 4900,
      "badge_text": "Best Value"
    }
  ],
  "currentPlan": "starter"
}
```

---

### `POST /api/billing/create-checkout`

**Purpose:** Create a Stripe Checkout Session and return the URL to redirect the user.

**File:** `app/api/billing/create-checkout/route.ts`

**Auth Required:** ✅ | **Permission:** `manage_billing`

**Request Body:**
```json
{
  "planId": "uuid",
  "billingInterval": "monthly"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | UUID | ✅ | Target plan UUID |
| `billingInterval` | string | ✅ | `monthly` or `yearly` |

**Logic:**
1. Verify JWT + `manage_billing`.
2. Get plan's Stripe price ID from DB (`stripe_monthly_price_id` or `stripe_yearly_price_id`).
3. Get tenant's `stripe_customer_id`.
4. Call `stripe.checkout.sessions.create(...)`:
   ```typescript
   {
     customer: stripeCustomerId,
     mode: 'subscription',
     line_items: [{ price: stripePriceId, quantity: 1 }],
     success_url: 'https://app.sitepilot.io/billing?success=true',
     cancel_url: 'https://app.sitepilot.io/billing',
   }
   ```
5. Return `sessionUrl`.

**Success Response `200`:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

### `POST /api/billing/portal`

**Purpose:** Open the Stripe Customer Portal for managing subscriptions, payment methods, and invoices.

**File:** `app/api/billing/portal/route.ts`

**Auth Required:** ✅ | **Permission:** `manage_billing`

**Logic:**
1. Verify JWT + `manage_billing`.
2. Get tenant's `stripe_customer_id`.
3. Call `stripe.billingPortal.sessions.create({ customer, return_url })`.
4. Return `portalUrl`.

**Success Response `200`:**
```json
{
  "portalUrl": "https://billing.stripe.com/session/..."
}
```

---

## 15. Webhook Routes

### `POST /api/webhooks/stripe`

**Purpose:** Handle Stripe webhook events — plan upgrades, downgrades, payment failures, subscription cancellations.

**File:** `app/api/webhooks/stripe/route.ts`

**Auth Required:** ❌ — verified via Stripe webhook signature header (`stripe-signature`)

**Important:** Use the **raw body** for signature verification (do NOT parse JSON first).

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();  // RAW — not JSON parsed
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.updated': // ... handle
    case 'customer.subscription.deleted': // ... handle
    case 'invoice.payment_failed':        // ... handle
  }

  return new Response('OK', { status: 200 });
}
```

**Events Handled:**

#### `customer.subscription.updated`
Fired when a user upgrades or downgrades.

**Logic:**
1. Get `stripe_customer_id` from event data.
2. Find matching `plan` via `stripe_monthly_price_id`.
3. `UPDATE tenants SET plan_id = newPlanId`.
4. `UPDATE subscriptions SET status = 'active', stripe_price_id = newPriceId`.
5. If **downgrade** → run `handleDowngrade()` to archive excess websites.
6. `INSERT INTO audit_logs (action = 'billing.plan_upgraded')`.

#### `customer.subscription.deleted`
Fired when subscription is cancelled.

**Logic:**
1. Find tenant by `stripe_customer_id`.
2. `UPDATE subscriptions SET status = 'canceled'`.
3. `UPDATE tenants SET plan_id = starterPlanId` (fall back to free Starter).
4. Email tenant about cancellation.

#### `invoice.payment_failed`
Fired when a payment fails.

**Logic:**
1. Find tenant.
2. `UPDATE subscriptions SET status = 'past_due'`.
3. Email tenant with payment retry link.

**Response:** Always return `200` to Stripe quickly (even on errors — log them instead of returning 500 or Stripe will retry).

---

## 16. Error Response Reference

### Common Error Codes

| Error Code | HTTP Status | When It Happens |
|---|---|---|
| `UNAUTHORIZED` | 401 | No token or invalid/expired Firebase JWT |
| `USER_NOT_FOUND` | 401 | Token valid but no user row in DB |
| `TENANT_SUSPENDED` | 403 | Tenant account has been suspended |
| `FORBIDDEN` | 403 | User lacks the required permission |
| `NOT_FOUND` | 404 | Resource doesn't exist or belongs to another tenant |
| `VALIDATION_ERROR` | 400 | Missing or malformed request fields |
| `SLUG_TAKEN` | 409 | Subdomain or page slug already in use |
| `PLAN_LIMIT_WEBSITES` | 429 | Website count at plan limit |
| `PLAN_LIMIT_PAGES` | 429 | Page count at plan limit |
| `PLAN_LIMIT_STORAGE` | 429 | Storage quota exceeded |
| `PLAN_LIMIT_AI` | 429 | AI credits exhausted for this month |
| `PLAN_LIMIT_TEAM` | 429 | Max collaborator count reached |
| `FEATURE_NOT_ALLOWED` | 403 | Feature requires a higher plan (e.g. custom domains on Starter) |
| `AI_PARSE_ERROR` | 500 | Claude returned malformed JSON |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### `429` Limit Error Shape

When a plan limit is hit, always include upgrade info:

```json
{
  "error": "PLAN_LIMIT_WEBSITES",
  "message": "Your Starter plan allows 1 website. Upgrade to create more.",
  "limit": 1,
  "current": 1,
  "upgradeUrl": "https://app.sitepilot.io/billing"
}
```

---

## 17. Permission Matrix

| Permission | owner | admin | editor | developer | viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| `view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `edit_content` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `use_ai` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `upload_assets` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `publish_website` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `invite_users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `manage_domains` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `view_analytics` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `manage_billing` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 18. Quick Route Summary Table

| Method | Route | Auth | Permission | Description |
|---|---|:---:|---|---|
| `POST` | `/api/auth/sync` | ✅ | — | Sync Firebase user to Supabase |
| `POST` | `/api/tenants/onboard` | ✅ | — | Create tenant, user, starter site |
| `GET` | `/api/websites` | ✅ | viewer | List tenant's websites |
| `POST` | `/api/websites` | ✅ | admin | Create new website |
| `GET` | `/api/websites/:id` | ✅ | viewer | Get website with pages |
| `PUT` | `/api/websites/:id` | ✅ | edit_content | Update website metadata/branding |
| `DELETE` | `/api/websites/:id` | ✅ | admin | Archive website |
| `POST` | `/api/websites/:id/publish` | ✅ | publish_website | Publish website (create deployment) |
| `GET` | `/api/pages` | ✅ | viewer | List pages for a website |
| `POST` | `/api/pages` | ✅ | edit_content | Create new page |
| `PUT` | `/api/pages/:id` | ✅ | edit_content | Update page title/slug/SEO |
| `DELETE` | `/api/pages/:id` | ✅ | admin | Delete page |
| `GET` | `/api/components` | ✅ | viewer | Get all components on a page |
| `POST` | `/api/components` | ✅ | edit_content | Add component to page |
| `PUT` | `/api/components/:id` | ✅ | edit_content | Update component props / reorder |
| `DELETE` | `/api/components/:id` | ✅ | edit_content | Remove component |
| `POST` | `/api/ai/generate` | ✅ | use_ai | Generate layout via Claude AI |
| `POST` | `/api/assets/upload` | ✅ | upload_assets | Upload file to Cloudinary |
| `GET` | `/api/assets` | ✅ | viewer | List tenant assets |
| `DELETE` | `/api/assets/:id` | ✅ | admin | Delete asset |
| `GET` | `/api/versions` | ✅ | edit_content | Get page version history |
| `POST` | `/api/versions/restore` | ✅ | edit_content | Restore page to a version |
| `POST` | `/api/domains/add` | ✅ | manage_domains | Add custom domain |
| `GET` | `/api/domains/verify/:websiteId` | ✅ | manage_domains | Check DNS verification status |
| `POST` | `/api/analytics/track` | ❌ | — | Track public page view |
| `GET` | `/api/analytics/dashboard` | ✅ | view_analytics | Get usage metrics |
| `GET` | `/api/team` | ✅ | admin | List team members + invitations |
| `POST` | `/api/team/invite` | ✅ | invite_users | Invite new team member |
| `DELETE` | `/api/team/:userId` | ✅ | invite_users | Remove team member |
| `GET` | `/api/billing/plans` | ✅ | owner | List all plans |
| `POST` | `/api/billing/create-checkout` | ✅ | manage_billing | Start Stripe Checkout |
| `POST` | `/api/billing/portal` | ✅ | manage_billing | Open Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | ❌ (sig) | — | Handle Stripe webhook events |

---

> **Total Routes:** 32  
> **Version:** 1.0  
> **Stack:** Next.js 14 App Router · Firebase Auth · Supabase · Stripe · Cloudinary · Claude AI  
> **Last Updated:** Project Kickoff
