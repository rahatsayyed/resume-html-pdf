-- Teardown: drop all objects created by supabase-schema-job-outreach.sql
-- Run this in Supabase SQL Editor BEFORE re-running the main schema to start fresh

-- =============================================================================
-- 1. Drop triggers (depend on tables)
-- =============================================================================
DROP TRIGGER IF EXISTS contacts_last_updated ON contacts;
DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;

-- =============================================================================
-- 2. Drop tables (contacts first: has FK to jobs)
-- =============================================================================
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS jobs;

-- =============================================================================
-- 3. Drop trigger functions
-- =============================================================================
DROP FUNCTION IF EXISTS set_contacts_last_updated();
DROP FUNCTION IF EXISTS set_updated_at();

-- Done. You can now run supabase-schema-job-outreach.sql again.
