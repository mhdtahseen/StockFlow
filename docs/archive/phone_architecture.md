# Phone Architecture & Flow

This document outlines the complete architectural lifecycle of a Phone object in StockFlow — detailing how the state transitions work, the PostgreSQL schemas involved, and how the financial ledger is intrinsically tied to a phone's lifecycle.

---

## 🏗️ 1. Database Schema

### `phones` Table

The primary source of truth for physical inventory.

| Column           | Type               | Description                                                                   |
| ---------------- | ------------------ | ----------------------------------------------------------------------------- |
| `id`             | UUID               | Primary key (generated locally on client, synced to DB)                       |
| `tenant_id`      | UUID               | Multi-tenant isolation                                                        |
| `user_id`        | UUID               | The user who created the record                                               |
| `brand`          | Text               | E.g. "Apple", "Samsung"                                                       |
| `model`          | Text               | E.g. "iPhone 13 Pro"                                                          |
| `ram`            | Text               | E.g. "8GB"                                                                    |
| `storage`        | Text               | E.g. "256GB"                                                                  |
| `color`          | Text               | E.g. "Space Gray"                                                             |
| `imeis`          | Text[]             | Array of IMEI numbers (Last 4 digits shown in UI format e.g. `**XXXX`)        |
| `purchase_price` | Numeric            | The amount paid for the device (initially estimated, updated on confirmation) |
| `sale_price`     | Numeric (Nullable) | The amount the device was sold for                                            |
| `status`         | Text               | Enum: `PENDING` \| `IN_STOCK` \| `SOLD`                                       |
| `issue_tags`     | Text[]             | Tags describing device condition                                              |

### `ledger` Table

Tracks every financial movement. A ledger entry acts as an immutable journal line. Ledger entries are tied to specific phones via the `reference_id`.

| Column         | Type            | Description                                                      |
| -------------- | --------------- | ---------------------------------------------------------------- |
| `id`           | UUID            | Primary key                                                      |
| `type`         | Text            | Journal type (e.g. `PHONE_SALE`, `REPAIR_COST`, etc.)            |
| `reference_id` | UUID (Nullable) | Links the financial entry to a specific `phones.id`              |
| `amount`       | Numeric         | The financial value of the transaction                           |
| `note`         | Text (Nullable) | Human-readable note used primarily for `REPAIR_COST` descriptors |

---

## 🔄 2. State & Data Lifecycle Flow

The phone moves through three macro-states in its lifecycle, directly interacting with the ledger at each transition boundary.

### A. Acquisition Phase (`PENDING` Status)

_Triggered from: \`AddPhone.tsx\`_

- **Action:** User logs a phone they plan to buy. IMEI is _mandatory_ to accept into the system at this point.
- **Database:** Phone inserted with `status = 'PENDING'`.
- **Ledger Link:** A `FUNDS_PLEDGED` entry is created.
  - _Financial Impact:_ The system "escrows" the estimated purchase price. The wallet balance decreases immediately, preventing double-spending of expected capital.

### B. Fulfillment Phase (`IN_STOCK` Status)

_Triggered from: \`PhoneDetail.tsx\` (Confirm Purchase / Reject)_

**Path 1: Purchase Confirmed**

- User verifies condition and finalizes the negotiated price.
- **Database:** Phone `status` morphs to `IN_STOCK`. `purchase_price` updates to the final agreed value.
- **Ledger Link:**
  1. `FUNDS_RELEASED` entry created for the original pledged amount (cancels out the escrow).
  2. `FUNDS_CONSUMED` entry created for the actual final paid amount.

**Path 2: Unit Rejected**

- User decides not to buy the device.
- **Database:** Phone record is physically deleted from the `phones` table.
- **Ledger Link:** `FUNDS_RELEASED` entry is created to return the escrowed capital back to the digital wallet.

### C. Maintenance & Expenses (While `IN_STOCK`)

_Triggered from: \`PhoneDetail.tsx\` (Log Repair)_

- **Action:** Fixing a screen, replacing a battery, etc.
- **Database:** The `phones` table does _not_ mutate.
- **Ledger Link:** A `REPAIR_COST` entry is created with `reference_id` pointing to the phone, and the `note` field detailing the repair (e.g., "Screen Swap").
- **Financial Analytics:** The "Total Cost Basis" of a phone dynamically computes as `purchase_price + SUM(REPAIR_COST)`. Margins are always calculated against this true effective cost.

### D. Revenue Phase (`SOLD` Status)

_Triggered from: \`PhoneDetail.tsx\` (Mark as Sold)_

- **Action:** A customer purchases the device.
- **Database:** Phone `status` turns to `SOLD`, and `sale_price` is populated with the final revenue.
- **Ledger Link:** A `PHONE_SALE` entry is securely written to the ledger, pointing to the phone's ID.
  - _Financial Impact:_ Gross Sales spikes, net wallet balance rises, and profit tracking is realized.

---

## 📡 3. The Offline-First Sync Architecture

The architecture operates locally first (via Redux) and optimistic writes, falling straight back to an offline sync queue.

1. **Optimistic Updates:** The React UI dispatches directly to Redux (`inventory/addPhone`, `ledger/addEntry`).
2. **Middleware Intercept:** The custom `supabaseMiddleware` catches actions matching the tracked prefixes.
3. **Network Fork:**
   - _If offline:_ Action is serialized into the Redux `sync.outbox` queue.
   - _If online:_ Action is immediately shipped to Supabase (`supabaseApi.ts`).
4. **Resiliency:** If a user closes the app while offline in a tunnel with 3 un-synced phones and 2 logged repairs, Redux-Persist freezes the outbox locally. Upon the next reload under network connectivity, `OfflineSyncManager` loops the outbox and bulk-flushes the operations to Postgres.
