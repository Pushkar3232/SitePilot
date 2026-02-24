import type { UserRole } from "@/types/user.types";

export const PERMISSIONS = {
  // Website management
  "websites.create": ["owner", "admin"],
  "websites.edit": ["owner", "admin", "editor", "developer"],
  "websites.delete": ["owner", "admin"],
  "websites.publish": ["owner", "admin", "editor"],
  "websites.view": ["owner", "admin", "editor", "developer", "viewer"],

  // Pages
  "pages.create": ["owner", "admin", "editor", "developer"],
  "pages.edit": ["owner", "admin", "editor", "developer"],
  "pages.delete": ["owner", "admin", "editor"],

  // Builder
  "builder.access": ["owner", "admin", "editor", "developer"],
  "builder.edit_html": ["owner", "admin", "developer"],

  // Branding
  "branding.edit": ["owner", "admin", "editor"],

  // Domain
  "domains.manage": ["owner", "admin"],

  // Team
  "team.invite": ["owner", "admin"],
  "team.remove": ["owner", "admin"],
  "team.change_role": ["owner", "admin"],
  "team.view": ["owner", "admin", "editor", "developer", "viewer"],

  // Analytics
  "analytics.view": ["owner", "admin", "editor", "viewer"],

  // Billing
  "billing.manage": ["owner"],
  "billing.view": ["owner", "admin"],

  // Settings
  "settings.edit": ["owner", "admin"],
  "settings.view": ["owner", "admin", "editor", "developer", "viewer"],
} as const satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;
