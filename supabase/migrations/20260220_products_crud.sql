-- ==============================================================================
-- ROBUSTY CRM — PRODUCTS CRUD SUPPORT (WEIGHT, PAYMENT NOTES & WRITE RLS)
-- ==============================================================================

-- 1. Add optional weight_kg and payment_conditions_notes columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS payment_conditions_notes TEXT NULL;

-- 2. Allow full CRUD operations on products table (matching CRM RLS pattern)
DO $$ BEGIN
  CREATE POLICY "Allow insert/update/delete on products"
    ON public.products
    FOR ALL
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Backfill official weights for existing seeded SKUs when weight_kg is NULL
UPDATE public.products SET weight_kg = v.weight_kg
FROM (VALUES
  ('KOM-MX100-PLUS', 38.0),
  ('KOM-MX200-PLUS', 38.0),
  ('KOM-MX80-PLUS', 28.0),
  ('KOM-MX50-PLUS', 16.0),
  ('KOM-ESCADA', 9.0),
  ('KOM-VENTOSAS', 1.5),
  ('KOM-ESTEPE', 3.5),
  ('KOM-HASTE-UNID', 0.5),
  ('KOM-KIT-HASTES-8P', 4.0),
  ('KOM-KIT-FIX-ESC', 0.8),
  ('KOM-SUP-TOLDO', 2.0),
  ('KOM-SUP-TOLDO-LEROY', 2.0),
  ('KOM-BARRA-SOLAR', 3.5),
  ('KOM-DECK-MX100', 18.0),
  ('KOM-MEIO-DECK-MX100', 9.0),
  ('KOM-DECK-MX80', 12.0),
  ('KOM-DECK-MX50', 6.0),
  ('KOM-DECK-ESCADA', 2.5),
  ('KAN-KX100', 24.0),
  ('KAN-KX200', 24.0),
  ('KAN-KX200-NOVA', 26.0),
  ('FIO-FX100', 22.0),
  ('FIO-FX200', 22.0),
  ('DOB-DX100', 23.0),
  ('DOB-DX200', 23.0),
  ('K0-MX120', 34.0),
  ('K0-ABA-DUPLA', 35.0),
  ('K0-EXTREME', 42.0),
  ('K0-DECK-MX120', 16.0),
  ('K0-DECK-ESCADA', 2.5),
  ('K0-ESCADA', 10.0),
  ('K0-SUP-ROLETE', 6.0),
  ('DUC-MAX-2023', 45.0),
  ('SAV-CS', 22.0),
  ('SAV-CD', 20.0),
  ('SAV-ROLETE', 8.0),
  ('MAS-L3H2', 48.0),
  ('EXP-STANDARD', 24.0),
  ('DAI-FURGAO', 52.0),
  ('SPR-415-515', 55.0),
  ('HR-CABINE', 26.0),
  ('JBOX-L3H2', 46.0)
) AS v(sku, weight_kg)
WHERE public.products.sku = v.sku AND public.products.weight_kg IS NULL;
