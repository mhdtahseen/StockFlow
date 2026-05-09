-- Phase 1: Unit Registry & History Tables
CREATE TABLE IF NOT EXISTS unit_registry (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei_primary  TEXT UNIQUE NOT NULL,
  imei_secondary TEXT UNIQUE,
  
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  ram           TEXT,
  storage       TEXT,
  color         TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unit_lifecycle (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei_ref      TEXT NOT NULL,
  
  event_type    TEXT NOT NULL, -- 'REGISTERED', 'PURCHASED', 'SOLD'
  event_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  tenant_id     UUID REFERENCES tenants(id),
  
  -- Metadata for anonymized display
  display_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_unit_registry_imeis ON unit_registry(imei_primary, imei_secondary);
CREATE INDEX IF NOT EXISTS idx_unit_lifecycle_imei ON unit_lifecycle(imei_ref);

-- Phase 2: Automatic Lifecycle Triggers
CREATE OR REPLACE FUNCTION fn_log_phone_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  v_imei TEXT;
  v_primary_imei TEXT;
BEGIN
  -- Get the first IMEI as primary reference
  v_imei := COALESCE(NEW.imeis[1], NEW.imei); -- Support both array and single col if exists
  
  IF v_imei IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Ensure unit exists in registry
  -- We use an UPSERT style approach to capture/update specs
  INSERT INTO unit_registry (imei_primary, brand, model, ram, storage, color)
  VALUES (v_imei, NEW.brand, NEW.model, NEW.ram, NEW.storage, NEW.color)
  ON CONFLICT (imei_primary) DO UPDATE SET
    brand = EXCLUDED.brand,
    model = EXCLUDED.model;

  -- 2. Log Event
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO unit_lifecycle (imei_ref, event_type, tenant_id, display_message)
    VALUES (v_imei, 'PURCHASED', NEW.tenant_id, 'Device acquired by an Authorized Partner');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'SOLD' AND NEW.status = 'SOLD') THEN
    INSERT INTO unit_lifecycle (imei_ref, event_type, tenant_id, display_message)
    VALUES (v_imei, 'SOLD', NEW.tenant_id, 'Device sold to an End User');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on phones table
DROP TRIGGER IF EXISTS tr_phone_lifecycle ON phones;
CREATE TRIGGER tr_phone_lifecycle
  AFTER INSERT OR UPDATE ON phones
  FOR EACH ROW
  EXECUTE FUNCTION fn_log_phone_lifecycle();

-- RLS for Global Registry (Read-only for all users)
ALTER TABLE unit_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read unit registry" ON unit_registry
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE unit_lifecycle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read unit lifecycle" ON unit_lifecycle
  FOR SELECT USING (auth.role() = 'authenticated');
