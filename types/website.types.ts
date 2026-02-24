export type WebsiteStatus = "draft" | "published" | "archived";

export interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  logo_url?: string;
  favicon_url?: string;
}

export interface Website {
  id: string;
  tenant_id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  status: WebsiteStatus;
  branding_config: BrandingConfig;
  created_at: string;
  updated_at: string;
  published_at?: string;
}
