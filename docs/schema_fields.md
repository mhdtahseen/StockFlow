# StockFlow — Field-by-Field Schema Reference (Multi-Tenant)

> Every column in every table, explained.

---

## 1. `tenants` — Shops / Businesses

Each row = one phone shop or business using StockFlow.

| Column       | Type          | Nullable | Default             | Constraint                                      | Purpose                                                                                                                                              |
| ------------ | ------------- | -------- | ------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `UUID`        | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                                 | Unique tenant identifier. Referenced by all tenant-scoped tables.                                                                                    |
| `name`       | `TEXT`        | ❌       | —                   | —                                               | Human-readable shop name. e.g. `"MobiHub"`, `"PhoneKart"`. Displayed in the UI.                                                                      |
| `slug`       | `TEXT`        | ❌       | —                   | **UNIQUE**                                      | URL-safe identifier. e.g. `"mobihub"`, `"phonekart"`. Used in routes like `/app/mobihub/...`. Auto-generated from name on signup but can be changed. |
| `plan`       | `TEXT`        | ❌       | `'free'`            | `CHECK (plan IN ('free', 'pro', 'enterprise'))` | Subscription tier. Controls feature gates and limits. Defaults to free.                                                                              |
| `is_active`  | `BOOLEAN`     | ❌       | `true`              | —                                               | Soft-disable the entire tenant. When `false`, all members lose access without data deletion.                                                         |
| `created_at` | `TIMESTAMPTZ` | ❌       | `now()`             | —                                               | When the shop was registered.                                                                                                                        |
| `updated_at` | `TIMESTAMPTZ` | ❌       | `now()`             | Auto-updated via trigger                        | Last time tenant settings were modified.                                                                                                             |

---

## 2. `profiles` — User Accounts & RBAC

Each row = one registered user. Auto-created by trigger on signup. Every user belongs to exactly **one tenant** and has a **role within that tenant**.

| Column       | Type          | Nullable | Default       | Constraint                                          | Purpose                                                                                                                                                            |
| ------------ | ------------- | -------- | ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | `UUID`        | ❌       | —             | **PK + FK → `auth.users(id)` ON DELETE CASCADE**    | Same UUID as the Supabase auth user. 1:1 relationship — profile IS the user.                                                                                       |
| `tenant_id`  | `UUID`        | ❌       | —             | **FK → `tenants(id)` ON DELETE CASCADE**            | Which shop/business this user belongs to. Set at signup — either from invite or by creating a new tenant. If the tenant is deleted, all its users are deleted too. |
| `email`      | `TEXT`        | ✅       | `NULL`        | —                                                   | User's email. Pulled from `auth.users` at signup. Nullable because some auth providers may not provide it.                                                         |
| `full_name`  | `TEXT`        | ❌       | `''`          | —                                                   | Display name. Extracted from `raw_user_meta_data.full_name` at signup.                                                                                             |
| `avatar_url` | `TEXT`        | ✅       | `NULL`        | —                                                   | Profile picture URL. From OAuth providers (Google, GitHub).                                                                                                        |
| `role`       | `TEXT`        | ❌       | `'associate'` | `CHECK (role IN ('admin', 'manager', 'associate'))` | User's role **within their tenant**. Defaults to `'associate'` (least privilege). Only the tenant's admin can change roles.                                        |
| `is_active`  | `BOOLEAN`     | ❌       | `true`        | —                                                   | Soft-disable a user without deleting their account. When `false`, user can't access anything.                                                                      |
| `created_at` | `TIMESTAMPTZ` | ❌       | `now()`       | —                                                   | When the user signed up.                                                                                                                                           |
| `updated_at` | `TIMESTAMPTZ` | ❌       | `now()`       | Auto-updated via trigger                            | Last time profile was modified.                                                                                                                                    |

### Role Hierarchy (Per-Tenant)

```
admin > manager > associate
  │        │          │
  │        │          └─ Add/edit own phones, record own sales, view own ledger
  │        └────────── + Edit any phone, delete phones, full financials, analytics
  └─────────────────── + Manage users/roles, delete ledger entries
```

