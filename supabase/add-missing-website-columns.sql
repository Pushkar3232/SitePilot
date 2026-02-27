-- Migration: Add missing columns to the websites table
-- Run this in your Supabase SQL Editor

-- Add branding_config JSONB column (stores primary/secondary/accent colors + fonts)
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS branding_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add seo_defaults JSONB column (default SEO title template, description, og_image)
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS seo_defaults JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add template_id TEXT column (which starter template was used, NULL = built from scratch)
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS template_id TEXT;

-- Add analytics_enabled BOOLEAN column
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add ai_generated BOOLEAN column
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- Add favicon_url TEXT column
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add published_at TIMESTAMPTZ column
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Refresh the PostgREST schema cache so the API sees the new columns immediately
NOTIFY pgrst, 'reload schema';
