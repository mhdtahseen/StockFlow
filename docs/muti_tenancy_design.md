# StockFlow — Multi-Tenancy Design

> **Status:** DISCUSSION — not yet approved.

## What is Multi-Tenancy?

**Current design (single-tenant):** All users share one pool of data, separated by `user_id`. Everyone is in the same "shop."

**Multi-tenant design:** Each phone shop/business is a **tenant** with fully isolated data. Users belong to a tenant and can only access that tenant's data.

```
┌─────────────────────────────────────────────────┐
│                  StockFlow App                  │
├──────────────┬──────────────┬───────────────────┤
│  Tenant A    │  Tenant B    │  Tenant C         │
│  "MobiHub"   │  "PhoneKart" │  "GadgetWorld"    │
│              │              │                   │
│  👤 Admin    │  👤 Admin    │  👤 Admin         │
│  👤 Manager  │  👤 Associate│  👤 Manager       │
│  👤 Associate│              │  👤 Associate     │
│              │              │  👤 Associate     │
│  📱 50 phones│  📱 12 phones│  📱 200 phones    │
│  💰 Own ledger│ 💰 Own ledger│ 💰 Own ledger    │
└──────────────┴──────────────┴───────────────────┘
```

Each tenant has:

- Its own users (with roles scoped to that tenant)
- Its own phone inventory
- Its own financial ledger
- Its own master data (custom brands, tags, etc.)

Users in Tenant A **cannot see** Tenant B's phones, ledger, or users.

---

## Schema Changes Required

### 1. New Table: `tenants`

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name          TEXT NOT NULL,              -- "MobiHub", "PhoneKart"
  slug          TEXT NOT NULL UNIQUE,       -- "mobihub", "phonekart" (for URLs)

  plan          TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'pro', 'enterprise')),

  is_active     BOOLEAN NOT NULL DEFAULT true,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. Add `tenant_id` to `profiles`

```diff
 CREATE TABLE profiles (
   id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
+  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

   email         TEXT,
   full_name     TEXT NOT NULL DEFAULT '',
   avatar_url    TEXT,

   role          TEXT NOT NULL DEFAULT 'associate'
                 CHECK (role IN ('admin', 'manager', 'associate')),
   ...
 );
```

### 3. Add `tenant_id` to All User-Scoped Tables

```diff
 -- phones
 CREATE TABLE phones (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   ...
 );

 -- ledger
 CREATE TABLE ledger (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   ...
 );

 -- master_data
 CREATE TABLE master_data (
   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   ...
 );
```

### 4. No Changes to Catalog Tables

`catalog_models` and `catalog_model_colors` remain **global** — they're reference data shared across all tenants. A Samsung Galaxy S24 is the same phone regardless of which shop is selling it.

---

## Updated RLS Policies

The key change: RLS now filters by **tenant**, not just by user.

### Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Example: Phones RLS

```sql
-- Before (single-tenant):
CREATE POLICY "All users view phones"
  ON phones FOR SELECT
  USING (true);  -- everyone sees everything

-- After (multi-tenant):
CREATE POLICY "Users view tenant phones"
  ON phones FOR SELECT
  USING (tenant_id = get_user_tenant_id());  -- only see your tenant's phones
```

### Full RLS Pattern

| Table         | SELECT                            | INSERT            | UPDATE                    | DELETE             |
| ------------- | --------------------------------- | ----------------- | ------------------------- | ------------------ |
| `tenants`     | Own tenant only                   | Service role only | Admin of that tenant      | Service role only  |
| `profiles`    | Same tenant                       | Auto (trigger)    | Own profile OR admin      | Service role only  |
| `phones`      | Same tenant                       | Same tenant       | Own OR manager+ in tenant | Manager+ in tenant |
| `ledger`      | Own entries OR manager+ in tenant | Same tenant       | ❌ (immutable)            | Admin in tenant    |
| `master_data` | Same tenant                       | Same tenant       | Own                       | Own                |