### Signup Flow

| Scenario                   | Result                                                     |
| -------------------------- | ---------------------------------------------------------- |
| **New signup (no invite)** | Creates a new tenant → user becomes `admin` of that tenant |
| **Signup via invite link** | Joins existing tenant → user becomes `associate`           |

---

## 3. `phones` — Device Inventory

Each row = one physical phone device. Belongs to a **tenant** and was created by a specific **user**.

| Column           | Type            | Nullable | Default             | Constraint                                          | Purpose                                                                                       |
| ---------------- | --------------- | -------- | ------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`             | `UUID`          | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                                     | Unique device identifier.                                                                     |
| `tenant_id`      | `UUID`          | ❌       | —                   | **FK → `tenants(id)` ON DELETE CASCADE**            | Which shop owns this device. All RLS filters by this.                                         |
| `user_id`        | `UUID`          | ❌       | —                   | **FK → `auth.users(id)` ON DELETE CASCADE**         | Which team member added this device. Used for "own vs any" permission checks.                 |
| `brand`          | `TEXT`          | ❌       | —                   | —                                                   | Device manufacturer. e.g. `"Apple"`, `"Samsung"`. Free-text.                                  |
| `model`          | `TEXT`          | ❌       | —                   | —                                                   | Device model name. e.g. `"iPhone 14 Pro"`. Free-text.                                         |
| `ram`            | `TEXT`          | ❌       | `'N/A'`             | —                                                   | RAM size. e.g. `"8GB"`. Defaults to `"N/A"` when not specified.                               |
| `storage`        | `TEXT`          | ❌       | —                   | —                                                   | Storage capacity. e.g. `"256GB"`, `"1TB"`. Required.                                          |
| `color`          | `TEXT`          | ❌       | —                   | —                                                   | Color label. e.g. `"Midnight Green"`. Stored as label, not hex code.                          |
| `purchase_price` | `NUMERIC(12,2)` | ❌       | —                   | `CHECK (purchase_price > 0)`                        | Cost in ₹. `NUMERIC(12,2)` = exact decimal, up to ₹9,999,999,999.99. Must be > 0.             |
| `sale_price`     | `NUMERIC(12,2)` | ✅       | `NULL`              | —                                                   | Sale price. `NULL` until sold. Populated when `status = 'SOLD'`.                              |
| `status`         | `TEXT`          | ❌       | `'PENDING'`         | `CHECK (status IN ('PENDING', 'IN_STOCK', 'SOLD'))` | Lifecycle stage. See below.                                                                   |
| `issue_tags`     | `TEXT[]`        | ❌       | `'{}'`              | —                                                   | Condition/issue labels. e.g. `{"Screen Scratch", "Battery Degraded"}`. Native Postgres array. |
| `created_at`     | `TIMESTAMPTZ`   | ❌       | `now()`             | —                                                   | When device was added.                                                                        |
| `updated_at`     | `TIMESTAMPTZ`   | ❌       | `now()`             | Auto-updated via trigger                            | Last modification time.                                                                       |

### Status Lifecycle

```
PENDING ──→ IN_STOCK ──→ SOLD
   │                       ↑
   └───────────────────────┘  (direct sale from pending)
