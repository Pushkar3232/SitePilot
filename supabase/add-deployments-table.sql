-- Migration: Add deployments table for website publishing
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- DEPLOYMENTS TABLE
-- An immutable snapshot of the entire website at the moment of publishing.
-- The live public site reads from the latest is_live = true deployment.
-- =============================================================================

CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent Website
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  
  -- Publisher
  deployed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Snapshot - The complete frozen state of the website at publish time
  -- Structure:
  -- {
  --   "websiteId": "uuid",
  --   "publishedAt": "ISO timestamp",
  --   "branding": { ...branding_config },
  --   "seoDefaults": { ...seo_defaults },
  --   "pages": [
  --     {
  --       "id": "uuid",
  --       "title": "Home",
  --       "slug": "/",
  --       "seo_meta": { ... },
  --       "components": [
  --         { "type": "hero", "props": { ... }, "is_visible": true },
  --         ...
  --       ]
  --     }
  --   ]
  -- }
  snapshot_json JSONB NOT NULL,
  
  -- Live Flag - Only ONE deployment per website can be is_live = TRUE
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional Notes
  notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deployments_website_id ON deployments(website_id);
CREATE INDEX IF NOT EXISTS idx_deployments_is_live ON deployments(is_live) WHERE is_live = TRUE;

-- =============================================================================
-- AUDIT_LOGS TABLE (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- =============================================================================
-- Add last_deployed_at column to websites if not exists
-- =============================================================================

ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ;

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Deployments table and audit_logs table created successfully!' AS status;
