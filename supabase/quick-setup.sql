-- SitePilot Database Schema - Run in Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor

-- =============================================================================
-- STEP 1: CREATE TABLES
-- =============================================================================

-- Plans Table (Required first as referenced by others)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_websites INTEGER NOT NULL,
  max_pages_per_site INTEGER NOT NULL,
  storage_limit_mb INTEGER NOT NULL,
  ai_credits_per_month INTEGER NOT NULL,
  custom_domain_allowed BOOLEAN DEFAULT false,
  version_history_limit INTEGER DEFAULT 10,
  collaboration_enabled BOOLEAN DEFAULT false,
  max_collaborators INTEGER DEFAULT 1,
  analytics_enabled BOOLEAN DEFAULT true,
  priority_support BOOLEAN DEFAULT false,
  price_monthly_cents INTEGER DEFAULT 0,
  price_yearly_cents INTEGER DEFAULT 0,
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  display_order INTEGER DEFAULT 0,
  badge_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  usage_limits JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'developer', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invitation_accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Websites Table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'suspended')),
  favicon_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  seo_settings JSONB DEFAULT '{}',
  analytics_settings JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages Table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_homepage BOOLEAN DEFAULT false,
  template_id TEXT,
  custom_css TEXT,
  custom_js TEXT,
  order_key TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, slug)
);

-- Components Table
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  styles JSONB DEFAULT '{}',
  order_key TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  cloudinary_public_id TEXT UNIQUE NOT NULL,
  cloudinary_url TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'raw')),
  format TEXT,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  upload_source TEXT DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: INSERT DEFAULT DATA
-- =============================================================================

-- Insert Default Plans
INSERT INTO plans (id, name, slug, description, is_active, max_websites, max_pages_per_site, storage_limit_mb, ai_credits_per_month, custom_domain_allowed, version_history_limit, collaboration_enabled, max_collaborators, analytics_enabled, priority_support, price_monthly_cents, price_yearly_cents, display_order, badge_text) VALUES
('plan_starter', 'Starter', 'starter', 'Perfect for individuals getting started', true, 2, 10, 100, 10, false, 3, false, 1, true, false, 0, 0, 1, 'Free'),
('plan_growth', 'Growth', 'growth', 'For growing businesses and teams', true, 10, 50, 1000, 100, true, 30, true, 5, true, true, 1999, 19999, 2, 'Popular'),
('plan_pro', 'Pro', 'pro', 'For professional developers and agencies', true, 50, 200, 5000, 500, true, 100, true, 25, true, true, 4999, 49999, 3, 'Best Value')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
SELECT 'Database schema created successfully! You can now test your API routes.' AS status;