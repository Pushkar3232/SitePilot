export type ComponentType =
  | "navbar"
  | "hero"
  | "features"
  | "gallery"
  | "testimonials"
  | "pricing"
  | "cta"
  | "contact_form"
  | "team"
  | "faq"
  | "stats"
  | "rich_text"
  | "image_text"
  | "video_embed"
  | "footer";

export interface SiteComponent {
  id: string;
  page_id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  sort_order: string; // fractional index
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
