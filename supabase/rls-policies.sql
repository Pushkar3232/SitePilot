-- Supabase RLS (Row Level Security) Policies
-- Run these queries in your Supabase SQL editor to set up security policies

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Users can view their own tenant" ON tenants FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can update their own tenant" ON tenants FOR UPDATE USING (
  id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub' AND role IN ('owner', 'admin')
  )
);

-- Users policies
CREATE POLICY "Users can view team members" ON users FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (
  firebase_id = auth.jwt() ->> 'sub'
);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (
  firebase_id = auth.jwt() ->> 'sub'
);

-- Websites policies
CREATE POLICY "Users can view tenant websites" ON websites FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage tenant websites" ON websites FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub' 
    AND role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Public website access (no auth required for published sites)
CREATE POLICY "Public can view published websites" ON websites FOR SELECT USING (
  is_published = true
);

-- Pages policies
CREATE POLICY "Users can view tenant pages" ON pages FOR SELECT USING (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage tenant pages" ON pages FOR ALL USING (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
    AND u.role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Public page access
CREATE POLICY "Public can view published pages" ON pages FOR SELECT USING (
  website_id IN (
    SELECT id FROM websites WHERE is_published = true
  )
);

-- Components policies
CREATE POLICY "Users can view tenant components" ON components FOR SELECT USING (
  page_id IN (
    SELECT p.id FROM pages p
    JOIN websites w ON w.id = p.website_id
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage tenant components" ON components FOR ALL USING (
  page_id IN (
    SELECT p.id FROM pages p
    JOIN websites w ON w.id = p.website_id
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
    AND u.role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Public component access
CREATE POLICY "Public can view published components" ON components FOR SELECT USING (
  page_id IN (
    SELECT p.id FROM pages p
    JOIN websites w ON w.id = p.website_id
    WHERE w.is_published = true
  )
);

-- Assets policies
CREATE POLICY "Users can view tenant assets" ON assets FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage tenant assets" ON assets FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Deployments policies
CREATE POLICY "Users can view tenant deployments" ON deployments FOR SELECT USING (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can create deployments" ON deployments FOR INSERT WITH CHECK (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
    AND u.role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Page versions policies
CREATE POLICY "Users can view tenant page versions" ON page_versions FOR SELECT USING (
  page_id IN (
    SELECT p.id FROM pages p
    JOIN websites w ON w.id = p.website_id
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can create page versions" ON page_versions FOR INSERT WITH CHECK (
  page_id IN (
    SELECT p.id FROM pages p
    JOIN websites w ON w.id = p.website_id
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
    AND u.role IN ('owner', 'admin', 'editor', 'developer')
  )
);

-- Subscriptions policies
CREATE POLICY "Users can view tenant subscription" ON subscriptions FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Owners can manage subscription" ON subscriptions FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
    AND role = 'owner'
  )
);

-- Team invitations policies
CREATE POLICY "Users can view tenant invitations" ON team_invitations FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can manage invitations" ON team_invitations FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'admin')
  )
);

-- AI usage logs policies
CREATE POLICY "Users can view tenant AI usage" ON ai_usage_logs FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
  )
);

-- Domain verifications policies
CREATE POLICY "Users can view tenant domains" ON domain_verifications FOR SELECT USING (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage tenant domains" ON domain_verifications FOR ALL USING (
  website_id IN (
    SELECT w.id FROM websites w
    JOIN users u ON u.tenant_id = w.tenant_id
    WHERE u.firebase_id = auth.jwt() ->> 'sub'
    AND u.role IN ('owner', 'admin')
  )
);

-- Audit logs policies
CREATE POLICY "Users can view tenant audit logs" ON audit_logs FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE firebase_id = auth.jwt() ->> 'sub'
    AND role IN ('owner', 'admin')
  )
);

-- Enable realtime for selected tables
ALTER PUBLICATION supabase_realtime ADD TABLE websites;
ALTER PUBLICATION supabase_realtime ADD TABLE pages;
ALTER PUBLICATION supabase_realtime ADD TABLE components;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE deployments;