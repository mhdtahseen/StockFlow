-- ==========================================
-- MULTI-TENANT SCHEMA INIT (StockFlow)
-- Tables: tenants, profiles, phones, ledger, master_data, catalog
-- ==========================================

-- 1. Tenants (Organizations/Shops)
CREATE TABLE IF NOT EXISTS public.tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Profiles (Users linked to Tenants)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'associate' CHECK (role IN ('admin', 'manager', 'associate')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Phones (Inventory)
CREATE TABLE IF NOT EXISTS public.phones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  ram           TEXT NOT NULL DEFAULT 'N/A',
  storage       TEXT NOT NULL,
  color         TEXT NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL CHECK (purchase_price > 0),
  sale_price     NUMERIC(12,2),
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_STOCK', 'SOLD')),
  issue_tags    TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Ledger (Financial Operations)
CREATE TABLE IF NOT EXISTS public.ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('MONEY_ADDED', 'FUNDS_PLEDGED', 'FUNDS_RELEASED', 'FUNDS_CONSUMED', 'PHONE_SALE', 'WITHDRAWAL', 'PROFIT_WITHDRAWAL')),
  reference_id  UUID REFERENCES public.phones(id) ON DELETE SET NULL,
  amount        NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Master Data (Tenant Specific Configurations)
CREATE TABLE IF NOT EXISTS public.master_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('brand', 'model', 'ram', 'storage', 'color', 'issue_tag')),
  value         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category, value)
);

-- 6. Catalog Models (Global Device Catalog)
CREATE TABLE IF NOT EXISTS public.catalog_models (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  storage       TEXT[] NOT NULL DEFAULT '{}',
  ram           TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand, model)
);

-- 7. Catalog Colors (Global Device Color Options)
CREATE TABLE IF NOT EXISTS public.catalog_model_colors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id      UUID NOT NULL REFERENCES public.catalog_models(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  hex           TEXT NOT NULL,
  UNIQUE(model_id, label)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_phones_tenant ON public.phones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phones_tenant_status ON public.phones(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_phones_tenant_created ON public.phones(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phones_user ON public.phones(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON public.ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON public.ledger(reference_id);
CREATE INDEX IF NOT EXISTS idx_master_data_tenant_category ON public.master_data(tenant_id, category);

-- ==========================================
-- GET USER TENANT HELPER
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger logic handled separately in 003_auth_triggers.sql
