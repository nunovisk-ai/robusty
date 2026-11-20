-- ==============================================================================
-- ROBUSTY CRM — ADD LOST REASON & CLOSURE FIELDS TO OPPORTUNITIES
-- Target: PostgreSQL 16+ / Supabase SQL Editor
-- ==============================================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS lost_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS lost_reason_details TEXT NULL,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL;

-- Index for fast query of closed/lost opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_closed_at 
  ON public.opportunities(closed_at) 
  WHERE closed_at IS NOT NULL;
