-- Supabase Database Functions
-- Run these queries in your Supabase SQL editor to set up helper functions

-- Function to get user's tenant with plan details
CREATE OR REPLACE FUNCTION get_user_tenant_with_plan(user_firebase_id TEXT)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  plan_id UUID,
  plan_name TEXT,
  plan_slug TEXT,
  max_websites INTEGER,
  max_pages_per_site INTEGER,
  storage_limit_mb INTEGER,
  ai_credits_per_month INTEGER,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    p.id as plan_id,
    p.name as plan_name,
    p.slug as plan_slug,
    p.max_websites,
    p.max_pages_per_site,
    p.storage_limit_mb,
    p.ai_credits_per_month,
    u.role as user_role
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  JOIN plans p ON p.id = t.plan_id
  WHERE u.firebase_id = user_firebase_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has reached website limit
CREATE OR REPLACE FUNCTION check_website_limit(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current website count
  SELECT COUNT(*) INTO current_count
  FROM websites 
  WHERE tenant_id = tenant_uuid AND deleted_at IS NULL;
  
  -- Get plan limit
  SELECT p.max_websites INTO max_allowed
  FROM tenants t
  JOIN plans p ON p.id = t.plan_id
  WHERE t.id = tenant_uuid;
  
  -- Return true if under limit
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to check if website has reached page limit
CREATE OR REPLACE FUNCTION check_page_limit(website_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  tenant_uuid UUID;
BEGIN
  -- Get tenant for this website
  SELECT tenant_id INTO tenant_uuid
  FROM websites 
  WHERE id = website_uuid;
  
  -- Get current page count for this website
  SELECT COUNT(*) INTO current_count
  FROM pages 
  WHERE website_id = website_uuid AND deleted_at IS NULL;
  
  -- Get plan limit
  SELECT p.max_pages_per_site INTO max_allowed
  FROM tenants t
  JOIN plans p ON p.id = t.plan_id
  WHERE t.id = tenant_uuid;
  
  -- Return true if under limit
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant storage usage
CREATE OR REPLACE FUNCTION get_tenant_storage_usage(tenant_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  SELECT COALESCE(SUM(size_bytes), 0) INTO total_bytes
  FROM assets
  WHERE tenant_id = tenant_uuid AND deleted_at IS NULL;
  
  RETURN total_bytes;
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has storage space
CREATE OR REPLACE FUNCTION check_storage_limit(tenant_uuid UUID, additional_bytes BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  current_bytes BIGINT;
  max_bytes BIGINT;
BEGIN
  -- Get current usage
  SELECT get_tenant_storage_usage(tenant_uuid) INTO current_bytes;
  
  -- Get plan limit (convert MB to bytes)
  SELECT p.storage_limit_mb * 1024 * 1024 INTO max_bytes
  FROM tenants t
  JOIN plans p ON p.id = t.plan_id
  WHERE t.id = tenant_uuid;
  
  -- Return true if under limit
  RETURN (current_bytes + additional_bytes) <= max_bytes;
END;
$$ LANGUAGE plpgsql;

-- Function to get AI credits used this month
CREATE OR REPLACE FUNCTION get_monthly_ai_usage(tenant_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  credits_used INTEGER;
BEGIN
  SELECT COALESCE(SUM(credits_used), 0) INTO credits_used
  FROM ai_usage_logs
  WHERE tenant_id = tenant_uuid 
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month';
  
  RETURN credits_used;
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has AI credits available
CREATE OR REPLACE FUNCTION check_ai_credits(tenant_uuid UUID, credits_needed INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  credits_used INTEGER;
  max_credits INTEGER;
BEGIN
  -- Get current month usage
  SELECT get_monthly_ai_usage(tenant_uuid) INTO credits_used;
  
  -- Get plan limit
  SELECT p.ai_credits_per_month INTO max_credits
  FROM tenants t
  JOIN plans p ON p.id = t.plan_id
  WHERE t.id = tenant_uuid;
  
  -- Return true if sufficient credits
  RETURN (credits_used + credits_needed) <= max_credits;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT, table_name TEXT, column_name TEXT DEFAULT 'slug')
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 1;
  exists_check BOOLEAN;
BEGIN
  new_slug := base_slug;
  
  -- Check if base slug exists
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
  USING new_slug INTO exists_check;
  
  -- If it exists, try numbered variations
  WHILE exists_check LOOP
    new_slug := base_slug || '-' || counter::TEXT;
    
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
    USING new_slug INTO exists_check;
    
    counter := counter + 1;
    
    -- Safety check to prevent infinite loop
    IF counter > 1000 THEN
      new_slug := base_slug || '-' || extract(epoch from now())::bigint::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete with cascade
CREATE OR REPLACE FUNCTION soft_delete_website(website_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Soft delete the website
  UPDATE websites 
  SET deleted_at = NOW() 
  WHERE id = website_uuid AND deleted_at IS NULL;
  
  -- Soft delete all pages
  UPDATE pages 
  SET deleted_at = NOW() 
  WHERE website_id = website_uuid AND deleted_at IS NULL;
  
  -- Soft delete all components
  UPDATE components 
  SET deleted_at = NOW() 
  WHERE page_id IN (
    SELECT id FROM pages WHERE website_id = website_uuid
  ) AND deleted_at IS NULL;
  
  -- Mark deployments as inactive
  UPDATE deployments 
  SET is_active = FALSE 
  WHERE website_id = website_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();