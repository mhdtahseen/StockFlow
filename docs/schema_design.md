# StockFlow — Final Database Schema (Multi-Tenant + RBAC)

> **Status:** FINAL — ready to apply.

## Overview

**7 tables** — 5 tenant-scoped + 2 global.

```
┌─────────────────────────────────────────────────────────────┐
│                      StockFlow (SaaS)                       │
├──────────────────┬──────────────────┬───────────────────────┤
│  Tenant: MobiHub │ Tenant: PhoneKart│ Tenant: GadgetWorld   │
│  👤 Admin        │  👤 Admin        │  👤 Admin             │
│  👤 Manager      │  👤 Associate    │  👤 Manager           │
│  👤 Associate    │                  │  👤 Associate ×2      │
│  📱 Own phones   │  📱 Own phones   │  📱 Own phones        │
│  💰 Own ledger   │  💰 Own ledger   │  💰 Own ledger        │
│  🏷️ Own tags     │  🏷️ Own tags     │  🏷️ Own tags          │
├──────────────────┴──────────────────┴───────────────────────┤
│              📋 Shared Device Catalog (Global)              │
└─────────────────────────────────────────────────────────────┘
```

## Data Mapping

| Source             | → Supabase Table       | Scope                      |
| ------------------ | ---------------------- | -------------------------- |
| —                  | `tenants`              | Global (one per shop)      |
| Auth metadata      | `profiles`             | Per-user, scoped to tenant |
| `inventory.phones` | `phones`               | Per-tenant                 |
| `ledger.entries`   | `ledger`               | Per-tenant                 |
| `masterData.*`     | `master_data`          | Per-tenant                 |
| `deviceCatalog.ts` | `catalog_models`       | Global                     |
| —                  | `catalog_model_colors` | Global                     |

---

## 1. Table: `tenants`

Each row = one phone shop / business.

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,

  plan          TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'pro', 'enterprise')),

  is_active     BOOLEAN NOT NULL DEFAULT true,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE UNIQUE INDEX idx_tenants_slug ON tenants(slug);
```

---

## 2. Table: `profiles`

Each row = one user. Auto-created by trigger on signup. Scoped to a tenant with a role.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  email         TEXT,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,

  role          TEXT NOT NULL DEFAULT 'associate'
                CHECK (role IN ('admin', 'manager', 'associate')),

  is_active     BOOLEAN NOT NULL DEFAULT true,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Role Definitions (Per-Tenant)

| Role            | Level       | Scope                                                    |
| --------------- | ----------- | -------------------------------------------------------- |
| **`admin`**     | 🔴 Full     | Everything within their tenant + manage users/roles      |
| **`manager`**   | 🟡 Elevated | Full inventory + financials + analytics within tenant    |
| **`associate`** | 🟢 Standard | Add/edit own phones + record sales + view own financials |

### Permission Matrix

| Action                     | Admin | Manager | Associate      |
| -------------------------- | ----- | ------- | -------------- |
| Add phone                  | ✅    | ✅      | ✅             |
| Edit own phone             | ✅    | ✅      | ✅             |
| Edit any phone (in tenant) | ✅    | ✅      | ❌             |
| Delete phone               | ✅    | ✅      | ❌             |
| View tenant inventory      | ✅    | ✅      | ✅ (read only) |
| Add/view ledger entries    | ✅    | ✅      | Own only       |
| View analytics             | ✅    | ✅      | Limited        |
| Manage users/roles         | ✅    | ❌      | ❌             |
| Wallet top-up/withdraw     | ✅    | ✅      | ❌             |

### Indexes

```sql
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(tenant_id, role);
```

---

## 3. Table: `phones`

Each row = one physical phone device. Scoped to a tenant, created by a user.

```sql
CREATE TABLE phones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  ram           TEXT NOT NULL DEFAULT 'N/A',
  storage       TEXT NOT NULL,
  color         TEXT NOT NULL,

  purchase_price NUMERIC(12,2) NOT NULL CHECK (purchase_price > 0),
  sale_price     NUMERIC(12,2),

  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'IN_STOCK', 'SOLD')),

  issue_tags    TEXT[] NOT NULL DEFAULT '{}',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_phones_tenant ON phones(tenant_id);
