# 💳 Financial Ledger — Payment Mode Tracking
*Implemented: 2026-03-25*

## What Changed & Why

### The Problem Before This Change

StockFlow's ledger was an **operational ledger** — it tracked *what happened* (phone sold, funds consumed) but had **no idea how the money moved**. A completed sale for ₹50,000 could not tell you:

- How much was cash vs. UPI vs. bank transfer
- Whether a supplier was paid by cash or NEFT
- What your UPI float was on any given day

The `ledger.payment_mode` column existed in the database schema from Day 1, but **nothing in the application stack ever wrote to it or read from it.**

---

## The Fix — 5-Layer Change

### Layer 1: TypeScript Type (`ledger/types.ts`)

```diff
+ export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT";

  export interface LedgerEntry {
    id: string;
    type: LedgerEntryType;
    referenceId?: string;
    amount: number;
+   paymentMode?: PaymentMode;  // ← which channel this money moved through
    note?: string;
    createdAt: string;
  }
```

This is the single source of truth. Every other layer flows from this.

---

### Layer 2: Supabase Insert (`supabaseApi.ts`)

```diff
  await supabase.from("ledger").insert({
    type: payload.type,
    reference_id: finalReferenceId,
    amount: payload.amount,
+   payment_mode: payload.paymentMode ?? null,   // ← now persisted to DB
    note: payload.note ?? null,
    created_at: payload.createdAt,
  });
```

The DB column has a `CHECK` constraint matching the same four values — no migration needed.

---

### Layer 3: Data Hydration (`useOfflineSyncManager.ts`)

```diff
  ledgerData.map((e) => ({
    id: e.id,
    type: e.type,
    amount: Number(e.amount),
+   paymentMode: e.payment_mode ?? undefined,    // ← loaded back into Redux on app start
    note: e.note ?? undefined,
    createdAt: e.created_at,
  }))
```

Existing rows hydrate as `paymentMode = undefined` — treated as **legacy/unknown** in analytics queries. No data loss.

---

### Layer 4: PO Flow — Purchases (`AddPhoneUpdate.tsx`)

```diff
- const entries = [
-   { amount: cashPaid, label: "Cash" },
-   { amount: upiPaid, label: "UPI" },
+ const channels = [
+   { amount: cashPaid, label: "Cash", mode: "CASH" as const },
+   { amount: upiPaid, label: "UPI", mode: "UPI" as const },
+   { amount: bankPaid, label: "Bank Transfer", mode: "BANK_TRANSFER" as const },
  ].filter((e) => e.amount > 0);

- channels.forEach((e) => dispatch(addEntry({ type: "FUNDS_CONSUMED", amount: -e.amount, ... })));
+ channels.forEach((e) => dispatch(addEntry({ type: "FUNDS_CONSUMED", amount: -e.amount, paymentMode: e.mode, ... })));
```

---

### Layer 5: TO Flow — Sales (`CreateOrderSheet.tsx`)

Identical pattern to Layer 4 but with `type: "PHONE_SALE"` and positive amounts.

---

## Why One Row Per Channel — Not One Row With a Combined Mode

### The Old (bad) approach
```
Single TO row: paymentMode = "CASH", amount = 20000
-- Cannot see: 15000 was cash, 5000 was UPI
```

### The New (correct) approach
```
Ledger row 1: type=PHONE_SALE, paymentMode=CASH,  amount=15000, note="Cash — Customer X — TO:abc123"
Ledger row 2: type=PHONE_SALE, paymentMode=UPI,   amount=5000,  note="UPI — Customer X — TO:abc123"
```

Both rows share the same `note` reference (TO ID in the note string) so you can reconstruct the full transaction while also querying by channel independently.

---

## What You Can Now Query (for Charts)

```sql
-- 1. Incoming by payment mode (last 30 days)
SELECT payment_mode, SUM(amount) AS total_in
FROM ledger
WHERE tenant_id = $tenant_id
  AND type = 'PHONE_SALE'
  AND created_at > now() - interval '30 days'
GROUP BY payment_mode
ORDER BY total_in DESC;
-- Result: CASH=₹2.1L, UPI=₹80K, BANK_TRANSFER=₹1.4L

-- 2. Outgoing by payment mode
SELECT payment_mode, SUM(ABS(amount)) AS total_out
FROM ledger
WHERE tenant_id = $tenant_id
  AND type = 'FUNDS_CONSUMED'
  AND created_at > now() - interval '30 days'
GROUP BY payment_mode;
-- Result: CASH=₹1.8L, UPI=₹40K, BANK_TRANSFER=₹60K

-- 3. Net position per channel (your "float")
SELECT
  payment_mode,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_in,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS total_out,
  SUM(amount) AS net
FROM ledger
WHERE tenant_id = $tenant_id
GROUP BY payment_mode;
```

---

## Backward Compatibility

- **Existing ledger rows**: `payment_mode = NULL` in DB → hydrate as `undefined` in Redux
- **Analytics treatment**: `NULL` = legacy/unknown — filter with `WHERE payment_mode IS NOT NULL` for clean charts
- **No migration needed**: Column already existed, just filling it now

---

## Remaining Work (Future)

| Item | Priority | Notes |
|---|---|---|
| Suppress RPC's internal ledger write | Medium | `create_trade_order` inserts its own composite ledger row — pass `p_initial_payment = 0` from app or update RPC to accept channels array |
| Redux selector `selectLedgerByMode()` | Low | Derived selector for chart data, avoids repeated filtering |
| Chart component | When ready | Can now use any charting lib — data is clean and queryable |
| Avg settlement time by mode | Low | Join `sale_orders` → `customer_payments` on `payment_mode` |
