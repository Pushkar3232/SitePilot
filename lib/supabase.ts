// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Server-side client with service role key (bypasses RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for database tables
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  max_websites: number;
  max_pages_per_site: number;
  storage_limit_mb: number;
  ai_credits_per_month: number;
  custom_domain_allowed: boolean;
  version_history_limit: number;
  collaboration_enabled: boolean;
  max_collaborators: number;
  analytics_enabled: boolean;
  priority_support: boolean;
  price_monthly_cents: number;
  price_yearly_cents: number;
  stripe_monthly_price_id: string | null;
  stripe_yearly_price_id: string | null;
  display_order: number;
  badge_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'offboarded' | 'pending';
  stripe_customer_id: string | null;
  logo_url: string | null;
  timezone: string;
  locale: string;
  onboarding_completed: boolean;
  offboard_scheduled_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  plans?: Plan;
}

export interface User {
  id: string;
  firebase_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tenant_id: string;
  role: 'owner' | 'admin' | 'editor' | 'developer' | 'viewer';
  invited_by: string | null;
  invitation_accepted_at: string | null;
  is_active: boolean;
  preferences: Record<string, unknown>;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  tenants?: Tenant;
}

export interface Website {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  subdomain: string;
  custom_domain: string | null;
  domain_verified: boolean;
  status: 'draft' | 'published' | 'archived' | 'suspended';
  branding_config: Record<string, unknown>;
  seo_defaults: Record<string, unknown>;
  analytics_enabled: boolean;
  template_id: string | null;
  ai_generated: boolean;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  last_deployed_at: string | null;
}

export interface Page {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'hidden';
  is_home: boolean;
  show_in_nav: boolean;
  nav_order: number;
  nav_label: string | null;
  seo_meta: Record<string, unknown>;
  page_config: Record<string, unknown>;
  password_protected: boolean;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  page_id: string;
  type: string;
  order_key: string;
  is_visible: boolean;
  is_locked: boolean;
  props: Record<string, unknown>;
  ai_generated: boolean;
  required_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  website_id: string;
  deployed_by: string | null;
  snapshot_json: Record<string, unknown>;
  is_live: boolean;
  deployed_at: string;
  notes: string | null;
}

export interface PageVersion {
  id: string;
  page_id: string;
  saved_by: string | null;
  content_snapshot: Record<string, unknown>[];
  label: string | null;
  trigger: 'auto' | 'manual' | 'pre_ai' | 'pre_restore' | 'pre_publish';
  saved_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  original_filename: string;
  display_name: string | null;
  cloudinary_public_id: string;
  cloudinary_url: string;
  secure_url: string;
  asset_type: 'image' | 'video' | 'raw' | 'audio';
  format: string | null;
  size_bytes: number;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  upload_source: 'manual' | 'ai_generated' | 'import';
  tags: string[];
  used_in_websites: string[];
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string;
  stripe_price_id: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid' | 'incomplete' | 'paused';
  billing_cycle: 'monthly' | 'yearly' | 'none';
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action_type: string;
  website_id: string | null;
  page_id: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  status: 'success' | 'failed' | 'rate_limited';
  error_message: string | null;
  created_at: string;
}

export interface DomainVerification {
  id: string;
  website_id: string;
  domain: string;
  cname_target: string;
  verified: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  performed_by: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
