-- Job outreach storage for n8n workflow Eh6OMrt3jq0QZf1C
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- =============================================================================
-- Table: jobs (one row per LinkedIn job; only important fields)
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id                     text PRIMARY KEY,
  job_title              text,
  job_description        text,
  job_url                text,
  company_name           text,
  company_url            text,
  seniority_level        text,
  employment_type        text,
  time_posted            timestamptz,
  apply_url              text,
  job_poster_name        text,
  job_poster_profile_url text,
  relavancy_score        smallint CHECK (relavancy_score >= 0 AND relavancy_score <= 100), 
  created_at             timestamptz DEFAULT now() NOT NULL,
  updated_at             timestamptz DEFAULT now() NOT NULL
);

-- Optional: index for filtering by score and recent first
CREATE INDEX IF NOT EXISTS idx_jobs_relavancy_created_at
  ON jobs (relavancy_score, created_at DESC);

-- Trigger: keep updated_at in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- Table: contacts (one row per contact; linked to job via job_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name               text,
  linkedin           text,
  email              text[],
  email_sent_at      timestamptz,
  email_thread_id    text,
  followup1_sent_at  timestamptz,
  followup2_sent_at  timestamptz,
  last_updated       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (job_id, linkedin)  -- one row per (job, person); many contacts per job
);

-- List contacts per job
CREATE INDEX IF NOT EXISTS idx_contacts_job_id ON contacts (job_id);

-- Follow-up workflow: “emailed, no reply, 48h passed”
CREATE INDEX IF NOT EXISTS idx_contacts_email_followup
  ON contacts (email_sent_at, followup1_sent_at, followup2_sent_at);

-- Trigger: keep last_updated in sync
CREATE OR REPLACE FUNCTION set_contacts_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS contacts_last_updated ON contacts;
CREATE TRIGGER contacts_last_updated
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_contacts_last_updated();

-- =============================================================================
-- Useful queries (for n8n or manual use)
-- =============================================================================
-- Followup1: contacts we emailed, 48h ago, no followup1 yet
-- SELECT * FROM contacts
-- WHERE email_sent_at IS NOT NULL
--   AND followup1_sent_at IS NULL
--   AND email_sent_at < now() - interval '48 hours';

-- Followup2: contacts we sent followup1 to, 48h ago, no followup2 yet
-- SELECT * FROM contacts
-- WHERE followup1_sent_at IS NOT NULL
--   AND followup2_sent_at IS NULL
--   AND followup1_sent_at < now() - interval '48 hours';

-- =============================================================================
-- Migration: if contacts already had id as text, convert to uuid
-- =============================================================================
-- ALTER TABLE contacts ADD COLUMN id_new uuid DEFAULT gen_random_uuid();
-- UPDATE contacts SET id_new = gen_random_uuid();
-- ALTER TABLE contacts DROP CONSTRAINT contacts_pkey;
-- ALTER TABLE contacts RENAME COLUMN id TO id_old;
-- ALTER TABLE contacts RENAME COLUMN id_new TO id;
-- ALTER TABLE contacts ADD PRIMARY KEY (id);
-- ALTER TABLE contacts DROP COLUMN id_old;
-- ALTER TABLE contacts ADD CONSTRAINT contacts_job_id_linkedin_key UNIQUE (job_id, linkedin);