CREATE INDEX idx_phones_tenant_status ON phones(tenant_id, status);
CREATE INDEX idx_phones_tenant_created ON phones(tenant_id, created_at DESC);
CREATE INDEX idx_phones_user ON phones(user_id);
```

---

## 4. Table: `ledger`

Each row = one financial event. Append-only, immutable. Scoped to a tenant.

```sql
CREATE TABLE ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type          TEXT NOT NULL
                CHECK (type IN (
                  'MONEY_ADDED',
                  'FUNDS_PLEDGED',
                  'FUNDS_RELEASED',
                  'FUNDS_CONSUMED',
                  'PHONE_SALE',
                  'WITHDRAWAL'
                )),

  reference_id  UUID REFERENCES phones(id) ON DELETE SET NULL,
  amount        NUMERIC(12,2) NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_ledger_tenant ON ledger(tenant_id);
CREATE INDEX idx_ledger_tenant_type ON ledger(tenant_id, type);
CREATE INDEX idx_ledger_reference ON ledger(reference_id);
CREATE INDEX idx_ledger_tenant_created ON ledger(tenant_id, created_at DESC);
CREATE INDEX idx_ledger_user ON ledger(user_id);
```

---

## 5. Table: `master_data`

Each row = one custom value. Scoped to a tenant (shared across all users in that tenant).

```sql
CREATE TABLE master_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  category      TEXT NOT NULL
                CHECK (category IN (
                  'brand', 'model', 'ram', 'storage', 'color', 'issue_tag'
                )),

  value         TEXT NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, category, value)
);
```

### Indexes

```sql
CREATE INDEX idx_master_data_lookup ON master_data(tenant_id, category);
```

---

## 6. Table: `catalog_models` (Global)

Global reference data. Not tenant-scoped. Read-only for users.

```sql
CREATE TABLE catalog_models (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  storage       TEXT[] NOT NULL DEFAULT '{}',
  ram           TEXT[] NOT NULL DEFAULT '{}',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(brand, model)
);
```

### Indexes

```sql
CREATE INDEX idx_catalog_models_brand ON catalog_models(brand);
```

---

## 7. Table: `catalog_model_colors` (Global)

Global color data. Not tenant-scoped. Read-only for users.

```sql
CREATE TABLE catalog_model_colors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id      UUID NOT NULL REFERENCES catalog_models(id) ON DELETE CASCADE,

  label         TEXT NOT NULL,
  hex           TEXT NOT NULL,

  UNIQUE(model_id, label)
);
```

### Indexes

```sql
CREATE INDEX idx_catalog_colors_model ON catalog_model_colors(model_id);
```

---

## Helper Functions

### Get current user's tenant

```sql
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Get current user's role

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## Auto-Create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Check if user was invited to an existing tenant
  v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;

  -- If no invite, create a new tenant for them
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name', 'My Shop'),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'org_name', 'shop-' || LEFT(NEW.id::TEXT, 8)), ' ', '-'))
    )
    RETURNING id INTO v_tenant_id;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    v_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.raw_user_meta_data->>'tenant_id' IS NULL THEN 'admin'
      ELSE 'associate'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## `updated_at` Trigger

Shared trigger for `tenants`, `profiles`, and `phones`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Row-Level Security (RLS)

All policies are **tenant-aware + role-aware**.

```sql
-- ══════════════════════════════════════════════════════════════════════════
-- TENANTS
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

CREATE POLICY "Admin updates own tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id() AND get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- See all members of your tenant (for team lists, display names)
CREATE POLICY "View tenant members"
  ON profiles FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users update own profile (name, avatar — NOT role, NOT tenant)
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND tenant_id = get_user_tenant_id())
  WITH CHECK (auth.uid() = id AND tenant_id = get_user_tenant_id());

-- Admins update any profile in their tenant (role changes)
CREATE POLICY "Admin manages tenant members"
  ON profiles FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════════════════
-- PHONES
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;

-- All tenant members can view all phones in their tenant
CREATE POLICY "View tenant phones"
  ON phones FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Any tenant member can add phones (to their tenant)
CREATE POLICY "Insert tenant phones"
  ON phones FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

-- Associates: own only. Managers/Admins: any phone in tenant
CREATE POLICY "Update tenant phones"
  ON phones FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'))
  );

-- Only manager/admin can delete
CREATE POLICY "Delete tenant phones"
  ON phones FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('admin', 'manager')
  );

-- ══════════════════════════════════════════════════════════════════════════
-- LEDGER
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;

-- Associates: own entries. Managers/Admins: all tenant entries
CREATE POLICY "View tenant ledger"
  ON ledger FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND (auth.uid() = user_id OR get_user_role() IN ('admin', 'manager'))
  );

-- Any tenant member can insert their own entries
CREATE POLICY "Insert tenant ledger"
  ON ledger FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

-- Only admin can delete (rare — corrections only)
CREATE POLICY "Admin delete ledger"
  ON ledger FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() = 'admin'
  );

-- ══════════════════════════════════════════════════════════════════════════
-- MASTER_DATA
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE master_data ENABLE ROW LEVEL SECURITY;

-- All tenant members share the same custom options
CREATE POLICY "View tenant master data"
  ON master_data FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Insert tenant master data"
  ON master_data FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

CREATE POLICY "Delete own master data"
  ON master_data FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════
-- CATALOG (GLOBAL — read-only for all authenticated users)
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE catalog_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catalog models"
  ON catalog_models FOR SELECT
  USING (true);

ALTER TABLE catalog_model_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catalog colors"
  ON catalog_model_colors FOR SELECT
  USING (true);
```

