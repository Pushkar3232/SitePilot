# 🎨 SitePilot — Complete Frontend Architecture Reference
> All Pages · All Routes · All Components · Role-Based Views · Middleware · Proxy
> Framework: Next.js 14 (App Router) · Styling: Tailwind CSS · State: Zustand

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Route Groups & URL Structure](#2-route-groups--url-structure)
3. [Middleware & Subdomain Proxy](#3-middleware--subdomain-proxy)
4. [Complete File & Folder Structure](#4-complete-file--folder-structure)
5. [Atomic Component System — Full Index](#5-atomic-component-system--full-index)
6. [Auth Pages](#6-auth-pages)
7. [Onboarding Flow](#7-onboarding-flow)
8. [Dashboard — Overview](#8-dashboard--overview)
9. [Websites Management Pages](#9-websites-management-pages)
10. [The Builder — Core Pages](#10-the-builder--core-pages)
11. [Pages Manager (Inside Builder)](#11-pages-manager-inside-builder)
12. [Branding Studio Page](#12-branding-studio-page)
13. [Domain Management Page](#13-domain-management-page)
14. [Team & Users Page](#14-team--users-page)
15. [Analytics Dashboard Page](#15-analytics-dashboard-page)
16. [Billing & Plans Page](#16-billing--plans-page)
17. [Settings Page](#17-settings-page)
18. [Public Tenant Site Renderer](#18-public-tenant-site-renderer)
19. [Site Block Components (Builder Blocks)](#19-site-block-components-builder-blocks)
20. [Role-Based Access — What Each Role Sees](#20-role-based-access--what-each-role-sees)
21. [Zustand Stores](#21-zustand-stores)
22. [Hooks Reference](#22-hooks-reference)
23. [Route Protection & Guards](#23-route-protection--guards)
24. [Loading & Error States](#24-loading--error-states)
25. [Responsive Breakpoints & Layout Rules](#25-responsive-breakpoints--layout-rules)
26. [Page-by-Page Summary Table](#26-page-by-page-summary-table)

---

## 1. Architecture Overview

### How Next.js 14 App Router Is Used

Next.js 14 App Router handles **two completely separate website experiences** in one codebase:

```
Experience 1: app.sitepilot.io  →  The SaaS Dashboard
  All tenant management, builder, billing, analytics lives here.
  Protected by Firebase Auth. Uses React Server + Client Components.

Experience 2: *.sitepilot.io    →  Public Tenant Websites
  The actual websites tenants build and publish.
  No auth required. Fully server-rendered from deployment snapshots.
  Routed via middleware based on subdomain.
```

### Rendering Strategy Per Route

| Route Type | Strategy | Why |
|---|---|---|
| Auth pages (login, register) | Client Component (CSR) | Firebase Auth runs in browser |
| Dashboard pages | Server Component + Client islands | Fast initial load, SEO not needed |
| Builder page | Full Client Component | Heavy interactivity, drag-and-drop |
| Public tenant sites | Server Component (SSR/ISR) | SEO critical, fast for visitors |
| API routes | Route Handlers (Edge/Node) | Serverless, scales automatically |

### Navigation Architecture

```
app.sitepilot.io/
├── / (marketing landing page)
├── /login
├── /register
├── /accept-invite?token=xxx
├── /onboarding
│
└── /dashboard/          ← All tenant management (auth required)
    ├── /                (overview)
    ├── /websites/
    ├── /websites/[id]/
    ├── /websites/[id]/builder/
    ├── /branding/
    ├── /domains/
    ├── /team/
    ├── /analytics/
    ├── /billing/
    └── /settings/


[subdomain].sitepilot.io/    ← Public tenant site (no auth)
└── /[...slug]               (any page slug on that site)
```

---

## 2. Route Groups & URL Structure

Next.js App Router uses **route groups** (folders in parentheses) to share layouts without affecting the URL.

### Route Group Breakdown

```
app/
│
├── (marketing)/                 ← Public marketing site group
│   ├── layout.tsx               → Marketing navbar + footer
│   └── page.tsx                 → Landing page: app.sitepilot.io/
│
├── (auth)/                      ← Auth pages group (no sidebar)
│   ├── layout.tsx               → Centered card layout, no nav
│   ├── login/
│   │   └── page.tsx             → app.sitepilot.io/login
│   ├── register/
│   │   └── page.tsx             → app.sitepilot.io/register
│   ├── forgot-password/
│   │   └── page.tsx             → app.sitepilot.io/forgot-password
│   └── accept-invite/
│       └── page.tsx             → app.sitepilot.io/accept-invite?token=xxx
│
├── (onboarding)/                ← Post-registration setup group
│   ├── layout.tsx               → Minimal layout, step progress bar
│   └── onboarding/
│       └── page.tsx             → app.sitepilot.io/onboarding
│
├── (dashboard)/                 ← Main app group (auth + sidebar)
│   ├── layout.tsx               → Dashboard shell: sidebar + topbar
│   └── dashboard/
│       ├── page.tsx             → /dashboard (overview)
│       ├── websites/
│       │   ├── page.tsx         → /dashboard/websites (list)
│       │   └── [websiteId]/
│       │       ├── page.tsx     → /dashboard/websites/[id] (detail)
│       │       └── builder/
│       │           └── page.tsx → /dashboard/websites/[id]/builder
│       ├── branding/
│       │   └── page.tsx         → /dashboard/branding
│       ├── domains/
│       │   └── page.tsx         → /dashboard/domains
│       ├── team/
│       │   └── page.tsx         → /dashboard/team
│       ├── analytics/
│       │   └── page.tsx         → /dashboard/analytics
│       ├── billing/
│       │   └── page.tsx         → /dashboard/billing
│       └── settings/
│           └── page.tsx         → /dashboard/settings
│
├── sites/                       ← Tenant site renderer (no auth)
│   └── [subdomain]/
│       └── [...slug]/
│           └── page.tsx         → Rendered tenant public site
│
└── api/                         ← All API route handlers
    └── [... all endpoints]
```

---

## 3. Middleware & Subdomain Proxy

> This is the most critical piece of infrastructure. It routes incoming requests to the correct handler based on the subdomain.

### How It Works — Step by Step

```
User visits: pizza-palace-x7k2.sitepilot.io/menu

Step 1: Request hits Vercel Edge Network
Step 2: middleware.ts executes BEFORE any page renders
Step 3: Middleware reads host header: "pizza-palace-x7k2.sitepilot.io"
Step 4: Splits by '.': subdomain = "pizza-palace-x7k2"
Step 5: Not "app" or "www" → this is a tenant subdomain
Step 6: Rewrites URL to: /sites/pizza-palace-x7k2/menu
Step 7: /sites/[subdomain]/[...slug]/page.tsx renders with subdomain="pizza-palace-x7k2", slug=["menu"]
Step 8: Page queries Supabase for tenant website + live deployment snapshot
Step 9: Renders the public site — visitor sees Pizza Palace website
```

```
User visits: app.sitepilot.io/dashboard

Step 1–2: Same as above
Step 3: Middleware reads host: "app.sitepilot.io"
Step 4: subdomain = "app"
Step 5: Is "app" → pass through normally, do NOT rewrite
Step 6: Normal Next.js routing handles /dashboard
Step 7: (dashboard)/layout.tsx checks Firebase auth
Step 8: User sees dashboard
```

### `middleware.ts` — Complete Implementation

```typescript
// middleware.ts  (root of project — runs on EVERY request)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// These subdomains are reserved and should NEVER be treated as tenant subdomains
const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'mail', 'status', 'docs'];

// These path prefixes bypass the middleware entirely
const BYPASS_PREFIXES = [
  '/_next/',       // Next.js internal assets
  '/favicon.ico',  // Favicon
  '/robots.txt',   // SEO robots file
  '/sitemap.xml',  // SEO sitemap
  '/api/',         // API routes (handled separately)
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── Step 1: Bypass static files and Next.js internals ──────────────
  if (BYPASS_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // ── Step 2: Parse the hostname ──────────────────────────────────────
  // In production: "pizza-palace.sitepilot.io" → subdomain = "pizza-palace"
  // In development: "pizza-palace.localhost:3000" → subdomain = "pizza-palace"
  const isProduction = process.env.NODE_ENV === 'production';
  const rootDomain = isProduction
    ? process.env.NEXT_PUBLIC_ROOT_DOMAIN!          // "sitepilot.io"
    : 'localhost:3000';

  // Remove the root domain to get just the subdomain part
  const subdomain = hostname
    .replace(`.${rootDomain}`, '')
    .split(':')[0]; // Remove port if present in development

  // ── Step 3: Check if this is a tenant subdomain ─────────────────────
  const isTenantSubdomain =
    hostname !== rootDomain &&                        // Not the root domain itself
    hostname !== `www.${rootDomain}` &&               // Not www
    !RESERVED_SUBDOMAINS.includes(subdomain) &&       // Not a reserved name
    subdomain !== hostname;                            // Has a subdomain (not root)

  if (!isTenantSubdomain) {
    // ── Regular app.sitepilot.io request ─────────────────────────────
    // Let Next.js handle it normally
    return NextResponse.next();
  }

  // ── Step 4: Rewrite to the tenant site renderer ─────────────────────
  // External URL stays the same (browser still shows pizza-palace.sitepilot.io)
  // Internal URL changes to /sites/[subdomain]/[...slug]
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/sites/${subdomain}${pathname}`;

  // Add subdomain as a header so the page component can read it
  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set('x-tenant-subdomain', subdomain);

  return response;
}

export const config = {
  // Run middleware on all routes EXCEPT Next.js static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

### Custom Domain Proxy

When a tenant has a verified custom domain like `www.mybakery.com`:

```
User visits: www.mybakery.com

Flow:
1. DNS: www.mybakery.com CNAME → mybakery-x7k2.sitepilot.io
2. Vercel receives request with host: www.mybakery.com
3. Middleware runs
4. hostname = "www.mybakery.com" — doesn't end with .sitepilot.io
5. Need special custom domain handling:

Updated middleware logic:
```

```typescript
// Inside middleware.ts — add custom domain check

// Check if this is a known custom domain (not a sitepilot subdomain)
// We look it up in the database — but we CAN'T query DB in Edge middleware
// Solution: Use Vercel's edge config or a cached lookup

// Approach: Add a custom header from Vercel's reverse proxy config
// Vercel can pass X-Forwarded-Host for custom domains

const customDomainHeader = request.headers.get('x-custom-domain-tenant');

if (customDomainHeader) {
  // Vercel (or your reverse proxy) has already identified this as tenant X
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/sites/${customDomainHeader}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

// Alternative for Vercel: store verified custom domains in Vercel Edge Config
// (a key-value store that's available in edge middleware without DB call)
// Key: "www.mybakery.com" → Value: "mybakery-x7k2"
import { get } from '@vercel/edge-config';

const tenantSlug = await get(hostname); // Edge Config lookup (< 1ms)
if (tenantSlug) {
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/sites/${tenantSlug}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}
```

### Auth Guard in Middleware

```typescript
// Also handle auth protection inside middleware
// Redirect unauthenticated users away from /dashboard

import { getToken } from 'next-auth/jwt'; // or Firebase Admin SDK

// If visiting /dashboard/* without being logged in:
if (pathname.startsWith('/dashboard')) {
  const token = request.cookies.get('firebase-auth-token')?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}
```

---

## 4. Complete File & Folder Structure

```
sitepilot/
│
├── app/
│   │
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Landing page
│   │
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── accept-invite/page.tsx
│   │
│   ├── (onboarding)/
│   │   ├── layout.tsx
│   │   └── onboarding/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                        # Main dashboard shell
│   │   └── dashboard/
│   │       ├── page.tsx                      # Overview
│   │       ├── websites/
│   │       │   ├── page.tsx                  # All websites list
│   │       │   └── [websiteId]/
│   │       │       ├── page.tsx              # Single website detail
│   │       │       └── builder/
│   │       │           └── page.tsx          # BUILDER (full screen)
│   │       ├── branding/page.tsx
│   │       ├── domains/page.tsx
│   │       ├── team/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── billing/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── sites/
│   │   └── [subdomain]/
│   │       └── [...slug]/
│   │           └── page.tsx                  # Public site renderer
│   │
│   └── api/
│       ├── tenants/
│       │   └── onboard/route.ts
│       ├── websites/
│       │   ├── route.ts                      # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts                  # GET, PUT, DELETE
│       │       └── publish/route.ts          # POST publish
│       ├── pages/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── components/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── ai/
│       │   └── generate/route.ts
│       ├── assets/
│       │   ├── route.ts
│       │   └── upload/route.ts
│       ├── analytics/
│       │   ├── track/route.ts
│       │   └── dashboard/route.ts
│       ├── billing/
│       │   ├── plans/route.ts
│       │   ├── create-checkout/route.ts
│       │   └── portal/route.ts
│       ├── team/
│       │   ├── route.ts
│       │   └── invite/route.ts
│       ├── domains/
│       │   ├── add/route.ts
│       │   └── verify/[websiteId]/route.ts
│       ├── versions/
│       │   ├── route.ts
│       │   └── restore/route.ts
│       └── webhooks/
│           └── stripe/route.ts
│
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Textarea/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── Toggle/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Icon/
│   │   ├── Spinner/
│   │   ├── Skeleton/
│   │   ├── Tooltip/
│   │   ├── Label/
│   │   ├── Divider/
│   │   └── ProgressBar/
│   │
│   ├── molecules/
│   │   ├── FormField/
│   │   ├── SearchInput/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── DropdownMenu/
│   │   ├── Tabs/
│   │   ├── Accordion/
│   │   ├── Alert/
│   │   ├── Toast/
│   │   ├── ColorPicker/
│   │   ├── FontPicker/
│   │   ├── ImageUploader/
│   │   ├── ConfirmDialog/
│   │   ├── EmptyState/
│   │   └── PlanLimitBadge/
│   │
│   ├── organisms/
│   │   ├── DashboardSidebar/
│   │   ├── DashboardTopbar/
│   │   ├── WebsiteCard/
│   │   ├── PlanCard/
│   │   ├── TeamMemberRow/
│   │   ├── VersionHistoryPanel/
│   │   ├── AIChat/
│   │   ├── ComponentPalette/
│   │   ├── BuilderToolbar/
│   │   ├── BuilderRightPanel/
│   │   ├── AnalyticsChart/
│   │   ├── UsageMeter/
│   │   └── UpgradeBanner/
│   │
│   └── site-blocks/
│       ├── NavbarBlock/
│       ├── HeroBlock/
│       ├── FeaturesBlock/
│       ├── GalleryBlock/
│       ├── TestimonialsBlock/
│       ├── PricingBlock/
│       ├── CTABlock/
│       ├── ContactFormBlock/
│       ├── TeamBlock/
│       ├── FAQBlock/
│       ├── StatsBlock/
│       ├── RichTextBlock/
│       ├── ImageTextBlock/
│       ├── VideoEmbedBlock/
│       ├── FooterBlock/
│       ├── PageRenderer/
│       └── ComponentFactory/
│
├── lib/
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── cloudinary.ts
│   ├── claude.ts
│   ├── rbac.ts
│   ├── plan-limits.ts
│   ├── fractional-index.ts
│   ├── slugify.ts
│   ├── branding-css.ts
│   └── auth-server.ts
│
├── store/
│   ├── builder.store.ts
│   ├── auth.store.ts
│   └── ui.store.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── usePermission.ts
│   ├── useTenant.ts
│   ├── useWebsites.ts
│   ├── useBuilder.ts
│   ├── useAI.ts
│   ├── useVersions.ts
│   ├── useAnalytics.ts
│   ├── useAssets.ts
│   └── useToast.ts
│
├── types/
│   ├── tenant.types.ts
│   ├── website.types.ts
│   ├── page.types.ts
│   ├── component.types.ts
│   ├── user.types.ts
│   ├── plan.types.ts
│   └── api.types.ts
│
├── constants/
│   ├── plans.ts
│   ├── component-types.ts
│   ├── templates.ts
│   ├── routes.ts
│   └── permissions.ts
│
├── utils/
│   ├── cn.ts              # Class name merger (clsx + tailwind-merge)
│   ├── format.ts          # Date, number, byte formatters
│   ├── validate.ts        # Form validation helpers
│   └── api-client.ts      # Typed fetch wrapper
│
├── middleware.ts           # Subdomain router (root level)
└── tailwind.config.ts
```

---

## 5. Atomic Component System — Full Index

> Every component, what it does, what props it takes, and where it's used.

### ATOMS — Smallest Units

---

#### `Button`
```typescript
// Usage: Any clickable action
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
};
// Used everywhere: forms, modals, toolbars, empty states
```

#### `Input`
```typescript
type InputProps = {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;           // Shows red border + error text below
  prefix?: React.ReactNode; // Icon or text before input
  suffix?: React.ReactNode; // Icon or text after input
  onChange?: (value: string) => void;
  onBlur?: () => void;
};
// Used in: all forms, search bars, inline editors
```

#### `Textarea`
```typescript
type TextareaProps = {
  placeholder?: string;
  value?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;   // Shows character counter
  error?: string;
  onChange?: (value: string) => void;
};
```

#### `Select`
```typescript
type SelectProps = {
  options: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  placeholder?: string;
  error?: string;
  onChange?: (value: string) => void;
};
```

#### `Checkbox`
```typescript
type CheckboxProps = {
  checked?: boolean;
  indeterminate?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};
```

#### `Toggle`
```typescript
type ToggleProps = {
  checked?: boolean;
  label?: string;
  description?: string;  // Sub-text below label
  disabled?: boolean;
  size?: 'sm' | 'md';
  onChange?: (checked: boolean) => void;
};
// Used in: settings, visibility toggles, feature flags
```

#### `Badge`
```typescript
type BadgeProps = {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;         // Show a colored dot before text
  children: React.ReactNode;
};
// Used in: status indicators, plan labels, role labels
// Examples: "Published" (green), "Draft" (gray), "Past Due" (red), "Pro" (purple)
```

#### `Avatar`
```typescript
type AvatarProps = {
  src?: string;
  name?: string;         // Used to generate initials if no image
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'offline'; // Status dot overlay
  ring?: boolean;        // White ring border (for stacked avatars)
};
// Used in: team list, topbar user menu, builder presence indicators
```

#### `Icon`
```typescript
type IconProps = {
  name: IconName;        // Union type of all allowed icon names (from lucide-react)
  size?: number;         // Default 16
  color?: string;
  className?: string;
};
// Wraps lucide-react icons with consistent sizing
```

#### `Spinner`
```typescript
type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
};
// Used inside Button (isLoading state), page loaders
```

#### `Skeleton`
```typescript
type SkeletonProps = {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  lines?: number;        // For 'text' variant: number of lines to show
  className?: string;
};
// Used in all loading states — replaces content while data loads
```

#### `ProgressBar`
```typescript
type ProgressBarProps = {
  value: number;         // 0–100
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  // Auto-changes color: <60% default, 60–80% warning, >80% danger
  showLabel?: boolean;
  label?: string;        // Override auto-generated "65%" label
  size?: 'sm' | 'md';
};
// Used in: usage meters (storage, AI credits, page count)
```

#### `Divider`
```typescript
type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  label?: string;        // Optional centered text: "or"
  className?: string;
};
```

#### `Label`
```typescript
type LabelProps = {
  htmlFor?: string;
  required?: boolean;    // Adds red asterisk
  children: React.ReactNode;
};
```

---

### MOLECULES — Composed from Atoms

---

#### `FormField`
```typescript
// Wraps Label + Input/Select/Textarea + error message
type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;         // Small help text below input
  error?: string;
  children: React.ReactNode; // The actual input atom
};
// Used in: ALL forms across the entire app
```

#### `SearchInput`
```typescript
type SearchInputProps = {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;   // Default 300ms
  isLoading?: boolean;
  onClear?: () => void;
};
// Used in: websites list, asset manager, team list
```

#### `Card`
```typescript
type CardProps = {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  hoverable?: boolean;   // Adds hover shadow effect
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};
// Base container used for dashboard sections, website cards, stat boxes
```

#### `Modal`
```typescript
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
};
// Used for: create website, invite user, delete confirmation, AI generation
```

#### `Drawer`
```typescript
type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  side?: 'right' | 'left' | 'bottom';
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};
// Used in builder: right panel for component editing, version history panel
```

#### `DropdownMenu`
```typescript
type DropdownMenuProps = {
  trigger: React.ReactNode;  // The element that opens the menu
  items: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    dividerAfter?: boolean;
  }[];
  align?: 'start' | 'end';
};
// Used in: website card actions, topbar user menu, component actions in builder
```

#### `Tabs`
```typescript
type TabsProps = {
  tabs: { label: string; value: string; icon?: React.ReactNode; badge?: string }[];
  activeTab: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pills' | 'bordered';
};
// Used in: website detail page, builder (desktop/tablet/mobile view switcher),
//          billing page (monthly/yearly toggle), settings page sections
```

#### `Accordion`
```typescript
type AccordionProps = {
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
    defaultOpen?: boolean;
  }[];
  allowMultiple?: boolean;
};
```

#### `Alert`
```typescript
type AlertProps = {
  variant: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
};
// Used for: plan limit warnings, domain verification status, billing alerts
```

#### `Toast`
```typescript
// Global toast notification system
// Triggered via useToast() hook from anywhere in the app
type ToastOptions = {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;     // Default 4000ms
  action?: { label: string; onClick: () => void };
};
// useToast().show({ title: 'Website published!', variant: 'success' })
```

#### `ColorPicker`
```typescript
type ColorPickerProps = {
  label: string;
  value: string;         // Hex color: "#FF6B35"
  onChange: (hex: string) => void;
  presets?: string[];    // Quick-select swatches
};
// Used in: Branding Studio page
```

#### `FontPicker`
```typescript
type FontPickerProps = {
  label: string;
  value: string;         // Font family name: "Inter"
  onChange: (fontFamily: string) => void;
  category?: 'all' | 'sans-serif' | 'serif' | 'monospace' | 'display';
};
// Used in: Branding Studio page
// Shows live preview of each font
```

#### `ImageUploader`
```typescript
type ImageUploaderProps = {
  label?: string;
  accept?: string;       // Default: "image/*"
  maxSizeMb?: number;
  value?: string;        // Current image URL (for preview)
  onUpload: (url: string) => Promise<void>;
  onRemove?: () => void;
  aspectRatio?: '1:1' | '16:9' | '3:1' | 'free';
  placeholder?: string;
};
// Used in: logo upload, favicon upload, component image fields
```

#### `ConfirmDialog`
```typescript
type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
};
// Used before: delete website, delete page, remove team member, unpublish
```

#### `EmptyState`
```typescript
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};
// Used when: no websites yet, no pages yet, no team members, no analytics data
```

#### `PlanLimitBadge`
```typescript
type PlanLimitBadgeProps = {
  current: number;
  max: number;
  unit: string;          // "websites", "pages", "MB", "credits"
};
// Shows: "3/10 websites" with color based on usage %
// Used in: topbar quick stats, create dialogs when approaching limits
```

---

### ORGANISMS — Complex Sections

---

#### `DashboardSidebar`
```typescript
// Fixed left sidebar in the dashboard layout
// Contents vary by user ROLE (see Section 20)
type DashboardSidebarProps = {
  tenant: Tenant;
  currentUser: User;
  currentPath: string;
};

// Nav items rendered:
const NAV_ITEMS = [
  { label: 'Overview',   icon: 'LayoutDashboard', href: '/dashboard',           roles: ['owner','admin','editor','developer','viewer'] },
  { label: 'Websites',   icon: 'Globe',           href: '/dashboard/websites',  roles: ['owner','admin','editor','developer','viewer'] },
  { label: 'Branding',   icon: 'Palette',         href: '/dashboard/branding',  roles: ['owner','admin','editor','developer'] },
  { label: 'Domains',    icon: 'Link',            href: '/dashboard/domains',   roles: ['owner','admin','developer'] },
  { label: 'Team',       icon: 'Users',           href: '/dashboard/team',      roles: ['owner','admin'] },
  { label: 'Analytics',  icon: 'BarChart2',       href: '/dashboard/analytics', roles: ['owner','admin','editor','developer','viewer'] },
  { label: 'Billing',    icon: 'CreditCard',      href: '/dashboard/billing',   roles: ['owner'] },
  { label: 'Settings',   icon: 'Settings',        href: '/dashboard/settings',  roles: ['owner','admin','editor','developer','viewer'] },
];
// Items not in user's role array are hidden completely
```

#### `DashboardTopbar`
```typescript
// Top header bar in the dashboard layout
type DashboardTopbarProps = {
  pageTitle: string;
  currentUser: User;
  tenant: Tenant;
};
// Contains:
// Left: Page title + breadcrumb
// Center: Global search (future feature)
// Right: Notification bell, Plan badge, User avatar + dropdown menu
//
// User dropdown items:
// - Profile & Preferences
// - Switch Workspace (if multi-tenant future feature)
// - Documentation link
// - Logout
```

#### `WebsiteCard`
```typescript
// Card shown on the /websites list page
type WebsiteCardProps = {
  website: Website;
  onEdit: () => void;
  onPublish: () => void;
  onOpenBuilder: () => void;
  onDelete: () => void;
  canPublish: boolean;   // Based on user role
  canDelete: boolean;
};
// Shows: name, subdomain URL, status badge, last updated, quick actions
// Actions dropdown: Open Builder, Edit Details, View Live, Copy URL, Archive
```

#### `PlanCard`
```typescript
// Plan selection card on billing page
type PlanCardProps = {
  plan: Plan;
  isCurrentPlan: boolean;
  billingCycle: 'monthly' | 'yearly';
  onSelect: () => void;
  isLoading?: boolean;
};
// Shows: name, price, feature list with check/cross icons, CTA button
```

#### `TeamMemberRow`
```typescript
// Single row in the team members table
type TeamMemberRowProps = {
  user: User;
  currentUserRole: string;
  onChangeRole: (userId: string, newRole: string) => void;
  onRemove: (userId: string) => void;
};
// Shows: avatar, name, email, role selector, last active, remove button
```

#### `VersionHistoryPanel`
```typescript
// Right drawer panel in the builder
type VersionHistoryPanelProps = {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
};
// Shows: list of saved versions with timestamp, trigger type, who saved
// Each version has: "Restore" button + "Preview" button
```

#### `AIChat`
```typescript
// The AI chatbot widget used during onboarding and in the builder
type AIChatProps = {
  mode: 'onboarding' | 'builder';
  websiteId?: string;
  onComplete: (result: AIGenerationResult) => void;
  onClose: () => void;
};
// Step-by-step conversation collecting:
// category → businessName → description → vibe → pages needed → logo
// Shows typing indicators, animated bubbles, progress steps
```

#### `ComponentPalette`
```typescript
// Left panel in the builder showing available block types
type ComponentPaletteProps = {
  onAddComponent: (type: ComponentType, afterKey: string | null) => void;
  currentPlan: Plan;
};
// Shows component type icons in categories:
// Layout: Navbar, Hero, Footer
// Content: Features, Gallery, Rich Text, Image+Text
// Social Proof: Testimonials, Team, Stats
// Conversion: CTA, Pricing, Contact Form
// Media: Video, Map
// Advanced (Pro only): Custom HTML
// Plan-gated components show a "Pro" badge and are disabled on lower plans
```

#### `BuilderToolbar`
```typescript
// Top toolbar in the builder page
type BuilderToolbarProps = {
  website: Website;
  currentPage: Page;
  isDirty: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onViewportChange: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
  activeViewport: 'desktop' | 'tablet' | 'mobile';
};
// Left: Logo + website name + page selector dropdown
// Center: Desktop / Tablet / Mobile viewport switcher
// Right: "Save" (if dirty) + "Preview" + "Publish" button
```

#### `BuilderRightPanel`
```typescript
// Context-sensitive right panel in the builder
// Shows different content based on what's selected
type BuilderRightPanelProps = {
  selectedComponentId: string | null;
  components: Component[];
};
// When nothing selected: shows Page Settings (SEO, page config)
// When component selected: shows component-specific prop editor
// Each component type has its own sub-panel with the relevant fields
```

#### `AnalyticsChart`
```typescript
// Recharts-based line chart for page views
type AnalyticsChartProps = {
  data: { date: string; pageViews: number; uniqueVisitors: number }[];
  metric: 'pageViews' | 'uniqueVisitors' | 'sessions';
  period: '7d' | '30d' | '90d';
};
```

#### `UsageMeter`
```typescript
// Storage / AI credits / websites usage bar
type UsageMeterProps = {
  label: string;
  current: number;
  max: number;
  unit: string;
  showUpgradePrompt?: boolean;
};
// Shows progress bar that auto-colors based on % used
// At 80%+: shows yellow warning
// At 95%+: shows red danger + upgrade button
```

#### `UpgradeBanner`
```typescript
// Banner shown when approaching any plan limit
type UpgradeBannerProps = {
  limitType: 'storage' | 'ai_credits' | 'websites' | 'pages';
  currentPercent: number;
  planName: string;
  onUpgrade: () => void;
  onDismiss: () => void;
};
```

---

## 6. Auth Pages

### `/login` — Login Page

```
URL: app.sitepilot.io/login
Layout: (auth) — Centered card, no sidebar
Route: app/(auth)/login/page.tsx
```

**Page Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│        [SitePilot Logo]                     │
│                                             │
│        Sign in to your account             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Email Address              [Input] │   │
│  │  Password                   [Input] │   │
│  │  [Forgot password?]                 │   │
│  │                                     │   │
│  │  [        Sign In Button        ]   │   │
│  │                                     │   │
│  │  ──────────── or ────────────────   │   │
│  │                                     │   │
│  │  [   Continue with Google     ]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Don't have an account? [Sign up]           │
│                                             │
└─────────────────────────────────────────────┘
```

**Components Used:** `FormField`, `Input`, `Button`, `Divider`

**Auth Logic:**
- On submit → `signInWithEmailAndPassword(auth, email, password)` (Firebase)
- On success → check `users` table for matching `firebase_uid`
- If user found → redirect to `/dashboard`
- If user not found (orphaned Firebase account) → redirect to `/register`
- On error → show inline error message (wrong password, user not found)
- Google Sign In → `signInWithPopup(auth, googleProvider)`

**Role Check After Login:**
```typescript
// After Firebase auth succeeds:
const { data: user } = await supabase
  .from('users')
  .select('*, tenants(status)')
  .eq('firebase_uid', firebaseUser.uid)
  .single();

if (user.tenants.status === 'suspended') {
  → Show: "Your account is suspended. Contact support."
}
if (!user.is_active) {
  → Show: "Your account has been deactivated."
}
// Redirect to saved location or /dashboard
const redirectTo = searchParams.get('redirect') || '/dashboard';
router.push(redirectTo);
```

---

### `/register` — Registration Page

```
URL: app.sitepilot.io/register
Layout: (auth) — Centered card
Route: app/(auth)/register/page.tsx
```

**Page Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│        Create your account                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Full Name                  [Input] │   │
│  │  Organization Name          [Input] │   │
│  │  Email Address              [Input] │   │
│  │  Password                   [Input] │   │
│  │  Confirm Password           [Input] │   │
│  │                                     │   │
│  │  Choose your plan:                  │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐        │   │
│  │  │Start │ │Growth│ │ Pro  │        │   │
│  │  │ Free │ │ $19  │ │ $49  │        │   │
│  │  └──────┘ └──────┘ └──────┘        │   │
│  │                                     │   │
│  │  [      Create Account        ]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Already have an account? [Sign in]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Components Used:** `FormField`, `Input`, `PlanCard` (mini), `Button`

**Registration Flow:**
1. Validate form (client-side: zod schema)
2. `createUserWithEmailAndPassword(auth, email, password)` → Firebase
3. `updateProfile(user, { displayName: fullName })` → Firebase
4. `POST /api/tenants/onboard` with `{ firebaseUid, email, orgName, planId }`
5. API creates: tenant → user → website → page → Stripe customer
6. If paid plan → redirect to Stripe Checkout first, then `/onboarding`
7. If free plan → redirect to `/onboarding`

---

### `/accept-invite` — Accept Invitation Page

```
URL: app.sitepilot.io/accept-invite?token=abc123
Layout: (auth)
Route: app/(auth)/accept-invite/page.tsx
```

**Logic:**
1. Page loads → `GET /api/team/invite/validate?token=xxx`
2. If token invalid/expired → show error state
3. If valid → show form with email pre-filled (read-only), name, password fields
4. On submit → create Firebase account → `POST /api/team/invite/accept` with token
5. API: sets invitation `status = 'accepted'`, creates user row with the pre-assigned role
6. Redirect to `/dashboard`

---

## 7. Onboarding Flow

```
URL: app.sitepilot.io/onboarding
Layout: (onboarding) — Step progress bar at top, no sidebar
Route: app/(onboarding)/onboarding/page.tsx
```

**Multi-Step Flow:**

```
Step 1: Welcome
  "Let's build your first website. Answer a few questions and our AI
   will create a starter site tailored to your business."
  [Get Started →]

Step 2: What type of website?
  Category picker with large visual cards:
  🍕 Restaurant   💼 Business    🎨 Portfolio
  🛍️ E-Commerce   ✍️ Blog         🚀 Startup
  📚 Education    💪 Fitness      [Other]

Step 3: Tell us about your business
  AI Chatbot activates here. Asks:
  Q1: "What's your business name?"
  Q2: "Describe what you do in one sentence."
  Q3: "What's the vibe? Pick one:"
      [Modern & Minimal] [Bold & Colorful] [Classic & Elegant]
  Q4: "Which pages do you need?"
      [x] Home  [x] About  [ ] Menu  [x] Contact  [ ] Gallery  [ ] Pricing
  Q5: "Got a logo? Drop it here — or skip for now."
      [ImageUploader or Skip]

Step 4: Generating...
  Animated loading screen while Claude API runs.
  "Our AI is designing your website..."
  Shows progress: Layout → Content → Colors → Done ✓

Step 5: Done!
  Preview thumbnail of generated site.
  [Open Builder →]  [View Live Preview →]
```

**Components Used:** `AIChat`, `ImageUploader`, `Button`, `Badge`, `Spinner`

**State:** All step state held in local React state (not persisted until step 5)

**On Complete:**
- Merge AI JSON into the tenant's starter website
- Update `websites.branding_config` with AI-generated colors
- Update all pages + components with AI-generated content
- Set `tenants.onboarding_completed = true`
- Redirect to `/dashboard/websites/[websiteId]/builder`

---

## 8. Dashboard — Overview

```
URL: app.sitepilot.io/dashboard
Route: app/(dashboard)/dashboard/page.tsx
Access: All roles
```

**Layout:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: [SitePilot] [Overview]                    [Plan] [Avatar ▼]    │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                      │
│   SIDEBAR        │   Welcome back, [Name] 👋                           │
│   ─────────      │                                                      │
│   Overview    ←  │   ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│   Websites       │   │ Websites │ │ Page     │ │ AI       │          │
│   Branding       │   │  2 / 3   │ │ Views    │ │ Credits  │          │
│   Domains        │   │ [====  ] │ │  1,284   │ │  8/50    │          │
│   Team           │   └──────────┘ └──────────┘ └──────────┘          │
│   Analytics      │                                                      │
│   Billing        │   Your Websites                     [+ New Website] │
│   Settings       │   ┌──────────────┐ ┌──────────────┐               │
│                  │   │ Pizza Palace │ │  Blog Site   │               │
│   ─────────      │   │ Published 🟢 │ │  Draft  ⚪   │               │
│   [Avatar]       │   │ [Builder]    │ │ [Builder]    │               │
│   John (Owner)   │   └──────────────┘ └──────────────┘               │
│                  │                                                      │
│                  │   Recent Activity                                    │
│                  │   • You published "Pizza Palace" — 2 hours ago      │
│                  │   • Sarah edited the Contact page — 5 hours ago     │
│                  │   • AI generated homepage content — yesterday        │
│                  │                                                      │
└──────────────────┴─────────────────────────────────────────────────────┘
```

**Components Used:**
- `DashboardSidebar`, `DashboardTopbar` (from layout)
- `Card` (3 stat cards)
- `UsageMeter` (inside each stat card)
- `WebsiteCard` (website thumbnails)
- `UpgradeBanner` (if any usage > 80%)
- `EmptyState` (if no websites yet)
- `Button` (+ New Website)

**Server Data Fetch:**
```typescript
// page.tsx is a Server Component
// Fetches all data in parallel before rendering
const [websites, metrics, aiUsage] = await Promise.all([
  fetchWebsites(tenantId),
  fetchDashboardMetrics(tenantId),
  fetchMonthlyAIUsage(tenantId),
]);
```

**Role Differences:**
- `viewer` → Cannot see "+ New Website" button
- `owner` → Sees billing alert if `subscription.status === 'past_due'`
- All roles see the overview, but edit actions are gated

---

## 9. Websites Management Pages

### `/dashboard/websites` — All Websites List

```
URL: app.sitepilot.io/dashboard/websites
Route: app/(dashboard)/dashboard/websites/page.tsx
Access: All roles (viewer = read only)
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Websites                                         [+ New Website]    │
│  Manage all your sites in one place                                  │
│                                                                      │
│  [Search websites...]         Filter: [All ▼] [Sort: Updated ▼]     │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  [thumbnail]     │  │  [thumbnail]     │  │  [+ New]         │  │
│  │  Pizza Palace    │  │  Our Blog        │  │                  │  │
│  │  🟢 Published    │  │  ⚪ Draft        │  │  Create a new    │  │
│  │  pizzapalace...  │  │  blog-site...    │  │  website         │  │
│  │  Updated 2h ago  │  │  Updated 3d ago  │  │                  │  │
│  │  [Builder] [···] │  │  [Builder] [···] │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**"+ New Website" Modal:**
```
┌──────────────────────────────────────────┐
│  Create New Website                 [×]  │
│                                          │
│  Website Name                           │
│  [Pizza Palace Blog              ]       │
│                                          │
│  Choose a Starting Template             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 🍕   │ │ 💼   │ │ 🎨   │ │ 🚀   │  │
│  │Rest- │ │Busi- │ │Port- │ │Start │  │
│  │aurant│ │ness  │ │folio │ │  up  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐                      │
│  │ ✍️   │ │🤖    │                      │
│  │ Blog │ │AI    │                      │
│  │      │ │Build │                      │
│  └──────┘ └──────┘                      │
│                                          │
│  [Cancel]              [Create Website]  │
└──────────────────────────────────────────┘
```

**Plan Limit Check:** If `websiteCount >= plan.max_websites` → show `PlanLimitBadge` instead of "+ New Website" button, with inline upgrade prompt.

---

### `/dashboard/websites/[websiteId]` — Website Detail

```
URL: app.sitepilot.io/dashboard/websites/[id]
Route: app/(dashboard)/dashboard/websites/[websiteId]/page.tsx
Access: All roles
```

**Layout (Tabs):**
```
[Overview] [Pages] [Settings]

Overview Tab:
─────────────
  Live URL: pizza-palace-x7k2.sitepilot.io     [Copy] [Open ↗]
  Status: 🟢 Published
  Last Deployed: 2 hours ago by John

  [Open Builder]  [Publish Changes]  [View Live Site]

  Deployment History:
  ─────────────────────────────────────────
  ● v4 - 2 hours ago (John) — LIVE          [Rollback]
  ○ v3 - Yesterday (John)                   [Rollback]
  ○ v2 - 3 days ago (Sarah)                 [Rollback]
  ─────────────────────────────────────────

Pages Tab:
──────────
  [+ Add Page]
  ─────────────────────────────────────────
  ≡  Home          /          Published  [Edit] [···]
  ≡  About         /about     Published  [Edit] [···]
  ≡  Contact       /contact   Draft      [Edit] [···]
  ─────────────────────────────────────────

Settings Tab (owner/admin only):
─────────────────────────────────
  Website Name: [Pizza Palace       ]
  Danger Zone:
  [Archive Website]  [Delete Website]
```

---

## 10. The Builder — Core Pages

```
URL: app.sitepilot.io/dashboard/websites/[id]/builder
Route: app/(dashboard)/dashboard/websites/[websiteId]/builder/page.tsx
Access: owner, admin, editor, developer (viewer cannot access)
Rendering: FULL Client Component (entire page is "use client")
Layout: FULLSCREEN — hides the dashboard sidebar and topbar
```

### Builder Full Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BUILDER TOOLBAR                                                              │
│ [← Back] [Pizza Palace ▼] [Home ▼]  [💻][📱][📲]  [Save] [Preview] [Publish]│
├───────────────┬─────────────────────────────────────────┬────────────────────┤
│               │                                         │                    │
│  COMPONENT    │   CANVAS — Live Preview                 │  RIGHT PANEL       │
│  PALETTE      │                                         │                    │
│  ───────────  │  ┌─────────────────────────────────┐   │  (nothing selected)│
│  Layout       │  │ ████ NAVBAR ████████████████████ │   │  Page Settings     │
│  · Navbar     │  │                                  │   │  ──────────────    │
│  · Hero       │  │ ██████████ HERO █████████████   │   │  Page Title:       │
│  · Footer     │  │ Authentic Italian Pizza          │   │  [Home          ]  │
│               │  │ [View Menu]  [Our Story]         │   │  SEO Title:        │
│  Content      │  │ ██████████████████████████████   │   │  [Home | Pizz...]  │
│  · Features   │  │                                  │   │  SEO Description:  │
│  · Gallery    │  │ ████ FEATURES ███████████████   │   │  [              ]  │
│  · Rich Text  │  │ ┌──────┐ ┌──────┐ ┌──────┐     │   │                    │
│  · Img+Text   │  │ │ 🔥   │ │ 🌿   │ │ ⭐   │     │   │  Show in Nav: [✓]  │
│               │  │ │Wood  │ │Fresh │ │Award │     │   │                    │
│  Social Proof │  │ └──────┘ └──────┘ └──────┘     │   │                    │
│  · Testimon.  │  │                                  │   │                    │
│  · Team       │  │ ████ GALLERY ████████████████   │   │                    │
│  · Stats      │  │ [img][img][img]                  │   │                    │
│               │  │ [img][img][img]                  │   │                    │
│  Conversion   │  │                                  │   │                    │
│  · CTA        │  │ ████ FOOTER █████████████████   │   │                    │
│  · Pricing    │  │ © 2025 Pizza Palace              │   │                    │
│  · Form       │  └─────────────────────────────────┘   │                    │
│               │                                         │                    │
│  [AI ✨]      │         [+ Add Section]                 │                    │
└───────────────┴─────────────────────────────────────────┴────────────────────┘
```

### When a Component Is Selected

```
User clicks on the HERO section...

Canvas: Hero section gets a blue border + action bar:
  ┌──────────────────────────────────────────────────────┐
  │ [↑ Move Up] [↓ Move Down] [👁 Hide] [⋮ Duplicate] [🗑 Delete]  │
  ├──────────────────────────────────────────────────────┤
  │ ██████████ HERO ██████████████████████████████████   │
  │ Authentic Italian Pizza                              │
  └──────────────────────────────────────────────────────┘

Right Panel changes to: Hero Settings
  ──────────────────────────────────
  Heading
  [Authentic Italian Pizza     ]

  Subheading
  [Made fresh daily with...    ]

  Primary CTA Label
  [View Menu                   ]

  Primary CTA Link
  [/menu                       ]

  Secondary CTA Label
  [Our Story                   ]

  Background Type
  (●) Image  ( ) Color  ( ) Video

  Background Image
  [ImageUploader — current: hero-bg.jpg  [Change] [Remove]]

  Overlay Opacity
  [━━━━━━━○━━━━] 40%

  Text Color
  [ColorPicker: #FFFFFF         ]

  Layout
  ( ) Centered  (●) Left-aligned  ( ) Full-bleed

  Min Height
  [80vh                        ]
```

### Builder State Architecture

```typescript
// The builder page manages multiple real-time state layers:

Layer 1: Server state (React Query / SWR)
  - Initial components fetched on page load
  - Auto-refetch if another collaborator makes changes

Layer 2: Builder store (Zustand)
  - Local component edits before save
  - Selected component ID
  - Undo/redo stack
  - isDirty flag

Layer 3: Supabase Realtime
  - Subscribe to changes on components table for this page
  - Merge incoming changes from collaborators into local state

Layer 4: Auto-save (setInterval 30s)
  - If isDirty → PATCH /api/components/bulk + POST /api/versions (auto)
  - Reset isDirty flag
```

### Viewport Switcher Behavior

```
Desktop (default): Canvas width = 100% of available space
Tablet:            Canvas width = 768px, centered, rest is gray
Mobile:            Canvas width = 390px, centered, rest is gray

All components are responsive CSS — viewport switcher just shows
how the site looks at different widths inside the canvas container.
No separate mobile layouts are stored — pure responsive CSS.
```

---

## 11. Pages Manager (Inside Builder)

The page switcher is a dropdown in the BuilderToolbar (not a separate page).

```
[Home ▼]  ← Click to open page manager dropdown

┌───────────────────────────────────────────┐
│  Pages                       [+ New Page] │
│  ─────────────────────────────────────    │
│  ●  Home          /          Published    │
│  ○  About Us      /about     Draft        │
│  ○  Contact       /contact   Published    │
│  ─────────────────────────────────────    │
│  [Manage All Pages ↗]                     │
└───────────────────────────────────────────┘
```

**New Page Modal (from builder):**
```
Page Title:    [Our Menu             ]
URL Slug:      /menu  (auto-generated, editable)
Template:      ( ) Blank  (●) Copy from: [Home ▼]
[Cancel]  [Create Page]
```

**Plan Limit:** If `pageCount >= plan.max_pages_per_site` → "New Page" button shows plan limit error modal with upgrade prompt.

---

## 12. Branding Studio Page

```
URL: app.sitepilot.io/dashboard/branding
Route: app/(dashboard)/dashboard/branding/page.tsx
Access: owner, admin, editor, developer
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Branding Studio                                   [Apply to Site ▼] │
│  Configure your visual identity                                       │
│                                                                       │
│  Website: [Pizza Palace ▼]                                           │
│                                                                       │
├────────────────────────────┬─────────────────────────────────────────┤
│                            │                                         │
│  SETTINGS PANEL            │  LIVE PREVIEW                          │
│                            │                                         │
│  Colors                    │  ┌────────────────────────────────┐    │
│  ─────────────             │  │ ████ NAVBAR ████████████████   │    │
│  Primary                   │  │ [LOGO] Home About Contact      │    │
│  [ColorPicker: #FF6B35]    │  ├────────────────────────────────┤    │
│                            │  │ ███████████ HERO ██████████    │    │
│  Secondary                 │  │ Your Business Name             │    │
│  [ColorPicker: #2D3436]    │  │ Tagline text goes here         │    │
│                            │  │ [CTA BUTTON]                   │    │
│  Background                │  ├────────────────────────────────┤    │
│  [ColorPicker: #FFFFFF]    │  │ ████ FEATURES ██████████████   │    │
│                            │  │ ┌────┐  ┌────┐  ┌────┐        │    │
│  Accent                    │  │ │ ■  │  │ ■  │  │ ■  │        │    │
│  [ColorPicker: #FDCB6E]    │  │ └────┘  └────┘  └────┘        │    │
│                            │  └────────────────────────────────┘    │
│  Typography                │                                         │
│  ─────────────             │  Preview updates LIVE as you            │
│  Heading Font              │  change settings on the left.          │
│  [FontPicker: Playfair]    │                                         │
│                            │                                         │
│  Body Font                 │                                         │
│  [FontPicker: Inter]       │                                         │
│                            │                                         │
│  Base Size: [16px ▼]       │                                         │
│                            │                                         │
│  Logo & Favicon            │                                         │
│  ─────────────             │                                         │
│  Logo                      │                                         │
│  [ImageUploader]           │                                         │
│                            │                                         │
│  Favicon                   │                                         │
│  [ImageUploader]           │                                         │
│                            │                                         │
│  [Reset to Defaults]       │                                         │
│  [Save Branding]           │                                         │
│                            │                                         │
└────────────────────────────┴─────────────────────────────────────────┘
```

**How Live Preview Works:**
- Right panel is an `<iframe>` rendering a special `/preview/branding` route
- As ColorPicker changes, it `postMessage`s the new CSS variables to the iframe
- iframe applies them to `:root` instantly — zero round trip to server
- Save button writes to `websites.branding_config` in Supabase

---

## 13. Domain Management Page

```
URL: app.sitepilot.io/dashboard/domains
Route: app/(dashboard)/dashboard/domains/page.tsx
Access: owner, admin, developer
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Domains                                                             │
│  Manage how visitors reach your websites                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Pizza Palace                                                  │ │
│  │                                                                │ │
│  │  Default URL                                                   │ │
│  │  🔗 https://pizza-palace-x7k2.sitepilot.io          [Copy]     │ │
│  │                                                                │ │
│  │  Custom Domain                             [Growth Plan] ✓     │ │
│  │  ──────────────────────────────────────────────────────────   │ │
│  │                                                                │ │
│  │  [No custom domain connected]                                  │ │
│  │                                                                │ │
│  │  [+ Connect Custom Domain]                                     │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Our Blog                                                      │ │
│  │  ...                                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Connect Custom Domain Modal:**
```
┌──────────────────────────────────────────────────┐
│  Connect Custom Domain                      [×]  │
│                                                  │
│  Step 1: Enter your domain                       │
│  [www.pizzapalace.com                    ]        │
│                                                  │
│  [Next →]                                        │
│                                                  │
│  ────────────────────────────────────────────    │
│                                                  │
│  Step 2: Update your DNS settings                │
│  Add a CNAME record in your domain provider:     │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ Type  │  Name  │  Value                 │    │
│  │ CNAME │  www   │  pizza-palace.site...  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [Copy CNAME Value]                              │
│                                                  │
│  ────────────────────────────────────────────    │
│                                                  │
│  Step 3: Verify                                  │
│  ⏳ Checking DNS... (last checked 2 min ago)     │
│                                                  │
│  DNS can take up to 48 hours to propagate.       │
│                                                  │
│  [Check Again]           [Done — I'll Come Back] │
└──────────────────────────────────────────────────┘
```

**Verification States:**
- `pending` → Yellow pulsing dot — "Waiting for DNS..."
- `verified` → Green checkmark — "Domain connected ✓"
- `failed` → Red — "Incorrect CNAME. Expected: xxx. Got: yyy."

**Plan Gate:** Custom domain section is blurred + locked with "Requires Growth plan" overlay for Starter users.

---

## 14. Team & Users Page

```
URL: app.sitepilot.io/dashboard/team
Route: app/(dashboard)/dashboard/team/page.tsx
Access: owner, admin (editor/developer/viewer see this page but CANNOT edit)
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Team                                               [Invite Member]  │
│  Manage who has access to your workspace                             │
│                                                                      │
│  Active Members (3)                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  [Avatar] John Smith          john@pizza.com   [Owner ▼]  Active    │
│           Joined Jan 15                                   [Remove]  │
│                                                                      │
│  [Avatar] Sarah Jones         sarah@pizza.com  [Admin ▼]  Active    │
│           Invited by John · Joined Jan 20                 [Remove]  │
│                                                                      │
│  [Avatar] Mike Dev            mike@pizza.com   [Developer▼] Active  │
│           Invited by John · Joined Jan 22                 [Remove]  │
│                                                                      │
│  Pending Invitations (1)                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  [📧] designer@pizza.com                        Editor   Expires 6d  │
│       Sent by John · Jan 28                               [Revoke]  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Collaborators: 3 / 5          [====      ]  Growth Plan   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Invite Member Modal:**
```
┌──────────────────────────────────────────┐
│  Invite Team Member                 [×]  │
│                                          │
│  Email Address                           │
│  [designer@pizzapalace.com       ]        │
│                                          │
│  Role                                    │
│  [Editor                        ▼]       │
│                                          │
│  Role Permissions:                       │
│  ✓ Edit website content                 │
│  ✓ Use AI builder                       │
│  ✓ Upload media                         │
│  ✗ Publish websites                     │
│  ✗ Manage domains                       │
│  ✗ Manage billing                       │
│                                          │
│  [Cancel]              [Send Invitation] │
└──────────────────────────────────────────┘
```

**Permissions per role (shown in UI tooltips):**

| Feature | Owner | Admin | Dev | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Change role selector | ✅ | ✅ (not owner) | ❌ | ❌ | ❌ |
| Remove button visible | ✅ | ✅ (not owner) | ❌ | ❌ | ❌ |
| Invite button visible | ✅ | ✅ | ❌ | ❌ | ❌ |
| View member list | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 15. Analytics Dashboard Page

```
URL: app.sitepilot.io/dashboard/analytics
Route: app/(dashboard)/dashboard/analytics/page.tsx
Access: All roles
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Analytics                                                           │
│                                                                      │
│  Website: [All Websites ▼]    Period: [Last 30 days ▼]              │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │  Page Views  │ │   Visitors   │ │  Avg Session │ │ Bounce Rate│ │
│  │   1,284      │ │    847       │ │   2m 14s     │ │   64%      │ │
│  │  ↑ 12%       │ │  ↑ 8%        │ │  ↑ 3%        │ │  ↓ 2%      │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                      │
│  Page Views Over Time                                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                          Recharts Line Chart                   │ │
│  │    /\/\/\                                                      │ │
│  │   /      \    /\/\                                             │ │
│  │  /        \  /    \   /\/\/\                                   │ │
│  │ /          \/      \_/      \___                               │ │
│  │─────────────────────────────────── Jan 1 ─── Jan 30          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────┐ ┌──────────────────────────────┐   │
│  │  Top Pages                 │ │  Traffic Sources             │   │
│  │  ───────────────────────   │ │  ────────────────────────    │   │
│  │  / (Home)       642 views  │ │  Direct          48%         │   │
│  │  /menu          284 views  │ │  Google          31%         │   │
│  │  /about         198 views  │ │  Social          14%         │   │
│  │  /contact       160 views  │ │  Other            7%         │   │
│  └────────────────────────────┘ └──────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────┐ ┌──────────────────────────────┐   │
│  │  Devices                   │ │  Top Countries               │   │
│  │  Mobile      58%           │ │  United States    52%        │   │
│  │  Desktop     36%           │ │  India            18%        │   │
│  │  Tablet       6%           │ │  United Kingdom   12%        │   │
│  └────────────────────────────┘ └──────────────────────────────┘   │
│                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  ⚠️  Analytics are available on the Growth plan and above.          │
│  [Upgrade to Growth]                                                 │
│  (shown only for Starter plan tenants — above the chart section)    │
└──────────────────────────────────────────────────────────────────────┘
```

**Components Used:** `AnalyticsChart` (Recharts), `Card`, `Badge`, `Tabs`, `Select`

**Plan Gate:** Starter plan → Charts are blurred with an upgrade overlay. Summary stat cards still show basic counts.

---

## 16. Billing & Plans Page

```
URL: app.sitepilot.io/dashboard/billing
Route: app/(dashboard)/dashboard/billing/page.tsx
Access: owner ONLY
```

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Billing & Plans                                                     │
│                                                                      │
│  Current Plan                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Growth Plan                              $19/month            │ │
│  │  Next billing: February 28, 2025                               │ │
│  │  Status: ● Active                                              │ │
│  │                                                                │ │
│  │  Usage this period:                                            │ │
│  │  Websites:    2 / 3     [======    ]                           │ │
│  │  Storage:     280MB / 500MB [=======   ]                       │ │
│  │  AI Credits:  42 / 50   [=========  ]                          │ │
│  │                                                                │ │
│  │  [Manage Billing (Stripe Portal)]                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Available Plans               [Monthly ●] [Yearly — save 20%]     │
│                                                                      │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐          │
│  │  Starter       │ │  Growth  ★     │ │  Pro           │          │
│  │  Free          │ │  $19/mo  ←CURR │ │  $49/mo        │          │
│  │                │ │                │ │                │          │
│  │  ✓ 1 website   │ │  ✓ 3 websites  │ │  ✓ 10 websites │          │
│  │  ✓ 5 pages     │ │  ✓ 20 pages    │ │  ✓ 100 pages   │          │
│  │  ✓ 100MB       │ │  ✓ 500MB       │ │  ✓ 2GB storage │          │
│  │  ✓ 10 AI cred  │ │  ✓ 50 AI cred  │ │  ✓ 200 AI cred │          │
│  │  ✗ Custom domain│ │  ✓ Custom dom  │ │  ✓ Custom dom  │          │
│  │  ✗ Analytics   │ │  ✓ Analytics   │ │  ✓ Analytics   │          │
│  │  ✗ Collab      │ │  ✓ 5 users     │ │  ✓ 20 users    │          │
│  │                │ │                │ │                │          │
│  │  [Downgrade]   │ │  Current Plan  │ │  [Upgrade →]   │          │
│  └────────────────┘ └────────────────┘ └────────────────┘          │
│                                                                      │
│  Billing History                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  Jan 28, 2025   Growth Plan   $19.00   Paid ✓   [Download]          │
│  Dec 28, 2024   Growth Plan   $19.00   Paid ✓   [Download]          │
└──────────────────────────────────────────────────────────────────────┘
```

**Plan Change Flow:**
- Upgrade → Open Stripe Checkout in new tab/modal
- Downgrade → Show confirmation with warning about what will be limited
- Stripe Portal button → Opens Stripe Customer Portal (update card, cancel, etc.)

---

## 17. Settings Page

```
URL: app.sitepilot.io/dashboard/settings
Route: app/(dashboard)/dashboard/settings/page.tsx
Access: All roles (but most sections gated by role)
```

**Layout (Tabs):**
```
[Profile] [Organization] [Notifications] [Danger Zone]

Profile Tab (all roles):
  Full Name:  [John Smith          ]
  Email:      [john@pizza.com      ] (read-only, change in Firebase)
  Avatar:     [ImageUploader]
  [Save Changes]

Organization Tab (owner/admin only):
  Organization Name: [Pizza Palace    ]
  Timezone:          [America/Chicago ▼]
  Locale:            [English (US)    ▼]
  [Save Changes]

Notifications Tab (all roles):
  ☑ Email me when a website is published
  ☑ Email me when a team member accepts invite
  ☑ Email me when billing changes
  ☐ Weekly analytics digest
  [Save Preferences]

Danger Zone Tab (owner only):
  Archive Tenant:
  "Disables all websites. Data retained for 90 days."
  [Archive Organization]

  Delete Account:
  "Permanently delete all data. This cannot be undone."
  Type "DELETE" to confirm: [          ]
  [Delete Everything]
```

---

## 18. Public Tenant Site Renderer

```
Route: app/sites/[subdomain]/[...slug]/page.tsx
Rendering: SERVER Component (ISR with revalidate = 60 seconds)
Auth: None required
Access: Public — any visitor
```

### How It Renders

```typescript
// app/sites/[subdomain]/[...slug]/page.tsx

import { supabase } from '@/lib/supabase';
import { PageRenderer } from '@/components/site-blocks/PageRenderer';
import { generateBrandingCSS } from '@/lib/branding-css';
import { notFound } from 'next/navigation';

export const revalidate = 60; // ISR: rebuild page at most once per minute

export default async function TenantSitePage({
  params
}: {
  params: { subdomain: string; slug?: string[] }
}) {
  // Construct page slug from URL
  const pageSlug = '/' + (params.slug?.join('/') || '');

  // ── Fetch website by subdomain ────────────────────────────────────
  const { data: website, error } = await supabase
    .from('websites')
    .select('id, branding_config, seo_defaults, analytics_enabled, tenant_id')
    .eq('subdomain', params.subdomain)
    .eq('status', 'published')
    .single();

  if (error || !website) return notFound();

  // ── Fetch live deployment snapshot ───────────────────────────────
  const { data: deployment } = await supabase
    .from('deployments')
    .select('snapshot_json')
    .eq('website_id', website.id)
    .eq('is_live', true)
    .single();

  if (!deployment) return notFound();

  const snapshot = deployment.snapshot_json;

  // ── Find the requested page in the snapshot ──────────────────────
  const page = snapshot.pages?.find((p: any) => p.slug === pageSlug);
  if (!page) return notFound();

  // ── Generate CSS vars from branding config ───────────────────────
  const brandingCSS = generateBrandingCSS(website.branding_config);

  // ── Build navigation from all published pages ────────────────────
  const navPages = snapshot.pages
    ?.filter((p: any) => p.show_in_nav)
    .sort((a: any, b: any) => a.nav_order - b.nav_order);

  return (
    <>
      {/* Inject branding as CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: brandingCSS }} />

      {/* Inject analytics tracking pixel */}
      {website.analytics_enabled && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window._SP_WEBSITE_ID = "${website.id}";
              window._SP_PAGE = "${pageSlug}";
              fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  website_id: window._SP_WEBSITE_ID,
                  page: window._SP_PAGE,
                  referrer: document.referrer
                })
              });
            `
          }}
        />
      )}

      {/* Render the page components */}
      <PageRenderer
        components={page.components}
        navPages={navPages}
        branding={website.branding_config}
        currentSlug={pageSlug}
      />
    </>
  );
}

// Static params for ISR pre-generation
export async function generateStaticParams() {
  // Pre-generate the homepage for all published websites
  const { data: websites } = await supabase
    .from('websites')
    .select('subdomain')
    .eq('status', 'published');

  return websites?.map(w => ({ subdomain: w.subdomain, slug: [] })) || [];
}
```

### PageRenderer Component

```typescript
// components/site-blocks/PageRenderer/PageRenderer.tsx
// This is the HEART of the public site rendering

'use client'; // Needed for interactive components (forms, modals)

import { ComponentFactory } from '../ComponentFactory';

export function PageRenderer({
  components,
  navPages,
  branding,
  currentSlug
}: PageRendererProps) {
  // Filter visible components, sort by order_key
  const visibleComponents = components
    .filter(c => c.is_visible)
    .sort((a, b) => a.order_key.localeCompare(b.order_key));

  return (
    <main>
      {visibleComponents.map((component, index) => (
        <ComponentFactory
          key={`${component.type}-${index}`}
          type={component.type}
          props={{
            ...component.props,
            // Inject nav data into navbar component
            ...(component.type === 'navbar' ? { navPages, currentSlug } : {}),
          }}
          branding={branding}
        />
      ))}
    </main>
  );
}
```

### ComponentFactory

```typescript
// components/site-blocks/ComponentFactory/ComponentFactory.tsx

import { NavbarBlock } from '../NavbarBlock';
import { HeroBlock } from '../HeroBlock';
import { FeaturesBlock } from '../FeaturesBlock';
// ... all other blocks

const BLOCK_MAP: Record<string, React.ComponentType<any>> = {
  navbar:        NavbarBlock,
  hero:          HeroBlock,
  features:      FeaturesBlock,
  gallery:       GalleryBlock,
  testimonials:  TestimonialsBlock,
  pricing:       PricingBlock,
  cta:           CTABlock,
  contact_form:  ContactFormBlock,
  team:          TeamBlock,
  faq:           FAQBlock,
  stats:         StatsBlock,
  rich_text:     RichTextBlock,
  image_text:    ImageTextBlock,
  video_embed:   VideoEmbedBlock,
  map:           MapBlock,
  footer:        FooterBlock,
};

export function ComponentFactory({ type, props, branding }: ComponentFactoryProps) {
  const Block = BLOCK_MAP[type];

  if (!Block) {
    console.warn(`Unknown component type: ${type}`);
    return null;
  }

  return <Block {...props} branding={branding} />;
}
```

---

## 19. Site Block Components (Builder Blocks)

> Every component that can be placed on a page. Each one works in THREE contexts:
> 1. Builder (editable, with selection handles)
> 2. Preview (read-only, exact visual output)
> 3. Published site (read-only, from snapshot)

### Component Mode Prop

```typescript
// All site blocks accept an optional `mode` prop
type BlockMode = 'published' | 'preview' | 'builder';

// In 'builder' mode:
// - Show blue selection border on hover
// - Show component type label in corner
// - Emit onClick to select in builder store
// - Show empty state placeholders for empty fields

// In 'preview' and 'published':
// - Render exactly as visitor would see
// - No editing UI whatsoever
```

### All 15 Site Block Components

---

#### `NavbarBlock`
```
Renders: Logo + navigation links + optional CTA button
Variants: sticky (scrolls with page), static (stays at top)
Mobile: Hamburger menu with slide-out drawer
Interactive: Mobile menu open/close state
```

#### `HeroBlock`
```
Renders: Full-width section with heading, subtext, CTA buttons
Variants: centered, left-aligned, full-bleed
Background: image, solid color, or gradient
Responsive: Heading size scales down on mobile
```

#### `FeaturesBlock`
```
Renders: Grid of feature cards (icon + title + description)
Layouts: 2-column, 3-column, 4-column, horizontal list
Icons: Uses lucide-react icon names stored in props
```

#### `GalleryBlock`
```
Renders: Image grid
Layouts: masonry, uniform grid, carousel/slider
Interactive: Lightbox modal on image click (published + preview)
Mobile: Collapses to 2-col or 1-col
```

#### `TestimonialsBlock`
```
Renders: Review cards with avatar, name, rating stars, text
Layouts: grid, carousel, single featured
Data: Array of review objects in props
```

#### `PricingBlock`
```
Renders: Pricing plan cards side by side
Variants: 2-plan, 3-plan
Toggle: Monthly/yearly billing toggle (interactive on published site)
Highlight: One plan can be marked "featured" for emphasis
```

#### `CTABlock`
```
Renders: Full-width banner with heading + 1-2 buttons
Variants: centered, side-by-side (text + button)
Background: primary color, custom color, dark
```

#### `ContactFormBlock`
```
Renders: Form with configurable fields + contact info sidebar
Interactive: Form submission → POST to /api/contact (sends email)
Validation: Client-side required field validation
Success state: Shows success message after submission
```

#### `TeamBlock`
```
Renders: Grid of team member cards (photo + name + title + bio)
Layout: 3-column grid
Each card: Cloudinary image, name, role/title, optional bio, optional social links
```

#### `FAQBlock`
```
Renders: Accordion of question/answer pairs
Interactive: Click to expand/collapse (published + preview)
Schema markup: Outputs FAQ structured data JSON-LD for SEO
```

#### `StatsBlock`
```
Renders: Large number counters with labels
Interactive: Animated count-up on scroll into view (Intersection Observer)
Example: "1,200+ Happy Customers", "10 Years Experience"
```

#### `RichTextBlock`
```
Renders: HTML content from a WYSIWYG editor
In builder: Mini toolbar with bold/italic/link/list/heading
In published: Pure HTML output, styled by branding CSS variables
```

#### `ImageTextBlock`
```
Renders: 50/50 split layout — image on one side, text + CTA on the other
Variants: image-left, image-right
Mobile: Stacks vertically
```

#### `VideoEmbedBlock`
```
Renders: Embedded video player
Sources: YouTube URL, Vimeo URL
In builder: Shows placeholder thumbnail (no autoplay)
In published: Lazy-loaded iframe
```

#### `FooterBlock`
```
Renders: Multi-column footer with logo, links, social icons, copyright
Background: Dark or matches branding secondary color
Responsive: Columns stack on mobile
```

---

## 20. Role-Based Access — What Each Role Sees

### Sidebar Navigation Visibility

| Nav Item | Owner | Admin | Developer | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Overview | ✅ | ✅ | ✅ | ✅ | ✅ |
| Websites | ✅ | ✅ | ✅ | ✅ | ✅ |
| Branding | ✅ | ✅ | ✅ | ✅ | ❌ |
| Domains | ✅ | ✅ | ✅ | ❌ | ❌ |
| Team | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ |

### Dashboard Overview — Role Differences

| Element | Owner | Admin | Developer | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| "+ New Website" button | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing alert banner | ✅ | ❌ | ❌ | ❌ | ❌ |
| "Open Builder" on card | ✅ | ✅ | ✅ | ✅ | ❌ |
| "Publish" on card | ✅ | ✅ | ✅ | ❌ | ❌ |
| "Delete" on card | ✅ | ✅ | ❌ | ❌ | ❌ |

### Builder Page — Role Differences

| Element | Owner | Admin | Developer | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Access builder at all | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit component props | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add / remove components | ✅ | ✅ | ✅ | ✅ | ❌ |
| Drag to reorder | ✅ | ✅ | ✅ | ✅ | ❌ |
| "Publish" button visible | ✅ | ✅ | ✅ | ❌ | ❌ |
| "Publish" button enabled | ✅ | ✅ | ✅ | ❌ | ❌ |
| Use AI ✨ button | ✅ | ✅ | ✅ | ✅ | ❌ |
| Version history → Restore | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lock/unlock components | ✅ | ✅ | ❌ | ❌ | ❌ |
| Page settings (SEO) | ✅ | ✅ | ✅ | ✅ | ❌ |

### Viewer Role — Special Case

Viewer is the only role that:
- Cannot access the builder
- Cannot access branding, domains, team, billing
- Can only VIEW websites list, analytics, and settings (profile only)
- Useful for: clients who want to monitor performance without editing anything

### PermissionGate Component Usage

```typescript
// Example: Publish button only visible to roles that can publish
<PermissionGate action="publish_website">
  <Button variant="primary" onClick={handlePublish}>
    Publish
  </Button>
</PermissionGate>

// Example: Upgrade prompt shown only to owner
<PermissionGate action="manage_billing">
  <UpgradeBanner onUpgrade={goToBilling} />
</PermissionGate>

// Example: Delete with fallback for non-admins
<PermissionGate
  action="manage_websites"
  fallback={
    <Tooltip content="Only admins can delete websites">
      <Button disabled>Delete</Button>
    </Tooltip>
  }
>
  <Button variant="danger" onClick={handleDelete}>Delete</Button>
</PermissionGate>
```

---

## 21. Zustand Stores

### `builder.store.ts` — Builder State

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BuilderStore {
  // ── State ──────────────────────────────────────────────────────────
  components: Component[];
  selectedComponentId: string | null;
  activePageId: string | null;
  activeWebsiteId: string | null;
  viewport: 'desktop' | 'tablet' | 'mobile';
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;

  // Undo/redo stacks (last 30 states)
  undoStack: Component[][];
  redoStack: Component[][];

  // ── Actions ────────────────────────────────────────────────────────
  setComponents: (components: Component[]) => void;
  selectComponent: (id: string | null) => void;

  updateComponentProps: (id: string, newProps: Partial<any>) => void;
  addComponent: (type: ComponentType, afterKey: string | null) => void;
  removeComponent: (id: string) => void;
  reorderComponent: (dragId: string, newOrderKey: string) => void;
  toggleComponentVisibility: (id: string) => void;
  duplicateComponent: (id: string) => void;

  setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;

  undo: () => void;
  redo: () => void;

  // Bulk operations
  applyAIResult: (result: AIGenerationResult) => void;
  resetToSaved: (savedComponents: Component[]) => void;
}

export const useBuilderStore = create<BuilderStore>()(
  devtools(
    (set, get) => ({
      components: [],
      selectedComponentId: null,
      activePageId: null,
      activeWebsiteId: null,
      viewport: 'desktop',
      isDirty: false,
      isSaving: false,
      isPublishing: false,
      undoStack: [],
      redoStack: [],

      setComponents: (components) => set({ components }),

      updateComponentProps: (id, newProps) => {
        const { components, undoStack } = get();
        // Push current state to undo stack before changing
        set({
          undoStack: [...undoStack.slice(-29), components],
          redoStack: [],
          isDirty: true,
          components: components.map(c =>
            c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
          )
        });
      },

      undo: () => {
        const { undoStack, components, redoStack } = get();
        if (!undoStack.length) return;
        set({
          components: undoStack[undoStack.length - 1],
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack.slice(-29), components],
          isDirty: true,
        });
      },

      redo: () => {
        const { redoStack, components, undoStack } = get();
        if (!redoStack.length) return;
        set({
          components: redoStack[redoStack.length - 1],
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack.slice(-29), components],
          isDirty: true,
        });
      },
    }),
    { name: 'builder-store' }
  )
);
```

### `auth.store.ts` — Auth State

```typescript
interface AuthStore {
  user: User | null;           // Supabase user row
  firebaseUser: FirebaseUser | null;
  tenant: Tenant | null;
  plan: Plan | null;
  isLoaded: boolean;

  setAuth: (user: User, tenant: Tenant, plan: Plan) => void;
  clearAuth: () => void;
}
```

### `ui.store.ts` — UI State

```typescript
interface UIStore {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Active modal tracking
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}
```

---

## 22. Hooks Reference

```typescript
// hooks/useAuth.ts
// Returns current user, tenant, plan from auth store
// Redirects to /login if not authenticated
const { user, tenant, plan, isLoaded } = useAuth();

// hooks/usePermission.ts
// Check if current user can perform an action
const canPublish = usePermission('publish_website');
// Returns boolean — use to conditionally render or disable UI

// hooks/useTenant.ts
// Returns tenant data + refetch function
const { tenant, isLoading, refresh } = useTenant();

// hooks/useWebsites.ts
// Fetches all websites for current tenant
const { websites, isLoading, createWebsite, deleteWebsite } = useWebsites();

// hooks/useBuilder.ts
// Access and control builder store
const { components, selectedId, updateProps, addComponent, undo, redo } = useBuilder();

// hooks/useAI.ts
// Trigger AI generation with credit checking
const { generate, isGenerating, creditsUsed, creditsLimit } = useAI();

// hooks/useVersions.ts
// Fetch and restore page version history
const { versions, isLoading, restore, saveVersion } = useVersions(pageId);

// hooks/useAnalytics.ts
// Fetch analytics data for dashboard
const { metrics, chartData, isLoading } = useAnalytics({ period: '30d' });

// hooks/useAssets.ts
// Manage tenant media assets
const { assets, upload, remove, isUploading, storageUsedMb } = useAssets();

// hooks/useToast.ts
// Show toast notifications from anywhere
const toast = useToast();
toast.show({ title: 'Saved!', variant: 'success' });
toast.error('Something went wrong');
```

---

## 23. Route Protection & Guards

### Three Layers of Protection

```
Layer 1: middleware.ts (Edge — runs before ANY render)
  → Redirect /dashboard/* to /login if no auth cookie

Layer 2: (dashboard)/layout.tsx (Server Component)
  → Verify Firebase token server-side
  → Check user exists in Supabase
  → Check tenant status is 'active'
  → Redirect to /login if any check fails

Layer 3: Per-page permission checks (Client or Server Component)
  → Check specific role permissions for sensitive pages
  → Hide/disable UI elements based on role
```

### `(dashboard)/layout.tsx` — Auth Guard

```typescript
// app/(dashboard)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  // ── 1. Verify Firebase session cookie ──────────────────────────────
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('firebase-session')?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/dashboard');
  }

  // ── 2. Verify with Firebase Admin SDK ──────────────────────────────
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login?reason=session_expired');
  }

  // ── 3. Fetch user + tenant from Supabase ───────────────────────────
  const { data: user } = await supabase
    .from('users')
    .select('*, tenants(*, plans(*))')
    .eq('firebase_uid', decodedToken.uid)
    .single();

  if (!user) redirect('/login?reason=user_not_found');
  if (!user.is_active) redirect('/login?reason=deactivated');
  if (user.tenants.status === 'suspended') redirect('/suspended');
  if (user.tenants.status === 'offboarded') redirect('/login?reason=account_closed');

  // ── 4. If onboarding not complete, redirect there ──────────────────
  if (!user.tenants.onboarding_completed) {
    redirect('/onboarding');
  }

  return (
    <AuthProvider user={user} tenant={user.tenants}>
      <div className="flex h-screen">
        <DashboardSidebar user={user} tenant={user.tenants} />
        <div className="flex-1 overflow-auto">
          <DashboardTopbar user={user} tenant={user.tenants} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
```

### Builder Page Route Guard

```typescript
// app/(dashboard)/dashboard/websites/[websiteId]/builder/page.tsx

// Viewer role is blocked from the builder entirely
if (!hasPermission(user.role, 'edit_content')) {
  redirect('/dashboard/websites');
  // Or show a "You don't have builder access" error page
}
```

### Billing Page Route Guard

```typescript
// app/(dashboard)/dashboard/billing/page.tsx

// Only owner can see billing
if (user.role !== 'owner') {
  redirect('/dashboard');
}
```

---

## 24. Loading & Error States

### Loading Patterns

```typescript
// Every data-fetching page has three states:
// 1. Loading → Skeleton placeholders
// 2. Error → Error card with retry button
// 3. Empty → EmptyState component with action
// 4. Data → Actual content

// Pattern used on websites list page:
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <Skeleton variant="rect" height={160} />     {/* thumbnail */}
        <Skeleton variant="text" lines={2} />         {/* name + status */}
        <Skeleton variant="text" width="40%" />       {/* button */}
      </Card>
    ))}
  </div>
) : websites.length === 0 ? (
  <EmptyState
    icon={<Globe />}
    title="No websites yet"
    description="Create your first website and we'll help you build it with AI."
    action={{ label: 'Create Website', onClick: openCreateModal }}
  />
) : (
  <WebsiteGrid websites={websites} />
)}
```

### Error Boundaries

```typescript
// Every major section is wrapped in an error boundary
// app/(dashboard)/dashboard/error.tsx

'use client';

export default function DashboardError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Icon name="AlertTriangle" size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// Pages use React Suspense with skeleton fallbacks
<Suspense fallback={<WebsiteListSkeleton />}>
  <WebsiteList />
</Suspense>
```

### Network Error Handling in API Client

```typescript
// utils/api-client.ts
// Centralized fetch wrapper with automatic token injection + error handling

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = await getFirebaseToken(); // from auth store

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    // Handle plan limit errors with upgrade prompt
    if (response.status === 402) {
      throw new PlanLimitError(error.message, error.limit_type);
    }

    // Handle permission errors with clear message
    if (response.status === 403) {
      throw new PermissionError(error.message);
    }

    throw new ApiError(error.message || 'Request failed', response.status);
  }

  return response.json();
}
```

---

## 25. Responsive Breakpoints & Layout Rules

### Tailwind Breakpoints Used

```
sm:   640px  → Mobile landscape
md:   768px  → Tablet
lg:   1024px → Desktop (main target for dashboard)
xl:   1280px → Wide desktop
2xl:  1536px → Very wide screens
```

### Dashboard Layout Responsive Rules

```
< 768px (mobile):
  → Sidebar collapses to icon-only bottom navigation bar
  → Topbar shows hamburger menu
  → Cards stack to single column
  → Builder is NOT accessible on mobile (show a "use desktop" message)

768px–1024px (tablet):
  → Sidebar is icon-only (collapsed by default, expandable)
  → Grid columns: 2
  → Builder: accessible but right panel collapses to drawer

> 1024px (desktop):
  → Full sidebar visible
  → Grid columns: 3 (websites list)
  → Builder: full 3-panel layout
```

### Public Tenant Site Responsive Rules

```
All site blocks use Tailwind responsive classes.
Example from HeroBlock:

// Heading: large on desktop, smaller on mobile
className="text-4xl md:text-5xl lg:text-6xl font-bold"

// CTA buttons: stacked on mobile, side by side on desktop
className="flex flex-col sm:flex-row gap-3"

// Features grid: 1 col mobile, 2 col tablet, 3 col desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

---

## 26. Page-by-Page Summary Table

| Page | URL | Route File | Auth Required | Roles Allowed | Render Mode |
|---|---|---|---|---|---|
| Landing | `/` | `(marketing)/page.tsx` | ❌ | — | SSG |
| Login | `/login` | `(auth)/login/page.tsx` | ❌ | — | Client |
| Register | `/register` | `(auth)/register/page.tsx` | ❌ | — | Client |
| Forgot Password | `/forgot-password` | `(auth)/forgot-password/page.tsx` | ❌ | — | Client |
| Accept Invite | `/accept-invite` | `(auth)/accept-invite/page.tsx` | ❌ | — | Client |
| Onboarding | `/onboarding` | `(onboarding)/onboarding/page.tsx` | ✅ | all | Client |
| Dashboard Overview | `/dashboard` | `(dashboard)/dashboard/page.tsx` | ✅ | all | Server |
| Websites List | `/dashboard/websites` | `.../websites/page.tsx` | ✅ | all | Server |
| Website Detail | `/dashboard/websites/[id]` | `.../[websiteId]/page.tsx` | ✅ | all | Server |
| Builder | `/dashboard/websites/[id]/builder` | `.../builder/page.tsx` | ✅ | owner,admin,editor,dev | Client |
| Branding | `/dashboard/branding` | `.../branding/page.tsx` | ✅ | owner,admin,editor,dev | Client |
| Domains | `/dashboard/domains` | `.../domains/page.tsx` | ✅ | owner,admin,dev | Server |
| Team | `/dashboard/team` | `.../team/page.tsx` | ✅ | all (edit: owner/admin) | Server |
| Analytics | `/dashboard/analytics` | `.../analytics/page.tsx` | ✅ | all | Server |
| Billing | `/dashboard/billing` | `.../billing/page.tsx` | ✅ | owner only | Server |
| Settings | `/dashboard/settings` | `.../settings/page.tsx` | ✅ | all | Client |
| Public Site | `[sub].sitepilot.io/[slug]` | `sites/[sub]/[...slug]/page.tsx` | ❌ | — | SSR/ISR |

---

> **Frontend Version:** 1.0  
> **Framework:** Next.js 14 App Router  
> **Last Updated:** Project Kickoff  
>
> This document is the single source of truth for all frontend decisions.
> Any new page, component, or route must be added here before implementation.
