-- ==============================================================================
-- ROBUSTY CRM — FULL DATABASE PERSISTENCE FOR LEADS, BUDGETS, ORDERS & SCHEDULE
-- Target: PostgreSQL 16+ / Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUM ALIGNMENT WITH FRONTEND PIPELINES
-- ------------------------------------------------------------------------------
ALTER TYPE public.opportunity_stage ADD VALUE IF NOT EXISTS 'aguardando_cotacao';

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pedido_gerado';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'em_preparacao';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'aguardando_coleta_instalacao';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'em_entrega_instalacao';

ALTER TYPE public.lead_origin ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE public.lead_origin ADD VALUE IF NOT EXISTS 'site';

-- ------------------------------------------------------------------------------
-- 2. CONTACTS: SOCIAL LINKS & OPTIONAL PHONE FOR DRAFT LEADS
-- ------------------------------------------------------------------------------
ALTER TABLE public.contacts
  ALTER COLUMN phone_e164 DROP NOT NULL;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS website_url TEXT NULL;

-- ------------------------------------------------------------------------------
-- 3. OPPORTUNITIES (LEADS & BUDGETS): COMPLETE PERSISTENCE COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS order_number INTEGER NULL,
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS card_installments INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pickup_date VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS installation_date VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS installation_time VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS shipping_carrier_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS shipping_tracking_code VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS address JSONB NULL,
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tasks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill order_number on existing opportunities (preserving linked order numbers first)
UPDATE public.opportunities opp
SET order_number = ord.order_number
FROM public.orders ord
WHERE ord.opportunity_id = opp.id
  AND opp.order_number IS NULL;

WITH max_num AS (
  SELECT GREATEST(
    COALESCE((SELECT MAX(order_number) FROM public.opportunities), 0),
    COALESCE((SELECT MAX(order_number) FROM public.orders), 0)
  ) AS base_num
),
numbered AS (
  SELECT
    id,
    (SELECT base_num FROM max_num) + ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS next_num
  FROM public.opportunities
  WHERE order_number IS NULL
)
UPDATE public.opportunities opp
SET order_number = numbered.next_num
FROM numbered
WHERE opp.id = numbered.id;

-- ------------------------------------------------------------------------------
-- 4. ORDERS: COMPLETE MIRRORING & SCHEDULING COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS website_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS pickup_date VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS installation_date VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS installation_time VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tasks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Allow deleting an opportunity to cascade cleanly to its linked order
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_opportunity_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_opportunity_id_fkey
  FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 5. APPOINTMENTS: LINK TO OPPORTUNITY & EVENT TYPE
-- ------------------------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'instalacao';

CREATE INDEX IF NOT EXISTS idx_appointments_opportunity_id
  ON public.appointments(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_order_number
  ON public.opportunities(order_number);

-- ------------------------------------------------------------------------------
-- 6. ENSURE FULL CRUD RLS POLICIES ON CRM TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'contacts',
      'addresses',
      'opportunities',
      'opportunity_items',
      'orders',
      'appointments',
      'tasks'
    ])
  LOOP
    pol := 'Allow full CRUD on ' || tbl;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname = pol
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        pol,
        tbl
      );
    END IF;
  END LOOP;
END $$;
