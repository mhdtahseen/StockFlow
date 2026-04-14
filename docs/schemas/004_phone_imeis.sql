-- ==============================================================================
-- Phone IMEIs Schema (StockFlow)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.phone_imeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_id UUID NOT NULL REFERENCES public.phones(id) ON DELETE CASCADE,
  imei TEXT NOT NULL,
  imei_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (imei_status IN ('UNVERIFIED','CLEAN','BLACKLISTED','LOCKED','UNKNOWN')),
  imei_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Format check (exactly 15 digits)
ALTER TABLE public.phone_imeis DROP CONSTRAINT IF EXISTS imei_format_check;
ALTER TABLE public.phone_imeis ADD CONSTRAINT imei_format_check CHECK (imei ~ '^[0-9]{15}$');

-- Unique per tenant
DROP INDEX IF EXISTS idx_phone_imeis_unique_per_tenant;
CREATE UNIQUE INDEX idx_phone_imeis_unique_per_tenant ON public.phone_imeis (tenant_id, imei);

-- Multi-Tenancy Trigger (Hardened)
CREATE OR REPLACE FUNCTION set_phone_imei_tenant()
RETURNS TRIGGER AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine tenant_id for current user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS before_insert_phone_imeis ON public.phone_imeis;
CREATE TRIGGER before_insert_phone_imeis
BEFORE INSERT ON public.phone_imeis
FOR EACH ROW
EXECUTE FUNCTION set_phone_imei_tenant();

-- Row Level Security
ALTER TABLE public.phone_imeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imei_select" ON public.phone_imeis FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "imei_insert" ON public.phone_imeis FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "imei_update" ON public.phone_imeis FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "imei_delete" ON public.phone_imeis FOR DELETE USING (tenant_id = get_user_tenant_id());
