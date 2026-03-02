-- ═══════════════════════════════════════════════════════════════════════════════
-- Phone IMEIs Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores IMEI entries for phones. Supports multiple IMEIs per phone (Dual SIM).
-- Multi-tenant: tenant_id is auto-populated via a BEFORE INSERT trigger.
-- IMEI status is manually set after CEIR verification, with a future
-- provision for automatic API-based verification.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.phone_imeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_id UUID NOT NULL REFERENCES public.phones(id) ON DELETE CASCADE,
  imei TEXT NOT NULL,
  imei_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (imei_status IN ('UNVERIFIED','CLEAN','BLACKLISTED','LOCKED','UNKNOWN')),
  imei_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Format: exactly 15 digits
ALTER TABLE public.phone_imeis
ADD CONSTRAINT imei_format_check
CHECK (imei ~ '^[0-9]{15}$');

-- Unique per tenant (prevents duplicating same IMEI within a shop)
CREATE UNIQUE INDEX idx_phone_imeis_unique_per_tenant
ON public.phone_imeis (tenant_id, imei);

-- ── Multi-Tenancy Trigger ──────────────────────────────────────────────────
-- Auto-populates tenant_id from the authenticated user's profile.
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_insert_phone_imeis
BEFORE INSERT ON public.phone_imeis
FOR EACH ROW
EXECUTE FUNCTION set_phone_imei_tenant();

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.phone_imeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's IMEIs"
ON public.phone_imeis FOR SELECT
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert IMEIs for their tenant"
ON public.phone_imeis FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can update IMEIs for their tenant"
ON public.phone_imeis FOR UPDATE
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete IMEIs for their tenant"
ON public.phone_imeis FOR DELETE
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);