```

---

## 4. `ledger` — Financial Event Log

Each row = one financial event. **Append-only / immutable**. Scoped to a tenant.

| Column         | Type            | Nullable | Default             | Constraint                                  | Purpose                                                                                                                         |
| -------------- | --------------- | -------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `UUID`          | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                             | Unique entry identifier.                                                                                                        |
| `tenant_id`    | `UUID`          | ❌       | —                   | **FK → `tenants(id)` ON DELETE CASCADE**    | Which shop this entry belongs to.                                                                                               |
| `user_id`      | `UUID`          | ❌       | —                   | **FK → `auth.users(id)` ON DELETE CASCADE** | Who created this entry. Used for "own only" visibility for associates.                                                          |
| `type`         | `TEXT`          | ❌       | —                   | `CHECK (type IN (...))`                     | Financial event type. See table below.                                                                                          |
| `reference_id` | `UUID`          | ✅       | `NULL`              | **FK → `phones(id)` ON DELETE SET NULL**    | Links to the related phone. `NULL` for wallet operations. `ON DELETE SET NULL` preserves financial history if phone is deleted. |
| `amount`       | `NUMERIC(12,2)` | ❌       | —                   | —                                           | Amount in ₹. **Always positive** — direction determined by `type`.                                                              |
| `created_at`   | `TIMESTAMPTZ`   | ❌       | `now()`             | —                                           | When this event occurred.                                                                                                       |

### Entry Types

| Type             | Trigger                          | Wallet Effect | Lien Effect                 |
| ---------------- | -------------------------------- | ------------- | --------------------------- |
| `MONEY_ADDED`    | User tops up wallet              | +amount       | —                           |
| `WITHDRAWAL`     | User withdraws                   | −amount       | —                           |
| `FUNDS_PLEDGED`  | New PENDING phone added          | −amount       | +amount                     |
| `FUNDS_RELEASED` | Price reduced or phone cancelled | +amount       | −amount                     |
| `FUNDS_CONSUMED` | PENDING → IN_STOCK               | —             | −amount → Purchases +amount |
| `PHONE_SALE`     | Device sold                      | Sales +amount | —                           |

> [!IMPORTANT]
> No `updated_at` — ledger entries are **immutable**. Corrections use compensating entries (e.g., `FUNDS_RELEASED` to reverse a `FUNDS_PLEDGED`).

---

## 5. `master_data` — Tenant's Custom Options

Each row = one custom value added by a tenant member. Shared across the entire tenant (all members see the same custom brands, tags, etc.).

| Column       | Type          | Nullable | Default             | Constraint                                                                       | Purpose                                                    |
| ------------ | ------------- | -------- | ------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `id`         | `UUID`        | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                                                                  | Unique row identifier.                                     |
| `tenant_id`  | `UUID`        | ❌       | —                   | **FK → `tenants(id)` ON DELETE CASCADE**                                         | Which shop this custom value belongs to.                   |
| `user_id`    | `UUID`        | ❌       | —                   | **FK → `auth.users(id)` ON DELETE CASCADE**                                      | Who added it.                                              |
| `category`   | `TEXT`        | ❌       | —                   | `CHECK (category IN ('brand', 'model', 'ram', 'storage', 'color', 'issue_tag'))` | Type of data. Maps to Redux `MasterDataState` arrays.      |
| `value`      | `TEXT`        | ❌       | —                   | —                                                                                | The actual value. e.g. `"Realme"` (brand), `"24GB"` (ram). |
| `created_at` | `TIMESTAMPTZ` | ❌       | `now()`             | —                                                                                | When added.                                                |

**Unique constraint:** `UNIQUE(tenant_id, category, value)` — prevents the same tenant from having duplicate `"8GB"` in RAM.

### Category → Redux Mapping

| `category`    | Redux field                   |
| ------------- | ----------------------------- |
| `'brand'`     | `masterData.brands[]`         |
| `'model'`     | `masterData.models[]`         |
| `'ram'`       | `masterData.ramOptions[]`     |
| `'storage'`   | `masterData.storageOptions[]` |
| `'color'`     | `masterData.colorOptions[]`   |
| `'issue_tag'` | `masterData.issueTags[]`      |

---

## 6. `catalog_models` — Device Catalog (Global)

Each row = one phone model. **Global** — shared across all tenants. Read-only for users.

| Column       | Type          | Nullable | Default             | Constraint      | Purpose                                                             |
| ------------ | ------------- | -------- | ------------------- | --------------- | ------------------------------------------------------------------- |
| `id`         | `UUID`        | ❌       | `gen_random_uuid()` | **PRIMARY KEY** | Unique model ID. FK target for colors table.                        |
| `brand`      | `TEXT`        | ❌       | —                   | —               | Manufacturer. e.g. `"Apple"`, `"Samsung"`.                          |
| `model`      | `TEXT`        | ❌       | —                   | —               | Model name. e.g. `"iPhone 14 Pro"`.                                 |
| `storage`    | `TEXT[]`      | ❌       | `'{}'`              | —               | Available storage sizes. e.g. `{"128GB", "256GB", "512GB", "1TB"}`. |
| `ram`        | `TEXT[]`      | ❌       | `'{}'`              | —               | Available RAM sizes. e.g. `{"6GB", "8GB"}`.                         |
| `created_at` | `TIMESTAMPTZ` | ❌       | `now()`             | —               | When catalog entry was added.                                       |

**Unique constraint:** `UNIQUE(brand, model)`

---

## 7. `catalog_model_colors` — Model Colors (Global)

Each row = one color for a specific model. Separate table because colors have structured data (label + hex).

| Column     | Type   | Nullable | Default             | Constraint                                      | Purpose                                                  |
| ---------- | ------ | -------- | ------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `id`       | `UUID` | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                                 | Unique color row ID.                                     |
| `model_id` | `UUID` | ❌       | —                   | **FK → `catalog_models(id)` ON DELETE CASCADE** | Which model. Cascade deletes colors if model is removed. |
| `label`    | `TEXT` | ❌       | —                   | —                                               | Color name. e.g. `"Midnight Green"`, `"Titanium Black"`. |
| `hex`      | `TEXT` | ❌       | —                   | —                                               | CSS hex code. e.g. `"#1C1C1C"`. Used for UI swatches.    |

**Unique constraint:** `UNIQUE(model_id, label)`

---

## Row Counts (Expected)

| Table                  | Expected rows                   | Growth                               |
| ---------------------- | ------------------------------- | ------------------------------------ |
| `tenants`              | Small (shops)                   | Slow — one per business              |
| `profiles`             | Small per tenant                | Grows with team                      |
| `phones`               | Hundreds → Thousands per tenant | Grows with business                  |
| `ledger`               | 2-5× phones count               | Multiple entries per phone lifecycle |
| `master_data`          | Tens per tenant                 | Custom values, slow growth           |
| `catalog_models`       | ~500+ (seeded)                  | New phone releases                   |
| `catalog_model_colors` | ~2,000+ (seeded)                | ~4 colors per model                  |

---

## 8. `notifications` — Real-Time Alert System

Each row = one system-generated or user-generated alert. Scoped to a tenant and targeted to a specific user.

| Column         | Type          | Nullable | Default             | Constraint                                  | Purpose                                                                                     |
| -------------- | ------------- | -------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`           | `UUID`        | ❌       | `gen_random_uuid()` | **PRIMARY KEY**                             | Unique notification identifier.                                                             |
| `tenant_id`    | `UUID`        | ❌       | —                   | **FK → `tenants(id)` ON DELETE CASCADE**    | Which shop this alert belongs to.                                                           |
| `user_id`      | `UUID`        | ❌       | —                   | **FK → `auth.users(id)` ON DELETE CASCADE** | Who this notification is for. Important for individual unread states.                       |
| `type`         | `TEXT`        | ❌       | —                   | `CHECK (type IN (...))`                     | Alert category (e.g. `PHONE_SOLD`, `ROLE_PROMOTED`, `LEDGER_ENTRY`, `SYSTEM_ALERT`).        |
| `title`        | `TEXT`        | ❌       | —                   | —                                           | Short headline for the notification.                                                        |
| `message`      | `TEXT`        | ❌       | —                   | —                                           | Detailed description of the event.                                                          |
| `reference_id` | `UUID`        | ✅       | `NULL`              | —                                           | Optional ID linking back to a specific entity (e.g., phone ID, ledger ID) for deep-linking. |
| `read_at`      | `TIMESTAMPTZ` | ✅       | `NULL`              | —                                           | Tracks read state. If `NULL`, the notification is unread.                                   |
| `created_at`   | `TIMESTAMPTZ` | ❌       | `now()`             | —                                           | When this alert was generated.                                                              |
