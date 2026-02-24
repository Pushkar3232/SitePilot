export interface Plan {
  id: string;
  name: string;
  slug: "starter" | "growth" | "pro";
  price_monthly: number;
  price_yearly: number;
  max_websites: number;
  max_pages_per_site: number;
  max_storage_mb: number;
  max_ai_credits: number;
  custom_domain: boolean;
  features: string[];
}
