-- ==============================================================================
-- ROBUSTY CRM — DATABASE INITIAL SCHEMA & SEED DATA (FEV/2026)
-- Target: PostgreSQL 16+ / Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'comercial_norlando', 'gestao_igor', 'loja_instalacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_category AS ENUM (
    'bagageiro', 
    'escada', 
    'deck', 
    'suporte', 
    'acessorio_fixacao', 
    'servico_instalacao', 
    'servico_especial'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lead_origin AS ENUM (
    'whatsapp_inbound',
    'instagram_direct',
    'meta_lead_ads',
    'loja_presencial',
    'site_form',
    'indicacao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_stage AS ENUM (
    'novo_lead',
    'em_qualificacao',
    'aguardando_atendimento',
    'aguardando_cotacao_frete',
    'preparacao_orcamento',
    'orcamento_enviado',
    'em_negociacao',
    'aguardando_pagamento',
    'venda_ganha',
    'venda_perdida'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_type AS ENUM ('transportadora_envio', 'instalacao_loja');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'pix',
    'cartao_link_igor',
    'cartao_presencial',
    'boleto',
    'pagamento_na_instalacao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pedido_recebido',
    'em_preparacao_loja',
    'aguardando_coleta_transportadora',
    'aguardando_instalacao_agendada',
    'em_transporte_ou_instalacao',
    'aguardando_emissao_nf',
    'pedido_concluido',
    'pedido_cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'nao_solicitada',
    'solicitada_ao_igor',
    'emitida_disponivel'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'agendado',
    'veiculo_na_loja',
    'em_instalacao',
    'concluido',
    'reagendado',
    'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- App Users / Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'comercial_norlando',
  phone VARCHAR(30) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicles Catalog
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year_range VARCHAR(50) NULL,
  standard_installation_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products & Accessories Catalog
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NULL,
  name VARCHAR(200) NOT NULL,
  category product_category NOT NULL,
  compatible_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  model_version VARCHAR(100) NULL,
  dimensions VARCHAR(100) NULL,
  base_price_10x NUMERIC(10, 2) NOT NULL,
  cash_price_5pct NUMERIC(10, 2) NOT NULL,
  max_discount_price_10pct NUMERIC(10, 2) NOT NULL,
  installation_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT NULL,
  image_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts (Customers)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(150) NOT NULL,
  phone_e164 VARCHAR(30) UNIQUE NOT NULL,
  whatsapp_id VARCHAR(60) UNIQUE NULL,
  instagram_handle VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  document VARCHAR(30) NULL,
  origin lead_origin NOT NULL DEFAULT 'whatsapp_inbound',
  notes TEXT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addresses (Mandatory for Transportadora)
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  cep VARCHAR(9) NOT NULL,
  street VARCHAR(200) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100) NULL,
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities (CRM Sales Funnel)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_model_year VARCHAR(50) NULL,
  stage opportunity_stage NOT NULL DEFAULT 'novo_lead',
  fulfillment_type fulfillment_type NULL,
  subtotal_products NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  freight_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  installation_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  final_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method payment_method NULL,
  payment_link_url TEXT NULL,
  lost_reason TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunity Budget Items
CREATE TABLE IF NOT EXISTS public.opportunity_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders (Operational Pipeline)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL UNIQUE,
  opportunity_id UUID UNIQUE NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  fulfillment_type fulfillment_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pedido_recebido',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  invoice_required BOOLEAN NOT NULL DEFAULT false,
  invoice_status invoice_status NOT NULL DEFAULT 'nao_solicitada',
  invoice_key VARCHAR(50) NULL,
  invoice_file_url TEXT NULL,
  shipping_carrier_name VARCHAR(100) NULL,
  shipping_tracking_code VARCHAR(100) NULL,
  internal_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store Installation Appointments (Agenda)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  installer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_description VARCHAR(150) NOT NULL,
  products_summary TEXT NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operational Tasks (Between Norlando, Igor, and Loja)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public read access for Catalog (Vehicles and Products)
CREATE POLICY "Allow public read on vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);

-- Authenticated / Publishable Key Access for CRM operations
CREATE POLICY "Allow read on contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on contacts" ON public.contacts FOR ALL USING (true);

CREATE POLICY "Allow read on opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on opportunities" ON public.opportunities FOR ALL USING (true);

CREATE POLICY "Allow read on opportunity_items" ON public.opportunity_items FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on opportunity_items" ON public.opportunity_items FOR ALL USING (true);

CREATE POLICY "Allow read on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Allow read on appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on appointments" ON public.appointments FOR ALL USING (true);