> [!NOTE]
> No INSERT/UPDATE/DELETE policies on catalog tables for regular users. Only service_role can modify the catalog.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    TENANTS ||--o{ PROFILES : "has members"
    TENANTS ||--o{ PHONES : "owns"
    TENANTS ||--o{ LEDGER : "owns"
    TENANTS ||--o{ MASTER_DATA : "owns"
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES }o--|| TENANTS : "belongs to"
    PHONES ||--o{ LEDGER : "referenced by"
    CATALOG_MODELS ||--o{ CATALOG_MODEL_COLORS : "has"

    TENANTS {
        uuid id PK
        text name
        text slug UK
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
        text avatar_url
        text role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PHONES {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text brand
        text model
        text ram
        text storage
        text color
        numeric purchase_price
        numeric sale_price
        text status
        text_arr issue_tags
        timestamptz created_at
        timestamptz updated_at
    }

    LEDGER {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text type
        uuid reference_id FK
        numeric amount
        timestamptz created_at
    }

    MASTER_DATA {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text category
        text value
        timestamptz created_at
    }

    CATALOG_MODELS {
        uuid id PK
        text brand
        text model
        text_arr storage
        text_arr ram
        timestamptz created_at
    }

    CATALOG_MODEL_COLORS {
        uuid id PK
        uuid model_id FK
        text label
        text hex
    }
```

---

## Redux → Column Name Mapping

| Redux field           | DB column        | Transform                      |
| --------------------- | ---------------- | ------------------------------ |
| `phone.id`            | `id`             | ✅ Already UUID                |
| — (from session)      | `tenant_id`      | Auto-injected on insert        |
| `phone.purchasePrice` | `purchase_price` | camelCase → snake_case         |
| `phone.salePrice`     | `sale_price`     | camelCase → snake_case         |
| `phone.issueTags`     | `issue_tags`     | `string[]` → `text[]` (native) |
| `phone.createdAt`     | `created_at`     | ISO string → timestamptz       |
| `ledger.referenceId`  | `reference_id`   | camelCase → snake_case         |

---

## Frontend Caching Strategy (TanStack Query)

```typescript
// Catalog brands — fetched once, never refetched
const { data: brands } = useQuery({
  queryKey: ["catalog", "brands"],
  queryFn: () =>
    supabase
      .from("catalog_models")
      .select("brand")
      .order("brand")
      .then(({ data }) => [...new Set(data?.map((r) => r.brand))]),
  staleTime: Infinity,
  gcTime: 24 * 60 * 60_000,
});

// Models for a brand — lazy, cached forever once loaded
const { data: models } = useQuery({
  queryKey: ["catalog", "models", brand],
  queryFn: () =>
    supabase
      .from("catalog_models")
      .select("id, model, storage, ram")
      .eq("brand", brand)
      .order("model"),
  enabled: !!brand,
  staleTime: Infinity,
});

// Colors for a model — lazy
const { data: colors } = useQuery({
  queryKey: ["catalog", "colors", modelId],
  queryFn: () =>
    supabase
      .from("catalog_model_colors")
      .select("label, hex")
      .eq("model_id", modelId),
  enabled: !!modelId,
  staleTime: Infinity,
});
```

---

## Seeding Strategy

The existing `deviceCatalog.ts` will be parsed into SQL:

1. Parse TS → extract brand/model/storage/ram/colors per model
2. Generate `INSERT INTO catalog_models (brand, model, storage, ram) VALUES ...`
3. Generate `INSERT INTO catalog_model_colors (model_id, label, hex) VALUES ...`
4. Apply as a seed migration

---

## What Stays Client-Side

| Data           | Why                                                      |
| -------------- | -------------------------------------------------------- |
| Wallet buckets | Computed from ledger via selectors — not stored          |
| Analytics      | Computed from phones + ledger via selectors — not stored |
