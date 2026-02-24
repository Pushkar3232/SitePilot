export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan_id: string;
  onboarding_completed: boolean;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}