CREATE POLICY "Allow read on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on tasks" ON public.tasks FOR ALL USING (true);

CREATE POLICY "Allow read on addresses" ON public.addresses FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on addresses" ON public.addresses FOR ALL USING (true);

CREATE POLICY "Allow read on profiles" ON public.profiles FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 4. OFFICIAL SEED DATA (FEVEREIRO/2026)
-- ------------------------------------------------------------------------------

-- Default Staff Profiles
INSERT INTO public.profiles (email, full_name, role, phone)
VALUES 
  ('norlando@robusty.com.br', 'Norlando (Comercial / Vendas)', 'comercial_norlando', '+5511999990001'),
  ('igor@robusty.com.br', 'Igor (Gestão / Cotações / Logística)', 'gestao_igor', '+5511999990002'),
  ('loja@robusty.com.br', 'Equipe da Loja (Instalação / Produção)', 'loja_instalacao', '+5511999990003'),
  ('admin@robusty.com.br', 'Administrador Robusty', 'admin', '+5511999990000')
ON CONFLICT (email) DO NOTHING;

-- Vehicles
INSERT INTO public.vehicles (id, slug, make, model, year_range, standard_installation_cost, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'kombi', 'Volkswagen', 'Kombi', 'Todos os anos', 0.00, 'Linha clássica com opções de deck completo, meio deck e escada removível.'),
  ('22222222-2222-2222-2222-222222222222', 'kangoo', 'Renault', 'Kangoo (Geração Clássica)', 'Até 2024', 0.00, 'Modelos KX 100 e KX 200.'),
  ('33333333-3333-3333-3333-333333333333', 'nova-kangoo', 'Renault', 'Nova Renault Kangoo', '2024-2026', 0.00, 'Vãos entre grades 23-24cm. Aumenta aprox. 20cm a altura. NÃO COMPATÍVEL COM GUIA DE ROLETE.'),
  ('44444444-4444-4444-4444-444444444444', 'fiorino', 'Fiat', 'Fiat Fiorino', 'Todos os anos', 200.00, 'Modelos FX 100 e FX 200. Custo de instalação padrão R$ 200,00. Compatível com guia de rolete.'),
  ('55555555-5555-5555-5555-555555555555', 'doblo', 'Fiat', 'Fiat Doblo Cargo', 'Todos os anos', 200.00, 'Modelos DX 100 e DX 200. Custo de instalação padrão R$ 200,00.'),
  ('66666666-6666-6666-6666-666666666666', 'jumpy-expert-scudo', 'PSA Linha K0', 'Jumpy / Expert / Scudo', '2017-2026', 0.00, 'Modelos MX 120, Aba Dupla e Extreme (3,30m). Opções de deck e escada dedicada.'),
  ('77777777-7777-7777-7777-777777777777', 'ducato', 'Fiat', 'Ducato Max Cargo', '2023-2026', 0.00, 'Modelo Aba Lateral 3,65m x 1,70m x 0,10m.'),
  ('88888888-8888-8888-8888-888888888888', 'saveiro', 'Volkswagen', 'Saveiro (CS e CD)', 'Todos os anos', 0.00, 'Modelos Cabine Simples e Cabine Dupla. Acessório guia de rolete especial.')
ON CONFLICT (slug) DO UPDATE SET 
  make = EXCLUDED.make,
  model = EXCLUDED.model,
  standard_installation_cost = EXCLUDED.standard_installation_cost,
  notes = EXCLUDED.notes;

-- Products & Accessories (Official February 2026 Catalog)
INSERT INTO public.products 
  (sku, name, category, compatible_vehicle_id, model_version, dimensions, base_price_10x, cash_price_5pct, max_discount_price_10pct, installation_cost, description)