---

## Updated ER Diagram

```mermaid
erDiagram
    TENANTS ||--o{ PROFILES : "has members"
    AUTH_USERS ||--|| PROFILES : "has"
    TENANTS ||--o{ PHONES : "owns"
    TENANTS ||--o{ LEDGER : "owns"
    TENANTS ||--o{ MASTER_DATA : "owns"
    PHONES ||--o{ LEDGER : "referenced by"
    CATALOG_MODELS ||--o{ CATALOG_MODEL_COLORS : "has"

    TENANTS {
        uuid id PK
        text name
        text slug
        text plan
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES {
        uuid id PK_FK
        uuid tenant_id FK
        text email
        text full_name
        text role
        boolean is_active
    }

    PHONES {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text brand
        text model
        text status
    }
```

---

## Signup Flow Changes

When a new user signs up, they either:

1. **Create a new tenant** (they become admin):

   ```
   User signs up → Create tenant "MobiHub" → Create profile (role: admin, tenant_id: new_tenant)
   ```

2. **Join an existing tenant via invite** (they become associate):
   ```
   Admin generates invite link → User signs up → Create profile (role: associate, tenant_id: inviter's_tenant)
   ```

The auto-profile trigger needs updating:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Check if user was invited (tenant_id stored in metadata)
  v_tenant_id := NEW.raw_user_meta_data->>'tenant_id';

  -- If no invite, create a new tenant for them
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'org_name', 'My Shop'))
    RETURNING id INTO v_tenant_id;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'tenant_id' IS NULL
         THEN 'admin'    -- new tenant creator = admin
         ELSE 'associate' -- invited user = associate
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Frontend Changes

| Area                 | What changes                                                                           |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Supabase queries** | Every query to phones/ledger/master_data auto-filtered by RLS — no code change needed. |
| **Signup flow**      | New "Create Shop" vs "Join Shop" paths.                                                |
| **User management**  | Admin panel to invite users, change roles, deactivate members.                         |
| **Tenant settings**  | Shop name, slug, plan management.                                                      |
| **URL routing**      | Optional: `/app/mobihub/inventory` vs `/app/inventory` (tenant from session).          |

---

## Should We Do This Now?

### Cost-Benefit Analysis

| Factor               | Single-Tenant (Current)                | Multi-Tenant                                         |
| -------------------- | -------------------------------------- | ---------------------------------------------------- |
| **Complexity**       | Simple                                 | Moderate (+1 table, +1 FK everywhere, invite system) |
| **Time to build**    | ✅ Ready now                           | +2-3 days for schema + invite flow                   |
| **Future migration** | Need to add `tenant_id` later (harder) | ✅ Already there                                     |
| **Use case**         | One shop, one team                     | Multiple shops, SaaS model                           |
| **RLS complexity**   | Straightforward                        | Slightly more complex (tenant + role)                |

### Recommendation

> [!TIP]
> **If you plan to offer StockFlow as a SaaS** (multiple shops using your app), add multi-tenancy **now** — it's much easier to bake in from the start than to retrofit later.
>
> **If this is for a single shop/team**, the current single-tenant design with RBAC roles is sufficient. You can always add tenancy later, but it'll require a data migration.

---

## Summary of Changes

| Change            | Single-Tenant                | Multi-Tenant                       |
| ----------------- | ---------------------------- | ---------------------------------- |
| Tables            | 6                            | 7 (+`tenants`)                     |
| FK on user tables | `user_id` only               | `user_id` + `tenant_id`            |
| RLS filter        | `auth.uid() = user_id`       | `tenant_id = get_user_tenant_id()` |
| Signup            | Simple (auto-create profile) | Create tenant OR join via invite   |
| Catalog tables    | Global (unchanged)           | Global (unchanged)                 |
| Indexes           | On `user_id`                 | On `(tenant_id, user_id)` compound |
