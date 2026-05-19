# GST Implementation

Optional GST support for sale and purchase invoices. GST is toggled per-order, not globally, and is only available when the tenant's own GSTIN is configured in their profile. Each order carries a **pricing mode** — **Inclusive** (price already includes GST, back-calculate taxable value) or **Exclusive** (price is pre-tax, add GST on top). The mode defaults to Inclusive (standard Indian retail MRP model) and is user-selectable via a segmented toggle on every order creation form.

---

## Table of Contents

1. [Business Rules](#business-rules)
2. [Architecture Overview](#architecture-overview)
3. [File Map](#file-map)
4. [Data Model](#data-model)
5. [Calculation Logic](#calculation-logic)
6. [UI Flows](#ui-flows)
7. [Invoice Rendering](#invoice-rendering)
8. [Sync Layer](#sync-layer)
9. [Database Migration](#database-migration)
10. [Known Enhancements](#known-enhancements)

---

## Business Rules

| Rule | Detail |
|---|---|
| **Opt-in per order** | GST toggle appears on CreateOrderSheet, BatchAddSheet, AddPhoneUpdate, and AddPhone — only when `tenant.gstin` is set |
| **Pricing mode** | **Inclusive** (default): price contains GST — `taxable = price / (1 + rate/100)`. **Exclusive**: price is pre-tax — `taxable = price`, `total = price × (1 + rate/100)`. Selectable per order via Inclusive/Exclusive toggle |
| **Default rate** | 18% — correct for mobile handsets (HSN 8517) |
| **Default HSN code** | 8517 — telephones / mobile handsets |
| **Intra-state** | CGST (9%) + SGST (9%) — when seller and buyer are in the same state |
| **Inter-state** | IGST (18%) — when seller and buyer are in different states |
| **State detection** | Derived from first 2 digits of GSTIN (e.g. `27` = Maharashtra). Falls back to CGST+SGST when buyer GSTIN is absent or invalid |
| **Buyer GSTIN** | Optional — entered at order creation or pre-filled from customer record. Required for B2B inter-state IGST |
| **Purchase orders** | GST toggle available on all three PO creation forms (BatchAddSheet, AddPhoneUpdate, AddPhone). Toggle defaults off — opt-in only. Useful for recording input tax credit |

---

## Architecture Overview

```
User toggles GST on CreateOrderSheet / BatchAddSheet / AddPhoneUpdate / AddPhone
        │
        ▼
calculateOrderGst()  ←──  gstCalc.ts (pure functions)
        │
        ▼
Redux: addOrder / addPurchaseOrder dispatch
  ├── Order.gstEnabled = true
  ├── Order.gstInclusive (true = inclusive, false = exclusive)
  ├── Order.gstType, gstRate, subtotal, cgst/sgst/igstAmount
  ├── Order.buyerGstin (sale) or sellerGstin (purchase)
  └── OrderItem.hsnCode, gstRate, taxableValue, cgst/sgst/igstAmount
        │
        ▼
supabaseApi.ts
  └── create_trade_order / create_purchase_order RPC  ← GST params passed directly (atomic)
        ├── p_gst_enabled, p_gst_inclusive, p_gst_type, p_gst_rate
        ├── p_subtotal, p_cgst_amount, p_sgst_amount, p_igst_amount
        ├── p_buyer_gstin (sale) / p_seller_gstin (purchase)
        └── p_items JSON now includes hsn_code, gst_rate, taxable_value,
                                         cgst_amount, sgst_amount, igst_amount per item
        │
        ├──► OrderDetail.tsx
        │     └── GST breakdown card (taxable value, CGST+SGST or IGST, counterparty GSTIN)
        │     └── INCLUSIVE / EXCLUSIVE badge + dynamic total label
        │
        └──► PrintableInvoice.tsx
              ├── Shows Subtotal (taxable value)
              ├── CGST + SGST rows  OR  single IGST row
              ├── Grand Total (= original totalAmount including tax)
              └── Buyer GSTIN in "Bill To" block
```

---

## File Map

| File | Role |
|---|---|
| `apps/app/src/utils/gstCalc.ts` | Pure calculation functions — no React dependencies |
| `apps/app/src/features/billing/types.ts` | `SaleOrder` + `OrderItem` GST fields |
| `apps/app/src/features/purchasing/types.ts` | `PurchaseOrder` + `PurchaseOrderItem` GST fields |
| `apps/app/src/features/customers/types.ts` | `Customer.gstin` + `Customer.state` |
| `apps/app/src/components/shared/CreateOrderSheet.tsx` | Sale order GST toggle UI + live breakdown preview |
| `apps/app/src/components/shared/BatchAddSheet.tsx` | Batch PO GST toggle with Supplier GSTIN input + live breakdown |
| `apps/app/src/pages/AddPhoneUpdate.tsx` | Bulk ingest PO GST toggle + per-item GST spread |
| `apps/app/src/pages/AddPhone.tsx` | Single-device PO GST toggle (shown when supplier selected) |
| `apps/app/src/pages/OrderDetail.tsx` | Inline GST breakdown card on order detail view |
| `apps/app/src/components/shared/PrintableInvoice.tsx` | Invoice rendering with conditional GST rows |
| `apps/app/src/components/shared/CustomerEditSheet.tsx` | GSTIN field on customer edit form |
| `apps/app/src/components/ui/CustomerPicker.tsx` | GSTIN field in quick-create customer form |
| `apps/app/src/app/supabaseApi.ts` | Passes all GST params atomically to RPCs; item-level GST in `p_items` JSON |
| `apps/app/src/app/useOfflineSyncManager.ts` | Hydrates GST fields when loading orders + customers |
| `supabase/migrations/20260519_gst_fields.sql` | Adds all nullable GST columns to DB tables |
| `supabase/migrations/20260520_gst_atomic_inclusive.sql` | Adds `gst_inclusive` column; rewrites both RPCs to accept GST params atomically + item-level GST extraction |

---

## Data Model

### `SaleOrder` (billing/types.ts)

```ts
gstEnabled?:   boolean              // false by default
gstInclusive?: boolean             // true = price includes GST (default); false = price is pre-tax
gstType?:      "CGST_SGST" | "IGST"
gstRate?:      number               // e.g. 18
subtotal?:     number               // sum of taxable values (pre-tax)
cgstAmount?:   number               // 0 when IGST
sgstAmount?:   number               // 0 when IGST
igstAmount?:   number               // 0 when CGST_SGST
buyerGstin?:   string               // buyer GSTIN for B2B invoices
```

### `OrderItem` (billing/types.ts)

```ts
hsnCode?:      string   // e.g. "8517"
gstRate?:      number   // per-item rate (same as order rate)
taxableValue?: number   // effectivePrice / (1 + rate/100)
cgstAmount?:   number
sgstAmount?:   number
igstAmount?:   number
```

### `PurchaseOrder` (purchasing/types.ts)

Same GST fields as `SaleOrder` (including `gstInclusive?`), except `sellerGstin?` instead of `buyerGstin?`.

### `Customer` (customers/types.ts)

```ts
gstin?: string   // Business GSTIN — pre-fills buyerGstin on order creation
state?: string   // State name — fallback when no GSTIN for IGST detection
```

---

## Calculation Logic

### `utils/gstCalc.ts`

#### `isValidGstin(gstin: string): boolean`
Validates the full 15-character Indian GSTIN format using regex:
```
^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
```

#### `extractStateCode(gstin: string): string`
Returns the first 2 characters (state code) from a GSTIN.

#### `determineGstType(sellerGstin, buyerGstin?, buyerState?): "CGST_SGST" | "IGST"`
- Extracts state codes from both GSTINs
- Returns `"IGST"` when seller state ≠ buyer state
- Falls back to `"CGST_SGST"` when buyer GSTIN is absent or invalid

#### `calculateGst(amount, rate, type, inclusive): GstBreakdown`
Core calculation for a single price. The `inclusive` boolean controls pricing mode:
```ts
// Inclusive (default — MRP contains GST):
taxableValue = amount / (1 + rate/100)
taxAmount    = amount - taxableValue

// Exclusive (price is pre-tax):
taxableValue = amount
taxAmount    = amount * rate/100

// CGST_SGST split:
cgstAmount = sgstAmount = taxAmount / 2

// IGST (no split):
igstAmount = taxAmount
```

#### `calculateOrderGst(effectivePrices[], rate, type, inclusive)`
Aggregates `calculateGst` across all items. Returns:
```ts
{ subtotal, cgstTotal, sgstTotal, igstTotal, grandTotal }
```

---

## UI Flows

### Sale Order Creation (`CreateOrderSheet.tsx`)

The GST toggle section is rendered **between the Devices list and Fiscal Settlement sections**, and only when `tenant?.gstin` is set.

**Toggle off (default):**
- No tax fields on submitted order

**Toggle on:**
1. Switch turns green — shows `"18% inclusive · HSN 8517 · CGST + SGST"` (subtitle updates dynamically when mode or type changes)
2. **Inclusive / Exclusive segmented toggle** appears — two-pill selector, defaults to Inclusive
3. Optional buyer GSTIN input field:
   - Auto-uppercased
   - Green checkmark when valid (15-char + regex)
   - Amber warning when 15 chars but invalid format
   - Inter-state/intra-state badge updates live as GSTIN is typed
4. Live tax breakdown preview:
   - Subtotal (taxable value)
   - CGST (9%) + SGST (9%)  **or**  IGST (18%)
   - **"Total (incl. tax)"** label when Inclusive; **"Total + Tax"** when Exclusive

**On submit**, the following are written to the order:
```ts
gstEnabled:   true
gstInclusive: true | false          // user-selected pricing mode
gstType:      "CGST_SGST" | "IGST"
gstRate:      18
subtotal:     <sum of taxable values>
cgstAmount:   <aggregate CGST>
sgstAmount:   <aggregate SGST>
igstAmount:   <aggregate IGST>
buyerGstin:   <entered GSTIN or customer.gstin>

// Per item:
hsnCode:      "8517"
gstRate:      18
taxableValue: <per-item taxable value>
cgstAmount:   <item CGST>
sgstAmount:   <item SGST>
igstAmount:   <item IGST>
```

### Purchase Order Creation (BatchAddSheet, AddPhoneUpdate, AddPhone)

GST toggle is available on all three purchase order creation forms. Behaviour is identical to sale orders:

- Toggle is hidden unless `tenant?.gstin` is set
- Toggle defaults **off** — always opt-in
- **Inclusive / Exclusive segmented toggle** identical to sale order forms
- `sellerGstin` input (Supplier GSTIN) appears when toggled on — pre-fills from `supplier.gstin` if set
- Tax type badge shows **Inter-state → IGST** or **Intra-state → CGST + SGST** based on comparing tenant GSTIN state code vs supplier GSTIN state code
- Live breakdown shows taxable value, tax lines, and grand total with dynamic label ("Total (incl. tax)" / "Total + Tax")
- On submit, `gstEnabled`, `gstInclusive`, `gstType`, `gstRate`, `subtotal`, `cgstAmount`, `sgstAmount`, `igstAmount`, `sellerGstin` are spread onto the PO; each item gets `hsnCode`, `gstRate`, `taxableValue`, per-item `cgst/sgst/igstAmount`

> **AddPhone only:** the GST section is additionally gated on `selectedSupplier !== null`, since there is no PO without a supplier.

### Customer GSTIN

**CustomerEditSheet:** GSTIN input on the edit form (optional, auto-uppercase). Graduated validation: amber "GSTIN must be 15 characters" when length ≠ 15; amber "Invalid GSTIN format" when 15 chars but fails regex; no blocking — save is always allowed.

**CustomerPicker (quick-create):** Same graduated validation on the GSTIN field in the Advanced section.

When a customer with a saved GSTIN is selected on `CreateOrderSheet`, the buyer GSTIN field is pre-filled from `customer.gstin` automatically.

### OrderDetail GST Breakdown (`OrderDetail.tsx`)

When `order.gstEnabled` is true, a **GST Breakdown card** is rendered below the master summary (Total / Paid / Outstanding) and above the Core Actions buttons:

```
┌─────────────────────────────────────────────────┐
│  🧾  GST BREAKDOWN              [INCLUSIVE]      │  ← or [EXCLUSIVE] badge
│  Taxable Value              ₹XX,XXX.XX           │
│  CGST (9%)                  ₹X,XXX.XX            │  ← or IGST (18%)
│  SGST (9%)                  ₹X,XXX.XX            │
│  ────────────────────────────────────────────  │
│  Total (incl. GST)          ₹XX,XXX.XX           │  ← or "Total + GST" when Exclusive
│  Supplier GSTIN   27AAACR5055K1ZF                │  ← when present
└─────────────────────────────────────────────────┘
```

- **INCLUSIVE** (emerald badge) or **EXCLUSIVE** (blue badge) shown in card header based on `order.gstInclusive !== false`
- Total label is dynamic: `"Total (incl. GST)"` when inclusive, `"Total + GST"` when exclusive
- Shows `Supplier GSTIN` for purchase orders, `Buyer GSTIN` for sale orders
- IGST variant shows a single IGST row instead of CGST + SGST

---

## Invoice Rendering

`PrintableInvoice.tsx` is the **single invoice component** used across all PDF generation paths:

| Path | Trigger |
|---|---|
| Single invoice (web) | OrderDetail → "Download Invoice" → `printDocument.tsx` → `window.open()` → `window.print()` |
| Single invoice (native) | Same → html2canvas → jsPDF → `@capacitor/share` |
| Bulk combined (web) | BulkInvoiceSheet → `bulkInvoice.tsx` → `window.open()` → `window.print()` |
| Bulk individual ZIP (web) | BulkInvoiceSheet → html2canvas per order → jsPDF → fflate → browser download |
| Bulk ZIP (native) | Same → fflate → `@capacitor/filesystem` + `@capacitor/share` |
| Public share link | `PublicView.tsx` — read-only browser render |

### GST rendering logic in `PrintableInvoice.tsx`

```
Line items table:
  GST% column → order.gstRate + "%" when gstEnabled, else "0%"

Totals section:
  Subtotal row → order.subtotal (taxable) when gstEnabled, else order.totalAmount
  
  Tax rows (only when gstEnabled):
    CGST_SGST → two rows: CGST (9%) + SGST (9%)
    IGST      → one row:  IGST (18%)
  
  Grand Total → always order.totalAmount (= taxable + tax)

Bill To block:
  GSTIN line → shown below phone when order.buyerGstin exists

Seller header:
  GSTIN shown inline with address/phone when tenant.gstin exists
```

---

## Sync Layer

### Writing to Supabase (`supabaseApi.ts`)

GST data is passed **atomically inside the RPC call** — no follow-up UPDATE. Both RPCs accept optional GST params (all `DEFAULT NULL` / `DEFAULT FALSE`), so existing callers without GST are unaffected.

**`create_trade_order` (sale orders) — additional params:**
```sql
p_gst_enabled   BOOLEAN  DEFAULT FALSE
p_gst_inclusive BOOLEAN  DEFAULT TRUE
p_gst_type      TEXT     DEFAULT NULL
p_gst_rate      NUMERIC  DEFAULT NULL
p_subtotal      NUMERIC  DEFAULT NULL
p_cgst_amount   NUMERIC  DEFAULT NULL
p_sgst_amount   NUMERIC  DEFAULT NULL
p_igst_amount   NUMERIC  DEFAULT NULL
p_buyer_gstin   TEXT     DEFAULT NULL
```

**`create_purchase_order` (purchase orders) — same, with `p_seller_gstin` instead of `p_buyer_gstin`.**

The RPC body does an atomic `UPDATE ... WHERE id = p_order_id` inside the same transaction when `p_gst_enabled` is true.

**Item-level GST** is written via the existing `p_items` JSON array. Each item object now includes:
```json
{ "hsn_code": "8517", "gst_rate": 18, "taxable_value": ..., "cgst_amount": ..., "sgst_amount": ..., "igst_amount": ... }
```
The RPC extracts these keys per item during the INSERT loop (via `COALESCE`), so item-level GST data is fully persisted in the same transaction.

Customer `gstin` and `state` are included in the standard `INSERT`/`UPDATE` on the `counterparties` table.

### Reading from Supabase (`useOfflineSyncManager.ts`)

All GST fields are mapped during the 90-day hydration fetch:

**Sale orders:**
```ts
gstEnabled:   o.gst_enabled   ?? false
gstInclusive: o.gst_inclusive ?? undefined
gstType:      o.gst_type      ?? undefined
gstRate:      o.gst_rate      ?? undefined
subtotal:     o.subtotal      ?? undefined
cgstAmount:   o.cgst_amount   ?? undefined
sgstAmount:   o.sgst_amount   ?? undefined
igstAmount:   o.igst_amount   ?? undefined
buyerGstin:   o.buyer_gstin   ?? undefined
```

**Purchase orders:** same, with `sellerGstin: o.seller_gstin ?? undefined`.

**Customers (counterparties):**
```ts
gstin: c.gstin ?? undefined
state: c.state ?? undefined
```

---

## Database Migration

### `20260519_gst_fields.sql`

Adds all nullable GST columns — existing rows fully unaffected.

| Table | Columns Added |
|---|---|
| `sale_orders` | `gst_enabled`, `gst_type`, `gst_rate`, `subtotal`, `cgst_amount`, `sgst_amount`, `igst_amount`, `buyer_gstin` |
| `sale_order_items` | `hsn_code`, `gst_rate`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount` |
| `purchase_orders` | `gst_enabled`, `gst_type`, `gst_rate`, `subtotal`, `cgst_amount`, `sgst_amount`, `igst_amount`, `seller_gstin` |
| `purchase_order_items` | `hsn_code`, `gst_rate`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount` |
| `customers` | `gstin`, `state` |

`gst_type` has a `CHECK` constraint: `('CGST_SGST', 'IGST')`.

### `20260520_gst_atomic_inclusive.sql`

| Table | Change |
|---|---|
| `sale_orders` | `gst_inclusive BOOLEAN DEFAULT TRUE` added |
| `purchase_orders` | `gst_inclusive BOOLEAN DEFAULT TRUE` added |
| `public.create_trade_order(...)` | Rewritten — accepts 9 optional GST params; atomic UPDATE + item-level GST extraction inside single transaction |
| `public.create_purchase_order(...)` | Rewritten — same pattern with `p_seller_gstin` |

---

## Known Enhancements

| Enhancement | Priority | Notes |
|---|---|---|
| **`customer.state` fallback in `determineGstType`** | Low | When a buyer has no GSTIN, `customer.state` (free-text) could be used to infer inter-state — `CreateOrderSheet` doesn't pass it yet |
| **Per-item HSN code customization** | Very Low | All phones default to 8517 — only relevant if non-phone inventory is added |
| **Invoice template for Exclusive pricing** | Very Low | `PrintableInvoice.tsx` currently assumes inclusive totals — line item prices should be shown as pre-tax when `gstInclusive` is false |
