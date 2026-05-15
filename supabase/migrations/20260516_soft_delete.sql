-- =====================================================================
-- SOFT DELETE: counterparties + phones
-- ---------------------------------------------------------------------
-- Strategy: add deleted_at TIMESTAMPTZ column.
--   • NULL   → record is active (visible to tenant users)
--   • non-NULL → record is soft-deleted (hidden by RLS, preserved for FK
--                integrity on orders, payments, ledger)
--
-- Re-add edge case: handled by partial unique index on counterparties
--   (tenant_id, phone) WHERE deleted_at IS NULL — prevents duplicate
--   active customers while allowing the same phone on a deleted record.
--   A fresh insert is created; historical orders reference the old UUID
--   which remains in the DB (deleted_at set) and is visible to admin RPCs
--   (SECURITY DEFINER bypass RLS).
--
-- Note: super_admin_phone_access SELECT policy is intentionally untouched
--   so super-admins can always see all records including soft-deleted ones.
-- =====================================================================

-- ── 1. ADD COLUMNS ──────────────────────────────────────────────────

ALTER TABLE public.counterparties
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.phones
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. DEDUPLICATE BEFORE INDEXING ──────────────────────────────────
-- Soft-delete older duplicates (same tenant_id + phone) before we add
-- the unique index. Keeps the most recently created record per pair.
UPDATE public.counterparties c
SET deleted_at = now()
WHERE phone IS NOT NULL
  AND deleted_at IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (tenant_id, phone) id
    FROM public.counterparties
    WHERE phone IS NOT NULL AND deleted_at IS NULL
    ORDER BY tenant_id, phone, created_at DESC
  );

-- ── 3. INDEXES ───────────────────────────────────────────────────────

-- Prevent two active customers with same phone number per tenant.
-- Deleted records are excluded so re-adding a customer with the same
-- phone number always succeeds (creates a fresh record).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_active_phone
  ON public.counterparties (tenant_id, phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;

-- Partial indexes for admin/support restore-lookup queries.
CREATE INDEX IF NOT EXISTS idx_cp_deleted
  ON public.counterparties (tenant_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phones_deleted
  ON public.phones (tenant_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 3. FIX STARTER PLAN PHONE CAP ───────────────────────────────────
-- The previous "Insert tenant phones" policy (20260515_tier_redesign.sql)
-- counted ALL phones including soft-deleted ones. This meant deleting and
-- re-adding phones would exhaust the 100-phone cap. Fix: exclude deleted.

DROP POLICY IF EXISTS "Insert tenant phones" ON public.phones;
CREATE POLICY "Insert tenant phones" ON public.phones
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND auth.uid() = user_id
    AND (
      -- Trial, Pro, Enterprise: unlimited phones
      public.get_tenant_plan() = ANY (ARRAY['trial', 'pro', 'enterprise'])
      -- Starter: cap at 100 active (non-deleted) phones
      OR (
        public.get_tenant_plan() = 'starter'
        AND (
          SELECT COUNT(*)
          FROM public.phones p
          WHERE p.tenant_id = public.get_user_tenant_id()
            AND p.deleted_at IS NULL   -- ← only count active phones
        ) < 100
      )
    )
  );

-- ── 4. UPDATE SELECT POLICIES: EXCLUDE SOFT-DELETED RECORDS ─────────

-- counterparties: single SELECT policy
DROP POLICY IF EXISTS "cp_select" ON public.counterparties;
CREATE POLICY "cp_select" ON public.counterparties
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND deleted_at IS NULL
  );

-- phones: two overlapping tenant-scoped SELECT policies (both must be updated)
DROP POLICY IF EXISTS "Users can view tenant phones" ON public.phones;
CREATE POLICY "Users can view tenant phones" ON public.phones
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "View tenant phones" ON public.phones;
CREATE POLICY "View tenant phones" ON public.phones
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND deleted_at IS NULL
  );

-- "super_admin_phone_access" is intentionally NOT touched —
-- super-admins must be able to see all records including deleted ones.
