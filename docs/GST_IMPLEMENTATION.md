# GST Implementation

Optional GST support for sale and purchase invoices. Tax is **tax-inclusive** (MRP already contains GST — standard Indian retail model). GST is toggled per-order, not globally, and is only available when the tenant's own GSTIN is configured in their profile.

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
| **Opt-in per order** | GST toggle appears on the CreateOrderSheet only when `tenant.gstin` is set |
| **Tax-inclusive pricing** | MRP already includes GST — taxable value is back-calculated: `taxable = price / (1 + rate/100)` |
| **Default rate** | 18% — correct for mobile handsets (HSN 8517) |
| **Default HSN code** | 8517 — telephones / mobile handsets |
| **Intra-state** | CGST (9%) + SGST (9%) — when seller and buyer are in the same state |
| **Inter-state** | IGST (18%) — when seller and buyer are in different states |
| **State detection** | Derived from first 2 digits of GSTIN (e.g. `27` = Maharashtra). Falls back to CGST+SGST when buyer GSTIN is absent or invalid |
| **Buyer GSTIN** | Optional — entered at order creation or pre-filled from customer record. Required for B2B inter-state IGST |
| **Purchase orders** | GST fields stored on PurchaseOrder for input tax credit tracking — no creation UI yet (see [Known Enhancements](#known-enhancements)) |

---

## Architecture Overview

```
User toggles GST on CreateOrderSheet
        │
        ▼
calculateOrderGst()  ←──  gstCalc.ts (pure functions)
        │
        ▼
Redux: addOrder dispatch
  ├── SaleOrder.gstEnabled = true
  ├── SaleOrder.gstType, gstRate, subtotal, cgst/sgst/igstAmount
  ├── SaleOrder.buyerGstin
  └── OrderItem.hsnCode, gstRate, taxableValue, cgst/sgst/igstAmount
        │
        ▼
supabaseApi.ts
  ├── create_trade_order RPC  (creates order + items — no GST params)
  └── UPDATE sale_orders SET gst_enabled, gst_type, ...  (follow-up if gstEnabled)
        │
        ▼
PrintableInvoice.tsx
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
| `apps/app/src/components/shared/CreateOrderSheet.tsx` | GST toggle UI + live breakdown preview |
| `apps/app/src/components/shared/PrintableInvoice.tsx` | Invoice rendering with conditional GST rows |
| `apps/app/src/components/shared/CustomerEditSheet.tsx` | GSTIN field on customer edit form |
| `apps/app/src/components/ui/CustomerPicker.tsx` | GSTIN field in quick-create customer form |
| `apps/app/src/app/supabaseApi.ts` | Persists GST fields to Supabase after order creation |
| `apps/app/src/app/useOfflineSyncManager.ts` | Hydrates GST fields when loading orders + customers |
| `supabase/migrations/20260519_gst_fields.sql` | Adds all nullable GST columns to DB tables |

---

## Data Model

### `SaleOrder` (billing/types.ts)

```ts
gstEnabled?:  boolean              // false by default
gstType?:     "CGST_SGST" | "IGST"
gstRate?:     number               // e.g. 18
subtotal?:    number               // sum of taxable values (pre-tax)
cgstAmount?:  number               // 0 when IGST
sgstAmount?:  number               // 0 when IGST
igstAmount?:  number               // 0 when CGST_SGST
buyerGstin?:  string               // buyer GSTIN for B2B invoices
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

Same GST fields as `SaleOrder`, except `sellerGstin?` instead of `buyerGstin?`.

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
Core calculation for a single price:
```ts
// Tax-inclusive (MRP contains GST):
taxableValue = amount / (1 + rate/100)
taxAmount    = taxableValue * rate/100

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
1. Switch turns green — shows "18% inclusive · HSN 8517 · CGST + SGST / IGST"
2. Optional buyer GSTIN input field appears:
   - Auto-uppercased
   - Green checkmark when valid (15-char + regex)
   - Red warning when 15 chars but invalid format
   - Inter-state/intra-state badge updates live as GSTIN is typed
3. Live tax breakdown preview:
   - Subtotal (taxable value)
   - CGST (9%) + SGST (9%)  **or**  IGST (18%)
   - Grand Total

**On submit**, the following are written to the order:
```ts
gstEnabled: true
gstType:    "CGST_SGST" | "IGST"
gstRate:    18
subtotal:   <sum of back-calculated taxable values>
cgstAmount: <aggregate CGST>
sgstAmount: <aggregate SGST>
igstAmount: <aggregate IGST>
buyerGstin: <entered GSTIN or customer.gstin>

// Per item:
hsnCode:      "8517"
gstRate:      18
taxableValue: <item effectivePrice / 1.18>
cgstAmount:   <item CGST>
sgstAmount:   <item SGST>
igstAmount:   <item IGST>
```

### Customer GSTIN

**CustomerEditSheet:** GSTIN input added to the edit form (optional, auto-uppercase, 15-char validation warning).

**CustomerPicker (quick-create):** GSTIN field added to the Advanced section alongside Address/Aadhaar.

When a customer with a saved GSTIN is selected on `CreateOrderSheet`, the buyer GSTIN field is pre-filled from `customer.gstin` automatically.

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

The `create_trade_order` and `create_purchase_order` Postgres RPCs do not accept GST parameters. A follow-up direct `UPDATE` is performed after each RPC when `gstEnabled` is true:

```ts
// billing/addOrder
if (payload.gstEnabled) {
  await supabase.from("sale_orders").update({
    gst_enabled, gst_type, gst_rate, subtotal,
    cgst_amount, sgst_amount, igst_amount, buyer_gstin
  }).eq("id", payload.id);
}

// purchasing/addPurchaseOrder
if (payload.gstEnabled) {
  await supabase.from("purchase_orders").update({
    gst_enabled, gst_type, gst_rate, subtotal,
    cgst_amount, sgst_amount, igst_amount, seller_gstin
  }).eq("id", payload.id);
}
```

Customer `gstin` and `state` are included in the standard `INSERT`/`UPDATE` on the `counterparties` table.

### Reading from Supabase (`useOfflineSyncManager.ts`)

All GST fields are mapped during the 90-day hydration fetch:

**Sale orders:**
```ts
gstEnabled: o.gst_enabled ?? false
gstType:    o.gst_type ?? undefined
gstRate:    o.gst_rate ?? undefined
subtotal:   o.subtotal ?? undefined
cgstAmount: o.cgst_amount ?? undefined
sgstAmount: o.sgst_amount ?? undefined
igstAmount: o.igst_amount ?? undefined
buyerGstin: o.buyer_gstin ?? undefined
```

**Purchase orders:** same, with `sellerGstin: o.seller_gstin ?? undefined`.

**Customers (counterparties):**
```ts
gstin: c.gstin ?? undefined
state: c.state ?? undefined
```

---

## Database Migration

`supabase/migrations/20260519_gst_fields.sql`

All columns are **nullable** — existing rows are fully unaffected.

| Table | Columns Added |
|---|---|
| `sale_orders` | `gst_enabled`, `gst_type`, `gst_rate`, `subtotal`, `cgst_amount`, `sgst_amount`, `igst_amount`, `buyer_gstin` |
| `sale_order_items` | `hsn_code`, `gst_rate`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount` |
| `purchase_orders` | `gst_enabled`, `gst_type`, `gst_rate`, `subtotal`, `cgst_amount`, `sgst_amount`, `igst_amount`, `seller_gstin` |
| `purchase_order_items` | `hsn_code`, `gst_rate`, `taxable_value`, `cgst_amount`, `sgst_amount`, `igst_amount` |
| `customers` | `gstin`, `state` |

`gst_type` has a `CHECK` constraint: `('CGST_SGST', 'IGST')`.

---

## Known Enhancements

| Enhancement | Priority | Notes |
|---|---|---|
| **GST toggle on Purchase Orders** (AddPhone, AddPhoneUpdate, BatchAddSheet) | Medium | Purchase orders can carry GST for input tax credit — no creation UI yet |
| **`customer.state` fallback in `determineGstType`** | Low | When a buyer has no GSTIN, `customer.state` (free-text) could be used to infer inter-state — `CreateOrderSheet` doesn't pass it yet |
| **Full GSTIN regex validation in CustomerEditSheet** | Low | Currently only warns on length ≠ 15; doesn't call `isValidGstin()` for format check |
| **GST breakdown on OrderDetail page** | Low | Tax summary is only visible on the invoice, not inline on the order detail view |
| **Per-item HSN code customization** | Very Low | All phones default to 8517 — only relevant if non-phone inventory is added |
| **Item-level GST persistence to DB** | Very Low | `sale_order_items.cgst_amount` etc. are stored in Redux but not written to Supabase (order-level aggregates are sufficient for invoicing) |
