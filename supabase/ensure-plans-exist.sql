-- Ensure Default Plans Exist
-- Run this in your Supabase SQL Editor to fix onboarding issues

-- Insert or update default plans
INSERT INTO plans (
  id, 
  name, 
  slug, 
  description, 
  is_active, 
  max_websites, 
  max_pages_per_site, 
  storage_limit_mb, 
  ai_credits_per_month, 
  custom_domain_allowed, 
  version_history_limit, 
  collaboration_enabled, 
  max_collaborators, 
  analytics_enabled, 
  priority_support, 
  price_monthly_cents, 
  price_yearly_cents, 
  display_order, 
  badge_text
) VALUES
(
  'plan_starter', 
  'Starter', 
  'starter', 
  'Perfect for individuals getting started', 
  true, 
  2, 
  10, 
  100, 
  10, 
  false, 
  3, 
  false, 
  1, 
  true, 
  false, 
  0, 
  0, 
  1, 
  'Free'
),
(
  'plan_growth', 
  'Growth', 
  'growth', 
  'For growing businesses and teams', 
  true, 
  10, 
  50, 
  1000, 
  100, 
  true, 
  30, 
  true, 
  5, 
  true, 
  true, 
  1999, 
  19999, 
  2, 
  'Popular'
),
(
  'plan_pro', 
  'Pro', 
  'pro', 
  'For professional developers and agencies', 
  true, 
  50, 
  200, 
  5000, 
  500, 
  true, 
  100, 
  true, 
  25, 
  true, 
  true, 
  4999, 
  49999, 
  3, 
  'Best Value'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  max_websites = EXCLUDED.max_websites,
  max_pages_per_site = EXCLUDED.max_pages_per_site,
  storage_limit_mb = EXCLUDED.storage_limit_mb,
  ai_credits_per_month = EXCLUDED.ai_credits_per_month,
  updated_at = NOW();

-- Verify plans were created
SELECT id, name, slug, max_websites FROM plans ORDER BY display_order;

SELECT 'Default plans created/updated successfully!' AS status;