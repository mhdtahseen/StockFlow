# StockFlow — Feature Documentation

> Comprehensive reference of all features in StockFlow, the offline-first PWA for mobile phone resellers and repair shops.

---

## Table of Contents

1. [Core Platform & Infrastructure](#1-core-platform--infrastructure)
2. [Inventory Management](#2-inventory-management)
3. [Financial Ledger & Watchtower](#3-financial-ledger--watchtower)
4. [Billing & Sales Orders](#4-billing--sales-orders)
5. [Purchasing & Purchase Orders](#5-purchasing--purchase-orders)
6. [Customer Management](#6-customer-management)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [Multi-Tenancy & Team Management](#8-multi-tenancy--team-management)
9. [Notifications](#9-notifications)
10. [Sync Engine & Offline Support](#10-sync-engine--offline-support)
11. [Scanner & OCR](#11-scanner--ocr)
12. [Master Data & Device Catalog](#12-master-data--device-catalog)
13. [Export & Document Generation](#13-export--document-generation)
14. [UX & PWA Features](#14-ux--pwa-features)
15. [Planned / Roadmap Features](#15-planned--roadmap-features)

---

## 1. Core Platform & Infrastructure

### Progressive Web App (PWA)

- Installable on iOS and Android home screens via browser "Add to Home Screen".
- Service worker (`public/sw.js`) provides caching, instant updates, and offline shell.
- Custom install prompts with cooldown logic for iOS and Android.

### Authentication

- Supabase-backed email/password authentication.
- Session persistence across app restarts.
- Password recovery flow.
- Invite-link signup for team members joining an existing tenant.
- Auth state managed via `AuthContext` with automatic session refresh.

### Routing & Layout

- React Router with protected route guards.
- `AppLayout` wraps all authenticated pages (header, bottom nav, drawer).
- Key routes: `/`, `/inventory`, `/customers`, `/orders`, `/ledger`, `/purchase-orders`, `/analytics`, `/profile`, `/settings`, `/about`.
- Admin routes for approvals, supervision, catalog management.
- Public route (`/public/view/:token`) for token-based order sharing.

### State Management

- Redux Toolkit for global state, with dedicated slices per feature module.
- Redux Persist (IndexedDB) for local-first data storage.
- TanStack Query for server-state and cache management.
- Supabase middleware for bi-directional sync.

---

## 2. Inventory Management

**Module:** `src/features/inventory/`  
**Pages:** Inventory list, Add/Edit Phone, Phone Detail

### Phone Tracking

- Each phone is tracked by IMEI(s), brand, model, storage, RAM, color, grade, and status.
- Statuses: `IN_STOCK`, `SOLD`, `PENDING`, `RETURNED`.
- Full traceability — every phone links to its purchase order (source) and sale order (destination).

### Multi-Row IMEI Engine

- Supports dual-SIM devices with multiple IMEI slots.
- Real-time Luhn checksum validation prevents entry errors.
- IMEI sanitization and formatting utilities (`src/utils/validateImei.ts`).

### Repair Logs

- Track repairs performed on each device (issue, cost, date, notes).
- Repair costs are automatically logged to the financial ledger via the Watchtower.

### Predictive Spec Autofill

- When a brand/model is selected, specs (RAM, storage, colors) are auto-filled from the device catalog.
- Keyboard-accessible autocomplete dropdowns for brands, models, and colors.

### Smart Search & Filtering

- Fuzzy search across all inventory fields (IMEI, brand, model, etc.).
- Filter by status, brand, date range.
- High-performance list rendering with badges and timestamps.

### Key Redux Actions

- `addPhone`, `updatePhone`, `removePhone`
- `addRepairLog`, `removeRepairLog`
- `setPhones` (bulk load from backend)

---

## 3. Financial Ledger & Watchtower

**Module:** `src/features/ledger/`  
**Page:** Ledger  
**Components:** `src/components/ledger/LedgerComponents.tsx`

### Double-Entry Ledger

- Every financial event (purchase, sale, repair, refund, payment) is recorded as a ledger entry.
- Each entry has: type, amount, direction (IN/OUT), payment mode, notes, timestamp, and user attribution.
- Entries are linked to their source transaction (order ID, phone ID, customer ID) for full audit trails.

### The Watchtower Pattern

The Watchtower is StockFlow's automated financial audit layer. It eliminates manual ledger entry creation by using Redux `extraReducers` as centralized listeners.

#### How It Works

1. A business action is dispatched (e.g., `addOrder`, `addPurchaseOrder`, `addRepairLog`).
2. The ledger slice's `extraReducers` detect the action.
3. A standardized ledger entry is automatically created with full metadata.
4. No UI component ever calls `addEntry` directly for business events.

#### Actions Watched by the Watchtower

| Business Event | Redux Action | Ledger Entry Type | Direction |
|---|---|---|---|
| Purchase Order created | `addPurchaseOrder` | `SUPPLIER_PAYMENT` + `EXPENSE` | OUT |
| PO mid-term payment | `updatePOPayment` | `SUPPLIER_PAYMENT` | OUT |
| PO item rejected | `markPOItemRejected` | `SUPPLIER_PAYMENT` (refund due) | IN |
| Supplier bulk settlement | `addSupplierSettlement` | `SUPPLIER_PAYMENT` | OUT |
| Sale Order created | `addOrder` | `CUSTOMER_PAYMENT` + `DEBT_PLEDGED` | IN |
| Sale returned | `returnOrder` | `CUSTOMER_PAYMENT` (refund) | OUT |
| Customer payment received | `addCustomerPayment` | `CUSTOMER_PAYMENT` | IN |
| Customer debt settled | `addCustomerSettlement` | `DEBT_SETTLEMENT` + `ADVANCE_RECEIVED` | IN |
| Repair logged | `addRepairLog` | `REPAIR_COST` | OUT |
| Phone price adjusted | `updatePhone` | `INVENTORY_ADJUSTMENT` | varies |
| Phone removed | `removePhone` | Voids all related entries | — |

#### Design Principles

- **Zero leakage:** Every business event has a financial footprint in the ledger.
- **Standardized notes:** Every entry follows a semantic note pattern (e.g., `PURCHASE - #PO-001 : Samsung Galaxy S24`) for auditability.
- **Idempotent:** Entries carry source IDs to prevent duplicates.
- **Payment mode tracking:** Cash, UPI, Bank Transfer, Credit are tracked per entry.

#### Flow Diagram

```
User Action → Redux Action Dispatch
                    ↓
         Ledger Slice (extraReducers)
                    ↓
         Watchtower Listener Matches Action
                    ↓
         Creates Standardized Ledger Entry
                    ↓
         Entry Added to pendingEntries[]
                    ↓
         Supabase Middleware Syncs to Backend
```

### Ledger UI

- Chronological list of all entries, grouped by date.
- Color-coded by type (green for income, red for expense, blue for adjustments).
- Icons per transaction type.
- Filterable by type, date range, and payment mode.

### Wallet Selectors

- `src/features/wallet/` computes aggregate balances, liens, profit, and withdrawals from ledger entries.
- Powers the dashboard wallet card and financial summaries.

---

## 4. Billing & Sales Orders

**Module:** `src/features/billing/`  
**Page:** Orders

### Sales Order Lifecycle

- Create sale orders linking phones to customers with pricing, discounts, and payment terms.
- Order statuses: `OPEN` → `PARTIAL` → `SETTLED` → `RETURNED`.
- Status transitions are strictly enforced in the reducer.

### Payment Tracking

- Multi-payment mode support: Cash, UPI, Bank Transfer, Credit.
- Partial payments tracked — balance auto-computed.
- Payment events auto-logged to ledger via Watchtower.

### Returns & Refunds

- Full return flow with `returnOrder` action.
- Refund ledger entries created automatically.
- Phone status reverted to `IN_STOCK` on return.

### Key Redux Actions

- `addOrder`, `setOrders`, `updateOrderPayment`, `returnOrder`

### AR (Accounts Receivable)

- Selectors compute outstanding receivables per customer.
- Aging analysis available in analytics.

---

## 5. Purchasing & Purchase Orders

**Module:** `src/features/purchasing/`  
**Page:** Purchase Orders

### Purchase Order Lifecycle

- Create POs for supplier stock intake with item-level detail.
- Track intake, inspection, acceptance, and rejection per item.
- Rejected items trigger refund-due ledger entries.

### Supplier Payment Management

- Record payments against POs (partial or full).
- Bulk supplier settlement via `addSupplierSettlement`.
- All payments auto-logged to ledger.

### Key Redux Actions

- `addPurchaseOrder`, `setPurchaseOrders`
- `updatePOPayment`, `markPOItemRejected`
- `addSupplierSettlement`

### AP (Accounts Payable)

- Selectors compute outstanding payables per supplier.
- Reconciliation engine adjusts for price changes and returns.

---

## 6. Customer Management

**Module:** `src/features/customers/`  
**Page:** Customers, Customer Detail

### Customer CRM

- Store customer details: name, phone, email, address, notes.
- Track purchase history and warranty receipts.
- Identify frequent buyers.

### Payment & Settlement

- Record direct customer payments against outstanding balances.
- FIFO settlement logic — payments allocated across oldest orders first.
- Settlement and advance tracking.

### Key Redux Actions

- `addCustomer`, `updateCustomer`, `removeCustomer`
- `addCustomerPayment`, `addCustomerSettlement`

---

## 7. Analytics & Reporting

**Module:** `src/features/analytics/`  
**Page:** Analytics, Dashboard

### Derived Metrics

All analytics are computed from local Redux state using `reselect` selectors — no separate API calls.

- **Cashflow analysis:** Daily/weekly/monthly cash in vs. cash out.
- **Inventory metrics:** Stock count, value, aging, turnover.
- **Payment distribution:** Breakdown by payment mode.
- **Credit aging:** Outstanding receivables by age bucket.
- **Model velocity:** Which phone models sell fastest.
- **Revenue & profit trends:** Time-series charting via Recharts.

### Dashboard

- Wallet card showing available balance, locked capital, and total profit.
- Quick-glance inventory summary (in stock, sold, pending).
- Recent activity feed.

### Financial Reports

- Daily/EOD reports with opening and closing balances.
- Profit/loss per day or date range.
- `useFinancialMetrics` hook aggregates data for display.

---

## 8. Multi-Tenancy & Team Management

**Module:** `src/features/tenant/`  
**Page:** Manage Team, Profile

### Tenant Isolation

- Every data record is scoped to a tenant via `tenant_id`.
- Supabase Row-Level Security (RLS) enforces strict isolation at the database level.
- Users cannot access data from other tenants, even with direct API calls.

### Staff Roles (RBAC)

| Role | Permissions |
|---|---|
| Super Admin | Full platform access across tenants |
| Admin | Full access within their tenant |
| Manager | Most operations except tenant settings |
| Associate | Limited to day-to-day operations (inventory, sales) |

### Team Operations

- Invite team members via shareable invite links.
- Role assignment and management.
- Tenant feature/bug/support request tracking (`tenant_requests` table).

---

## 9. Notifications

**Schema:** `docs/schemas/002_notifications_schema.sql`

### System Notifications

- Real-time bell icon popover showing unread/read notifications.
- Persistent notification history.

### Postgres-Triggered Alerts

- Database triggers fire notifications on key events (e.g., associate makes a sale → admin notified).
- RLS ensures users only see their own tenant's notifications.

### Push Notifications

- Browser push notification registration via `usePushNotifications` hook.
- Supabase Edge Functions handle delivery.

---

## 10. Sync Engine & Offline Support

**Module:** `src/features/sync/`  
**Middleware:** `src/app/supabaseMiddleware.ts`

### Offline-First Architecture

- All data is stored locally via Redux Persist (IndexedDB).
- The app is fully functional without internet connectivity.
- Changes are queued in an outbox when offline.

### Sync Outbox

- Failed or offline actions are stored in `outbox[]` with retry metadata.
- Exponential backoff on retry failures.
- Actions are replayed in order when connectivity resumes.

### Bi-Directional Sync

- **Local → Cloud:** Supabase middleware intercepts Redux actions and syncs to the backend.
- **Cloud → Local:** On app load or reconnect, latest data is fetched and merged into local state.
- Conflict resolution ensures data integrity.

### Online/Offline Detection

- `isOnline` state tracks connectivity.
- `useOfflineSyncManager` hook manages sync lifecycle.

---

## 11. Scanner & OCR

**Components:** `src/components/ImeiScannerModal.tsx`  
**Utils:** `src/utils/ocrService.ts`, `src/utils/scannerUtils.ts`

### Live Camera Barcode Scanner

- High-speed IMEI and barcode scanning using ZXing library.
- Supports rear camera with auto-focus for mobile devices.

### OCR (Optical Character Recognition)

- Tesseract.js singleton worker for reading printed/engraved IMEIs.
- Adaptive thresholding and image preprocessing for low-light or damaged labels.
- Zero-blink HUD using the Passive Ref pattern (updates DOM directly without React re-renders for 60fps performance).

### Scanner UX

- Full-screen modal with real-time viewfinder.
- Scanned IMEI auto-populates the phone entry form.
- Visual and haptic feedback on successful scan.

---

## 12. Master Data & Device Catalog

**Module:** `src/features/masterData/`  
**Data:** `src/data/deviceCatalog.ts`, `src/data/deviceMappings.ts`

### Global Device Catalog

- Pre-seeded database of 200+ phone models with specs (RAM, storage, colors).
- Sourced from Supabase and supplemented with local defaults.
- `useDeviceCatalog` hook loads and caches catalog data.

### Master Data Categories

- **Brands:** Apple, Samsung, OnePlus, Xiaomi, etc.
- **Models:** Per-brand model lists with spec sheets.
- **RAM / Storage options:** Standardized value lists.
- **Colors:** Per-model color options.
- **Issue tags:** Cracked screen, water damage, battery, etc. (`src/data/issueCatalog.ts`).
- **Repair catalog:** Common repair types and costs (`src/data/repairCatalog.ts`).

### Catalog Autocomplete

- Keyboard-accessible dropdowns for brand → model → specs.
- Fuzzy matching for quick selection.

---

## 13. Export & Document Generation

**Utils:** `src/utils/export.ts`, `src/utils/generateInvoice.tsx`, `src/utils/generatePurchaseOrderPDF.tsx`  
**Components:** `src/components/shared/ExportModal`

### Excel Export

- One-click XLSX export for ledger entries and inventory data.
- Customizable date range and filters.

### PDF Invoice Generation

- Renders sale order invoices as styled React components.
- Converts to PDF via html2canvas + jsPDF.
- Includes business details, line items, totals, and payment info.

### Purchase Order PDF

- Renders POs as printable documents.
- Includes supplier details, item list, and payment terms.

### Public Share Links

- Generate token-based public URLs for orders via `shareService.ts`.
- Recipients can view order details without authentication.

---

## 14. UX & PWA Features

### Theming

- Light, dark, and system-auto themes.
- Theme preference persisted in localStorage.
- Managed via `ThemeContext`.

### Mobile-Optimized Navigation

- Bottom navigation bar for primary screens.
- Swipe-to-close app drawer with overscroll protection.
- Intelligent keyboard management — prevents mobile keyboard from blocking inputs.

### Haptic Feedback

- `useHaptics` hook triggers device vibration on key actions (scan success, button press).

### Splash Screen

- Branded loading screen (`SplashScreen.tsx`) during initial app bootstrap.
- `AppGate` controls access until auth and data are ready.

### Install Prompts

- Custom install banners for iOS and Android.
- Cooldown logic to avoid prompt fatigue.

---

## 15. Planned / Roadmap Features

These features are documented in the codebase or design docs but are not yet fully implemented:

| Feature | Description | Status |
|---|---|---|
| Razorpay Checkout | Online payment collection from customers | Planned |
| Receipt Printer Integration | Bluetooth/WebUSB thermal printer support | Planned |
| Tax & Margin Calculators | Dynamic VAT/tax deduction at checkout | Planned |
| Skeleton Loading States | Placeholder UI during slow data loads | Planned |
| Page Transition Animations | Framer Motion route transitions | Planned |
| Pull-to-Refresh | Native gesture for data refresh | Planned |
| Advanced Analytics | Deeper cashflow and profitability analysis | In Progress |
| Role-Based UI Gating | Hide/show UI elements based on staff role | Partial |
| Wallet Module Refactor | Consolidate wallet/transaction logic | Planned |

---

## Technical Patterns

| Pattern | Description | Used In |
|---|---|---|
| **Watchtower** | Automated ledger entries via Redux `extraReducers` listeners | Ledger slice |
| **Passive Ref** | Direct DOM updates bypassing React for 60fps scanner HUD | Scanner modal |
| **Outbox Queue** | Offline action queue with exponential backoff retry | Sync engine |
| **Selector Composition** | `reselect` memoized selectors for derived analytics | Analytics, Wallet |
| **RLS Isolation** | Supabase Row-Level Security for multi-tenant data safety | All tables |

---

*Last updated: May 2026*
