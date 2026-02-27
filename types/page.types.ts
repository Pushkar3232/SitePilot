export interface Page {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  is_home: boolean;
  seo_title?: string;
  seo_description?: string;
  sort_order: string; // fractional index
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
