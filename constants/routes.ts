export const ROUTES = {
  // Marketing
  HOME: "/",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  ACCEPT_INVITE: "/accept-invite",

  // Onboarding
  ONBOARDING: "/onboarding",

  // Dashboard
  DASHBOARD: "/dashboard",
  WEBSITES: "/dashboard/websites",
  WEBSITE_DETAIL: (id: string) => `/dashboard/websites/${id}`,
  BUILDER: (id: string) => `/dashboard/websites/${id}/builder`,
  BRANDING: "/dashboard/branding",
  DOMAINS: "/dashboard/domains",
  TEAM: "/dashboard/team",
  ANALYTICS: "/dashboard/analytics",
  BILLING: "/dashboard/billing",
  SETTINGS: "/dashboard/settings",
} as const;
