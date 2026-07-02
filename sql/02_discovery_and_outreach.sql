-- 02_discovery_and_outreach.sql
-- Phase 1 (free hybrid discovery) + Phase 2 (LinkedIn outreach) schema.
-- Safe to run after 01 (jobs-contacts-schema.sql). All additive + idempotent.
-- Run in Supabase → SQL Editor → New query.
-- NOTE: reuses the set_updated_at() trigger function defined in 01.

-- =============================================================================
-- 1) jobs: multi-source discovery
--    Lets one `jobs` table hold rows from Adzuna / Remotive / RemoteOK / Apify / dorks.
-- =============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source     text;  -- 'adzuna' | 'remotive' | 'remoteok' | 'apify_linkedin' | 'dork'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS apply_type text;  -- 'external' | 'easy_apply' | 'email' | 'unknown'

CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs (source);

-- =============================================================================
-- 2) hiring_posts: LinkedIn "we're hiring" posts surfaced via Serper Google dorks.
--    These are warm leads (a person posted a role) — they have a post URL + poster,
--    but usually no formal apply_url, so they live in their own table.
-- =============================================================================
CREATE TABLE IF NOT EXISTS hiring_posts (
  id                 text PRIMARY KEY,        -- stable hash of post_url
  post_url           text NOT NULL,
  title              text,                     -- SERP title
  snippet            text,                     -- SERP snippet
  poster_name        text,
  poster_profile_url text,
  company_name       text,
  query              text,                     -- which dork string surfaced it
  keywords           text[],                   -- matched role keywords
  relevancy_score    smallint CHECK (relevancy_score >= 0 AND relevancy_score <= 100),
  status             text DEFAULT 'new',       -- 'new' | 'drafted' | 'sent' | 'skipped'
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hiring_posts_status_created
  ON hiring_posts (status, created_at DESC);

DROP TRIGGER IF EXISTS hiring_posts_updated_at ON hiring_posts;
CREATE TRIGGER hiring_posts_updated_at
  BEFORE UPDATE ON hiring_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 3) linkedin_outreach: Phase 2 — human-in-the-loop LinkedIn drafts.
--    The agent DRAFTS a connection note + message; you send it manually from Telegram.
--    Kept SEPARATE from `contacts` so the existing cold-EMAIL machine (C/D/E/F) is untouched.
--    A target can be: the job poster (recruiter), a referral contact, or a hiring-post poster.
-- =============================================================================
CREATE TABLE IF NOT EXISTS linkedin_outreach (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             text REFERENCES jobs(id)          ON DELETE CASCADE,  -- null for hiring-post leads
  hiring_post_id     text REFERENCES hiring_posts(id)  ON DELETE CASCADE,  -- null for job leads
  contact_id         uuid REFERENCES contacts(id)      ON DELETE SET NULL, -- set only for referral contacts
  target_type        text NOT NULL,            -- 'recruiter' | 'referral' | 'hiring_post_poster'
  target_name        text,
  target_profile_url text NOT NULL,            -- the LinkedIn profile you'll open + message
  connect_note       text,                     -- <= 300 chars (free-account connection note limit)
  message            text,                     -- longer intro / post-accept message
  status             text DEFAULT 'drafted',   -- 'drafted' | 'sent' | 'skipped'
  drafted_at         timestamptz DEFAULT now() NOT NULL,
  sent_at            timestamptz,
  UNIQUE (target_profile_url, target_type)     -- one draft per person per role-type
);

CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_status ON linkedin_outreach (status, drafted_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_job     ON linkedin_outreach (job_id);
