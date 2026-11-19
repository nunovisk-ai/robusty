-- ==============================================================================
-- ROBUSTY CRM — ADD MUNICIPAL REGISTRATION & COMMERCIAL PHONE
-- Target: PostgreSQL 16+ / Supabase SQL Editor
-- ==============================================================================

-- 1. CONTACTS
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS municipal_registration TEXT NULL,
  ADD COLUMN IF NOT EXISTS commercial_phone TEXT NULL;

-- 2. OPPORTUNITIES
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS municipal_registration TEXT NULL,
  ADD COLUMN IF NOT EXISTS commercial_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_subtype TEXT NULL;

-- 3. ORDERS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS municipal_registration TEXT NULL,
  ADD COLUMN IF NOT EXISTS commercial_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_subtype TEXT NULL;