VALUES
  -- KOMBI
  ('KOM-MX100-PLUS', 'Bagageiro Kombi MX 100 Plus (Aba Dupla)', 'bagageiro', '11111111-1111-1111-1111-111111111111', 'MX 100 Plus Aba Dupla', '3,30m X 1,28m x 0,38m', 2600.00, 2470.00, 2340.00, 0.00, 'Bagageiro integral para Kombi com aba dupla.'),
  ('KOM-MX200-PLUS', 'Bagageiro Kombi MX 200 Plus (Aba Lateral)', 'bagageiro', '11111111-1111-1111-1111-111111111111', 'MX 200 Plus Aba Lateral', '3,30m X 1,28m x 0,38m', 2600.00, 2470.00, 2340.00, 0.00, 'Bagageiro integral para Kombi com aba lateral.'),
  ('KOM-MX80-PLUS', 'Bagageiro Kombi MX 80 Plus', 'bagageiro', '11111111-1111-1111-1111-111111111111', 'MX 80 Plus', '2,20m X 1,28m x 0,38m', 2300.00, 2185.00, 2070.00, 0.00, 'Bagageiro intermediário para Kombi.'),
  ('KOM-MX50-PLUS', 'Bagageiro Kombi MX 50 Plus (S/ Madeira)', 'bagageiro', '11111111-1111-1111-1111-111111111111', 'MX 50 Plus Sem Madeira', '1,00m X 1,30m x 0,40m', 1720.00, 1582.40, 1548.00, 0.00, 'Bagageiro compacto dianteiro/traseiro para Kombi.'),
  ('KOM-ESCADA', 'Escada Removível para Kombi', 'escada', '11111111-1111-1111-1111-111111111111', 'Escada Removível', '1,35m X 0,30m x 0,16m', 620.00, 589.00, 558.00, 0.00, 'Escada tubular removível para acesso ao bagageiro.'),
  ('KOM-VENTOSAS', 'Par de Ventosas para Kombi', 'acessorio_fixacao', '11111111-1111-1111-1111-111111111111', 'Par de Ventosas', 'Padrão', 90.00, 85.50, 81.00, 0.00, 'Ventosas de borracha para proteção da lataria.'),
  ('KOM-ESTEPE', 'Suporte para Estepe no Bagageiro', 'suporte', '11111111-1111-1111-1111-111111111111', 'Suporte de Estepe', '0,25m X 0,18m x 0,19m', 380.00, 361.00, 342.00, 0.00, 'Suporte com trava para estepe no bagageiro.'),
  ('KOM-HASTE-UNID', 'Haste de Fixação com Arruela e Porca (Unidade)', 'acessorio_fixacao', '11111111-1111-1111-1111-111111111111', 'Haste Unitária', 'Padrão', 45.00, 42.75, 40.50, 0.00, 'Haste em aço para calha da Kombi.'),
  ('KOM-KIT-HASTES-8P', 'Kit com 8 Pares de Hastes de Fixação para Kombi', 'acessorio_fixacao', '11111111-1111-1111-1111-111111111111', 'Kit 8 Pares', 'Padrão', 340.00, 323.00, 273.60, 0.00, 'Conjunto completo de fixação para bagageiro longo.'),
  ('KOM-KIT-FIX-ESC', 'Kit de Fixação para Escada de Kombi', 'acessorio_fixacao', '11111111-1111-1111-1111-111111111111', 'Fixação Escada', '0,8cm X 4,5cm', 100.00, 95.00, 90.00, 0.00, 'Parafusos e suportes dedicados da escada.'),
  ('KOM-SUP-TOLDO', 'Suporte Base para Toldo', 'suporte', '11111111-1111-1111-1111-111111111111', 'Base Toldo Universal', '0,16m X 0,12m', 330.00, 313.50, 297.00, 0.00, 'Suporte para fixação de toldo lateral no bagageiro.'),
  ('KOM-SUP-TOLDO-LEROY', 'Suporte Base para Toldo (Modelo Leroy Merlin)', 'suporte', '11111111-1111-1111-1111-111111111111', 'Base Toldo Leroy', '0,16m X 0,12m', 370.00, 351.50, 333.00, 0.00, 'Específico para toldo retrátil Leroy Merlin.'),
  ('KOM-BARRA-SOLAR', 'Barra para Fixação de Placa Solar (Par)', 'suporte', '11111111-1111-1111-1111-111111111111', 'Par Travessas Solar', '1,35m X 0,10m x 0,10m', 340.00, 323.00, 306.00, 0.00, 'Travessas reforçadas para painéis solares.'),
  ('KOM-DECK-MX100', 'Aplicação de Deck Completo MX 100 / 200 Plus', 'deck', '11111111-1111-1111-1111-111111111111', 'Deck Total 3,30m', '3,30m', 1960.00, 1529.50, 1575.00, 0.00, 'Ripamento em madeira tratada de alta durabilidade para todo o piso.'),
  ('KOM-MEIO-DECK-MX100', 'Aplicação de Meio Deck MX 100 / 200 Plus', 'deck', '11111111-1111-1111-1111-111111111111', 'Meio Deck 3,30m', '3,30m', 1080.00, 1026.00, 972.00, 0.00, 'Ripamento em madeira na metade traseira.'),
  ('KOM-DECK-MX80', 'Aplicação de Deck MX 80 Plus', 'deck', '11111111-1111-1111-1111-111111111111', 'Deck 2,20m', '2,20m', 1570.00, 1491.50, 1413.00, 0.00, 'Madeiramento sob medida para modelo MX 80.'),
  ('KOM-DECK-MX50', 'Aplicação de Deck MX 50 Plus', 'deck', '11111111-1111-1111-1111-111111111111', 'Deck 1,00m', '1,00m', 730.00, 693.50, 657.00, 0.00, 'Madeiramento para modelo compacto MX 50.'),
  ('KOM-DECK-ESCADA', 'Aplicação de Deck nos Degraus da Escada', 'deck', '11111111-1111-1111-1111-111111111111', 'Deck Escada', '30cm', 200.00, 190.00, 180.00, 0.00, 'Acabamento em madeira nos degraus.'),

  -- RENAULT KANGOO (CLÁSSICA)
  ('KAN-KX100', 'Bagageiro Kangoo KX 100 (Aba Dupla)', 'bagageiro', '22222222-2222-2222-2222-222222222222', 'KX 100 Aba Dupla', '1,95m X 1,12m x 0,10m', 2100.00, 1995.00, 1890.00, 0.00, 'Bagageiro para Renault Kangoo clássica com aba dupla.'),
  ('KAN-KX200', 'Bagageiro Kangoo KX 200 (Aba Lateral)', 'bagageiro', '22222222-2222-2222-2222-222222222222', 'KX 200 Aba Lateral', '1,95m X 1,12m x 0,10m', 2100.00, 1995.00, 1890.00, 0.00, 'Bagageiro para Renault Kangoo clássica com aba lateral.'),

  -- NOVA RENAULT KANGOO
  ('KAN-KX200-NOVA', 'Bagageiro Nova Kangoo KX 200 (Aba Lateral)', 'bagageiro', '33333333-3333-3333-3333-333333333333', 'KX 200 Nova Kangoo', '2,00m X 1,17m x 0,10m', 2300.00, 2185.00, 2070.00, 0.00, 'Novo modelo Kangoo. Atenção: Vãos de 23-24cm, +20cm altura. Incompatível com rolete.'),

  -- FIAT FIORINO
  ('FIO-FX100', 'Bagageiro Fiorino FX 100 (Aba Dupla)', 'bagageiro', '44444444-4444-4444-4444-444444444444', 'FX 100 Aba Dupla', '1,80m X 1,25m x 0,10m', 2200.00, 2090.00, 1980.00, 200.00, 'Bagageiro para Fiat Fiorino aba dupla. Instalação: R$ 200.'),
  ('FIO-FX200', 'Bagageiro Fiorino FX 200 (Aba Lateral)', 'bagageiro', '44444444-4444-4444-4444-444444444444', 'FX 200 Aba Lateral', '1,80m X 1,25m x 0,10m', 2200.00, 2090.00, 1980.00, 200.00, 'Bagageiro para Fiat Fiorino aba lateral (compatível com guia de rolete). Instalação: R$ 200.'),

  -- FIAT DOBLO
  ('DOB-DX100', 'Bagageiro Doblo DX 100', 'bagageiro', '55555555-5555-5555-5555-555555555555', 'DX 100', '2,00m X 1,32m x 0,10m', 2300.00, 2185.00, 2070.00, 200.00, 'Bagageiro para Fiat Doblo Cargo. Instalação: R$ 200.'),
  ('DOB-DX200', 'Bagageiro Doblo DX 200', 'bagageiro', '55555555-5555-5555-5555-555555555555', 'DX 200', '2,00m X 1,32m x 0,10m', 2300.00, 2185.00, 2070.00, 200.00, 'Bagageiro para Fiat Doblo Cargo modelo DX 200. Instalação: R$ 200.'),

  -- PSA K0 (JUMPY / EXPERT / SCUDO)
  ('K0-MX120', 'Bagageiro Jumpy / Expert / Scudo MX 120', 'bagageiro', '66666666-6666-6666-6666-666666666666', 'MX 120', '2,65m X 1,30m x 0,16m', 2680.00, 2546.00, 2412.00, 0.00, 'Bagageiro padrão de alta resistência para linha K0 PSA.'),
  ('K0-ABA-DUPLA', 'Bagageiro Jumpy / Expert / Scudo Aba Dupla', 'bagageiro', '66666666-6666-6666-6666-666666666666', 'Aba Dupla', '2,65m X 1,30m x 0,16m', 2970.00, 2821.50, 2673.00, 0.00, 'Versão aba dupla com contenção reforçada.'),
  ('K0-EXTREME', 'Bagageiro Jumpy / Expert / Scudo Extreme', 'bagageiro', '66666666-6666-6666-6666-666666666666', 'Extreme Longo', '3,30m X 1,30m x 0,16m', 3470.00, 3296.50, 3123.00, 0.00, 'Versão estendida de 3,30m para carga pesada.'),
  ('K0-DECK-MX120', 'Aplicação de Deck Bagageiro MX 120', 'deck', '66666666-6666-6666-6666-666666666666', 'Deck K0', '2,65m', 1960.00, 1862.00, 1764.00, 0.00, 'Deck de madeira tratada para o bagageiro MX 120.'),
  ('K0-DECK-ESCADA', 'Aplicação de Deck para Escada MX 120', 'deck', '66666666-6666-6666-6666-666666666666', 'Deck Escada K0', 'Degraus', 340.00, 323.00, 306.00, 0.00, 'Madeira de acabamento para degraus da escada.'),
  ('K0-ESCADA', 'Escada para Jumpy / Expert / Scudo MX 120', 'escada', '66666666-6666-6666-6666-666666666666', 'Escada K0', '1,80m X 0,30m x 0,30m', 730.00, 693.50, 657.00, 0.00, 'Escada traseira para vans PSA.'),
  ('K0-SUP-ROLETE', 'Suporte para Escada com Guia de Rolete (K0)', 'suporte', '66666666-6666-6666-6666-666666666666', 'Guia de Rolete K0', '0,60m X 0,50m x 0,10m', 370.00, 351.50, 333.00, 0.00, 'Suporte com rolete traseiro deslizante para escadas de obra.'),

  -- FIAT DUCATO
  ('DUC-MAX-2023', 'Bagageiro Ducato Max Cargo 2023 (Aba Lateral)', 'bagageiro', '77777777-7777-7777-7777-777777777777', 'Max Cargo Aba Lateral', '3,65m X 1,70m x 0,10m', 4820.00, 4579.00, 4338.00, 0.00, 'Bagageiro gigante para furgão Ducato Max Cargo.'),

  -- VW SAVEIRO
  ('SAV-CS', 'Bagageiro Saveiro Cabine Simples', 'bagageiro', '88888888-8888-8888-8888-888888888888', 'Cabine Simples', 'Sob medida', 3900.00, 3705.00, 3510.00, 0.00, 'Bagageiro estrutural para Saveiro Cabine Simples.'),
  ('SAV-CD', 'Bagageiro Saveiro Cabine Dupla', 'bagageiro', '88888888-8888-8888-8888-888888888888', 'Cabine Dupla', 'Sob medida', 3500.00, 3325.00, 3150.00, 0.00, 'Bagageiro estrutural para Saveiro Cabine Dupla.'),
  ('SAV-ROLETE', 'Guia de Rolete Especial Saveiro', 'suporte', '88888888-8888-8888-8888-888888888888', 'Rolete Especial', 'Aprox 1,00m X 0,30m x 0,16m', 780.00, 634.80, 702.00, 0.00, 'Guia de rolete reforçado traseiro para Saveiro.'),

  -- SERVIÇOS GERAIS
  ('SRV-INST-REBITE', 'Serviço de Instalação com Rebite (com forração)', 'servico_instalacao', NULL, 'Serviço Especial', NULL, 340.00, 340.00, 340.00, 340.00, 'Fixação com rebite estrutural em teto com forração interna.'),
  ('SRV-INST-LEROY', 'Serviço de Instalação de Toldo Leroy Merlin', 'servico_instalacao', NULL, 'Serviço Especial', NULL, 170.00, 170.00, 170.00, 170.00, 'Mão de obra de fixação e alinhamento de toldo Leroy.'),
  ('SRV-CORTE-CLIMA', 'Corte e Vedação para Embutir Climatizador', 'servico_especial', NULL, 'Serviço Especial', NULL, 140.00, 140.00, 140.00, 140.00, 'Abertura técnica em bagageiro para passagem de climatizador.'),
  ('SRV-ZINCAGEM-30K', 'Zincagem Eletrolítica Especial (até 30kg)', 'servico_especial', NULL, 'Tratamento Especial', NULL, 390.00, 390.00, 390.00, 390.00, 'Tratamento anti-corrosão de alto rendimento.')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  compatible_vehicle_id = EXCLUDED.compatible_vehicle_id,
  model_version = EXCLUDED.model_version,
  dimensions = EXCLUDED.dimensions,
  base_price_10x = EXCLUDED.base_price_10x,
  cash_price_5pct = EXCLUDED.cash_price_5pct,
  max_discount_price_10pct = EXCLUDED.max_discount_price_10pct,
  installation_cost = EXCLUDED.installation_cost,
  description = EXCLUDED.description;
