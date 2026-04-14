# StockFlow MVP 2 — Phases 1-5 Technical Summary

This document summarizes the technical implementation, architectural decisions, and feature flows for Phases 1 through 5 of the StockFlow MVP 2 development.

## 🏗️ Phase 1: Database & RLS (Foundation)
Implemented the core relational structure for high-volume trade.
- **Tables**: `sale_orders`, `order_items`, `purchase_orders`, `counterparties` (Customers/Suppliers), `customer_payments`.
- **Atomic Operations (RPCs)**:
    - `handle_sale_order`: Single transaction to create order, mark items as SOLD, and record ledger entries.
    - `handle_customer_payment`: Handles lump-sum payments and allocates them across multiple outstanding orders.
- **Row Level Security (RLS)**: Strictly enforced at the `tenant_id` level, ensuring data isolation and preventing multi-tenant leakages.

## 🔄 Phase 2: Redux & Offline Sync (State)
Built an "Offline-First" state management system.
- **Slices**: `billing`, `purchasing`, `customers`, and `tenant`.
- **Middleware**: A custom `supabaseMiddleware` that intercepts all trackable actions (`inventory/`, `ledger/`, `billing/`, etc.).
- **Sync Logic**: 
    - Online: Immediate sync to Supabase.
    - Offline: Actions queued in a persistent Redux outbox.
    - Reconnection: Automatic background sync of queued actions.
- **Rule 1 Enforcement**: Every single database write (including tenant info) flows through Redux to ensure syncability.

## 🎨 Phase 3: Design System & Navigation
Refreshed the UI to match the "Premium Professional" aesthetic.
- **Tailwind System**: Configured `primary-500` aliases (replacing raw hex codes like `#064a98`) for consistent branding.
- **Navigation**: Implemented `AppDrawer` for desktop and `BottomNav` for mobile.
- **Feature Gates**: `usePlan` hook and `FeatureGate` components to restrict access based on subscription status (pre-Phase 6).

## 💰 Phase 4: Core Business Flows
The engine of the application.
- **Sales Flow**: Supports individual Retail Sales and multi-phone Bulk/Wholesale Sales. Automates inventory depletion.
- **Purchasing Flow**: Managed via `purchase_orders`. Tracks expected inventory.
- **Financials**: The "Banker's View". Tracks wallet balance, money in/out, and ledger history.
- **Customer CRM**: Inline creation during checkout. Detailed tabs for Order History, Payment History, and Statements.

## 📄 Phase 5: PDF & Reporting
Professional reporting and financial auditing.
- **Invoice Generator**: High-fidelity PDF generation using `jspdf`.
    - Features: Branding, itemization, per-item discounts, and outstanding balance highlighting (#BA7517 Amber).
    - **Native Share**: Integrated Web Share API for mobile-first sharing.
- **Financial Status Cards**: Integrated EOD (End of Day) reconciliation, AR (Receivables), and AP (Payables) summaries on the Financials page.

---

## 🚦 Feature Flows & Interaction Logic

### 1. Sale Order Creation
- **Interaction**: User selects phones from Inventory (single or bulk) → `CreateOrderSheet` → Select/Create Customer → Dispatch `handleSaleOrder`.
- **Edge Cases Handled**:
    - **Duplicate IMEI**: Prevented by inventory status checks.
    - **Offline Create**: Order ID is generated client-side; syncs as a single RPC call upon reconnection.
    - **Discount Leakage**: Discounts are applied per line item but tallied in the order total for accounting.

### 2. Lump-Sum Payment Allocation
- **Interaction**: `RecordPaymentSheet` → Enter total amount → View list of outstanding orders → Allocation across orders → Dispatch `handleCustomerPayment`.
- **Edge Cases Handled**:
    - **Over-allocation**: Payment amount cannot exceed total outstanding.
    - **Mixed Status**: Correctly handles orders being "PARTIAL" vs "SETTLED".
    - **Unallocated Balance**: Funds are tracked in the ledger even if they exceed current order totals (future credit).

### 3. Inventory Reconciliation
- **Interaction**: Every sale/return updates the `inventory` slice and triggers a `ledger` entry.
- **Edge Cases Handled**:
    - **Sale Cancellation**: Returns phone to `IN_STOCK` and creates a reversingledger entry.
    - **Bulk Out-of-Sync**: If someone else sells a phone in the cloud, the local sync will gracefully fail or rebase (Phase 7 focus).

### 4. Financial Auditing (EOD)
- **Interaction**: Financials page calculates: `Opening Balance = Current Wallet - Today's Income + Today's Expenses`.
- **Edge Cases Handled**:
    - **Midnight Roll**: Uses `date-fns` to ensure "Today" is tenant-relative.
    - **Manual Top-ups**: Distinct from sales to avoid skewing "Sales Income" metrics.

---

## 📦 Test Data: 10 Valid IMEIs (Luhn Compliant)
Use these for testing inventory entry and checkout flows:

1. `353000-00-000000-3`
2. `353000-00-000001-1`
3. `353000-00-000002-9`
4. `353000-00-000003-7`
5. `353000-00-000004-5`
6. `353000-00-000005-2`
7. `353000-00-000006-0`
8. `353000-00-000007-8`
9. `353000-00-000008-6`
10. `353000-00-000009-4`

_Note: Hyphens are for readability; input raw digits into the system._
