# Finventree — Feature Documentation

> Comprehensive reference of all features in Finventree (formerly StockFlow), the offline-first mobile app and web platform for electronics resellers and repair shops.
> **Last updated: 2026-05-16 · Version: v2.7**

---

## Platform Overview

| Platform | URL | Purpose |
| :--- | :--- | :--- |
| Mobile app | iOS App Store / Google Play | Primary user interface (Capacitor) |
| Web app | `app.finventree.com` | Browser-based access |
| Landing / Auth | `finventree.com` | Marketing, register, login, activate |
| Admin panel | `admin.finventree.com` | Internal admin supervision |

---

## Table of Contents

1. [Core Platform & Infrastructure](#1-core-platform--infrastructure)
2. [Inventory Management](#2-inventory-management)
3. [Financial Ledger & Watchtower](#3-financial-ledger--watchtower)
4. [Sales Orders](#4-sales-orders)
5. [Purchase Orders](#5-purchase-orders)
6. [Payments & Advance Credit](#6-payments--advance-credit)
7. [Customer Management](#7-customer-management)
8. [Trade Network](#8-trade-network)
9. [Billing & Subscriptions](#9-billing--subscriptions)
10. [Feature Gates](#10-feature-gates)
11. [Analytics & Reporting](#11-analytics--reporting)
12. [Multi-Tenancy & Team Management](#12-multi-tenancy--team-management)
13. [Notifications](#13-notifications)
14. [Sync Engine & Offline Support](#14-sync-engine--offline-support)
15. [Scanner & OCR](#15-scanner--ocr)
16. [Master Data & Device Catalog](#16-master-data--device-catalog)
17. [Export & Document Generation](#17-export--document-generation)
18. [UX, PWA & Native Features](#18-ux-pwa--native-features)
19. [Admin Panel](#19-admin-panel)
20. [Landing Site](#20-landing-site)
21. [Capacitor Compatibility Audit](#21-capacitor-compatibility-audit)

---

## 1. Core Platform & Infrastructure

### App Identity
- **App name**: Finventree · **Bundle ID**: `com.hyllos.finventree`
- Rebranded from StockFlow in May 2026.

### Progressive Web App (PWA)
- Installable on iOS and Android home screens via browser "Add to Home Screen".
- Service worker (`public/sw.js`) provides caching, instant updates, and offline shell.
- Stubbed/disabled in Capacitor native builds to prevent import crashes.
- Custom install prompts with cooldown logic for iOS and Android.

### Authentication
- Supabase-backed email magic-link authentication with PKCE flow.
- Deep link exchange on native: `com.hyllos.finventree://callback?code=…`
- Session persistence across app restarts (Redux/localforage).
- Password recovery flow.
- Invite-link signup for team members joining an existing tenant.
- Auth state managed via `AuthContext` with automatic session refresh.
- **App → web token handoff** — opening a web link from the app keeps the user logged in.
- Registration at `finventree.com/register`; login at `finventree.com/login`.

### Routing & Layout
- **HashRouter on native** (Capacitor serves files via `capacitor://`); BrowserRouter on web — detected at runtime.
- `AppLayout` wraps all authenticated pages (header, bottom nav, drawer).
- Protected route guards redirect unauthenticated users to `/login`.
- Key routes: `/`, `/inventory`, `/customers`, `/orders`, `/ledger`, `/purchase-orders`, `/analytics`, `/profile`, `/settings`, `/about`, `/connect/:code`.
- Public route: `/public/view/:token` for token-based order sharing.

### State Management
- Redux Toolkit for global state, dedicated slices per feature module.
- Redux Persist (IndexedDB via localforage) for local-first data storage.
- Supabase middleware for bi-directional sync.
- Outbox pattern for offline mutation queuing.

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
- Keyboard-accessible autocomplete dropdowns.

### Smart Search & Filtering
- Fuzzy search across all inventory fields (IMEI, brand, model, etc.).
- Filter by status, brand, date range.

### Phone Detail — Tabbed View
- **Details tab**: Specs, issues, IMEI list.
- **Finance tab**: Ledger entries linked to this device.
- **History tab**: Vertical timeline of purchase → repair → sale events.

### Phone Lifecycle Timeline
- Unified event history with timestamps.
- Share phone details via native share sheet (iOS/Android) or clipboard fallback.

### Soft Delete
- `deleted_at` column, hidden from list, filtered by RLS.

### Key Redux Actions
- `addPhone`, `updatePhone`, `removePhone`
- `addRepairLog`, `removeRepairLog`
- `setPhones` (bulk load from backend)

---

## 3. Financial Ledger & Watchtower

**Module:** `src/features/ledger/`
**Page:** Ledger

### Double-Entry Ledger
- Every financial event (purchase, sale, repair, refund, payment) recorded as a ledger entry.
- Each entry has: type, amount, direction (IN/OUT), payment mode, notes, timestamp, and user attribution.
- Entries are linked to their source transaction for full audit trails.

### The Watchtower Pattern
The Watchtower is the automated financial audit layer. It eliminates manual ledger entry creation by using Redux `extraReducers` as centralized listeners.

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

#### Design Principles
- **Zero leakage:** Every business event has a financial footprint in the ledger.
- **Standardized notes:** Semantic note pattern (e.g., `PURCHASE - #PO-001 : Samsung Galaxy S24`).
- **Idempotent:** Entries carry source IDs to prevent duplicates.
- **Payment mode tracking:** Cash, UPI, Bank Transfer, Credit tracked per entry.

### Ledger UI
- Chronological list grouped by date.
- Color-coded by type (green income, red expense, blue adjustments).
- Filterable by type, date range, and payment mode.

### Wallet Selectors
- `src/features/wallet/` computes aggregate balances, liens, profit, and withdrawals from ledger entries.
- Powers the dashboard wallet card and financial summaries.

---

## 4. Sales Orders

**Module:** `src/features/billing/`
**Page:** Orders

### Order Lifecycle
- Create sale orders linking phones to customers with pricing, discounts, and payment terms.
- Status flow: `DRAFT` → `CONFIRMED` → `PAID` / `PARTIAL` / `OVERDUE` / `CANCELLED`.
- Status transitions strictly enforced in the reducer.

### Edit & Cancel
- **Edit sale order** — modify items and prices via `EditSaleOrderSheet`.
- **Cancel** — soft delete (status → CANCELLED).

### Invoice PDF
- **Web**: `window.print()` with styled print layout (selectable text).
- **Native**: `@capacitor/filesystem` + `@capacitor/share` PDF.
- Rejected items section included on PO PDFs.

### Public Share Links
- HMAC-signed token, 30-day expiry, `PublicView` page accessible without login.

### Inter-Tenant TRANSFER Orders
- Auto-detected when customer is a linked Trade Network tenant.
- Status banner and sync in OrderDetail.

### Key Redux Actions
- `addOrder`, `setOrders`, `updateOrderPayment`, `returnOrder`

---

## 5. Purchase Orders

**Module:** `src/features/purchasing/`
**Page:** Purchase Orders

### Order Lifecycle
- Create POs for supplier stock intake with item-level detail.
- Track intake, inspection, acceptance, and rejection per item.

### Per-Item Inspection States
- **ACCEPTED** (green badge)
- **REJECTED** (red badge) — triggers refund-due ledger entry
- **PENDING** (amber badge)
- Rejection states preserved across edit sessions.

### Edit & Cancel
- Full edit via `EditPurchaseOrderSheet` (visually aligned with `BatchAddSheet` style).
- Soft delete / cancel.

### PO Certification
- Atomic certification marks items as received.

### Supplier Payment Management
- Record payments against POs (partial or full).
- Bulk supplier settlement via `addSupplierSettlement`.
- Multi-PO allocation via `SupplierAllocationSheet`.

### Key Redux Actions
- `addPurchaseOrder`, `setPurchaseOrders`
- `updatePOPayment`, `markPOItemRejected`
- `addSupplierSettlement`

---

## 6. Payments & Advance Credit

### Record Payment
- Amount, payment mode (cash/bank/UPI), reference note, date.

### Multi-Order Allocation
- `PaymentAllocationSheet` splits one payment across multiple orders.

### Advance Credit System *(new)*
- Overpayment stored as credit against the customer.
- Credit auto-applied to the next order for that customer.
- Credit balance visible in customer detail and order sheets.

### AR / AP Selectors
- Selectors compute outstanding receivables per customer and payables per supplier.
- Aging analysis available in analytics.

---

## 7. Customer Management

**Module:** `src/features/customers/`
**Page:** Customers, Customer Detail

### Customer List
- Colour-coded type bar (WHOLESALER amber, CUSTOMER blue, RETAILER violet, PLATFORM teal).
- Shows AR balance, order count, linked tenant badge.
- Live fuzzy search by name and phone number.
- Filter by type.

### Customer Types
`WHOLESALER`, `CUSTOMER`, `RETAILER`, `PLATFORM`

### Customer Detail
- AR balance and full order history.
- Phone number with direct call link.
- Link/unlink Finventree tenant (Trade Network).
- Share customer public link.

### Edit & Delete
- Edit name, phone, type, address.
- Soft delete with confirmation modal (`deleted_at`, RLS-filtered).

### CustomerPicker
- Smart picker with verified badge + `linkedTenantName` for linked counterparties.

### Key Redux Actions
- `addCustomer`, `updateCustomer`, `removeCustomer`
- `addCustomerPayment`, `addCustomerSettlement`

---

## 8. Trade Network

### 8a. Business Identity
- **Trade Code** — unique 6-char code (base-32: A-Z, 2-9) per tenant, visible on Profile.
- **Copy trade code** — `@capacitor/clipboard` on native, `navigator.clipboard` on web.
- **Share connect link** — `https://finventree.app/connect/{CODE}` via `@capacitor/share` / `navigator.share`.
- **Profile QR code** — `QRCodeSVG` encoding `com.hyllos.finventree://connect/{CODE}`.

### 8b. QR Connect — Business Discovery
- **In-app QR scanner** (`QrScannerModal`):
  - Full-screen rear-camera overlay.
  - `BrowserQRCodeReader` from `@zxing/browser` (QR-only hints, fast).
  - Accepts: `com.hyllos.finventree://connect/{CODE}`, `https://finventree.app/connect/{CODE}`, raw 6-char codes.
  - Viewfinder overlay with animated scan line, corner brackets.
  - Haptic feedback on decode.
  - "Type code manually" fallback button.
- **QR FAB on Customers page** — violet button opens scanner.
- **Scan button in ConnectSheet** — ScanLine icon next to code input.
- **Generic QR scanner support** — any phone camera app can scan the Profile QR and deep-link into the app.

### 8c. ConnectSheet — Mutual Counterparty Creation
- Trade code lookup → business name (green verified banner).
- Relationship type picker: Supplier/Wholesaler, Customer/Buyer, Retailer/Peer.
- `connect_by_trade_code` DB RPC — creates counterparty on **both** sides simultaneously (SECURITY DEFINER).
- Idempotency — "Already connected" toast if link exists.
- Self-connect blocked server-side.
- Dispatches `addCustomer` to Redux immediately on success.

### 8d. Deep Link Handling
- **Native**: `com.hyllos.finventree://connect/{CODE}` → `window.location.hash = '#/customers?connect={CODE}'`.
- **Web route**: `/connect/:code` → `ConnectRedirect` → `/customers?connect={CODE}`.
- **Auto-open ConnectSheet** when `?connect=` query param present on Customers page.

### 8e. Inter-Tenant Transfers
- **LinkTenantSheet** — link a customer to a tenant via trade code lookup.
- **TRANSFER order type** — auto-detected in `CreateOrderSheet` for linked counterparties; calls `createTransfer` RPC.
- **Transfer status banner** in OrderDetail.
- **`syncTransferStatus` action** — pulls latest state from remote.

---

## 9. Billing & Subscriptions

- **Plans**: Free, Growth, Pro, Enterprise.
- **Razorpay recurring subscriptions**:
  - `razorpay-create-subscription` Edge Function.
  - `razorpay-webhook` Edge Function (HMAC signature-verified).
  - `razorpay-cancel-subscription` Edge Function.
- **Checkout**: `@capacitor/browser` on native; `window.open()` on web.
- **Pricing page** — tier cards with feature comparison table.
- **Upgrade modal** — triggered by feature gates; shows locked feature highlight.

---

## 10. Feature Gates

- **Hybrid gating**: hide mode (feature invisible) or badge mode (feature visible with lock badge overlay).
- **Badge mode pointer intercept** — CSS overlay blocks inner button without JS hacking.
- **Hard-enforced gates**:
  - Device cap — max devices per plan.
  - Seat limit — max team members per plan.
  - Receivables/credit gate — requires paid plan.
  - Trade Network — requires paid plan.
- **`FeatureGate` component** — wraps any UI element with gating logic.
- **`TrialExpiredPaywall`** — blocks access after trial ends; links to pricing.
- **6-month trial** — admin can grant to any tenant from admin panel.

---

## 11. Analytics & Reporting

**Module:** `src/features/analytics/`
**Page:** Analytics, Dashboard

### Derived Metrics
All analytics computed from local Redux state using `reselect` selectors — no separate API calls.

- **Cashflow analysis:** Daily/weekly/monthly cash in vs. cash out.
- **Inventory metrics:** Stock count, value, aging, turnover.
- **Payment distribution:** Breakdown by payment mode.
- **Credit aging:** Outstanding receivables by age bucket.
- **Model velocity:** Which phone models sell fastest.
- **Revenue & profit trends:** Time-series charting via Recharts.

### Dashboard
- Wallet card: available balance, locked capital, total profit.
- Inventory summary (in stock, sold, pending).
- Recent activity feed.

### PostHog Integration *(new)*
- User session recording and event tracking.
- Dev-mode gating — events not fired on `localhost`.
- Safe first-party proxy.
- Custom events: order created, payment recorded, phone scanned, connect initiated, etc.
- Beta feature usage tracking.

---

## 12. Multi-Tenancy & Team Management

**Module:** `src/features/tenant/`
**Page:** Manage Team, Profile

### Tenant Isolation
- Every record scoped to `tenant_id`.
- Supabase RLS enforces strict isolation at the database level.
- All mutations via SECURITY DEFINER RPCs — no direct table writes from the client.

### Staff Roles (RBAC)

| Role | Permissions |
|---|---|
| Super Admin | Full platform access across tenants |
| Admin | Full access within their tenant |
| Manager | Most operations except tenant settings |
| Associate | Limited to day-to-day operations |

### Team Operations
- Invite team members via shareable invite links; copy via `@capacitor/clipboard` / `navigator.clipboard`.
- Role assignment and management.
- Seat limit enforcement triggers upgrade gate.

---

## 13. Notifications

**Schema:** `docs/schemas/002_notifications_schema.sql`

### System Notifications
- Real-time bell icon popover (`NotificationsPopover`) showing unread/read notifications.
- Persistent notification history.

### Push Notifications
- **Native** (`@capacitor/push-notifications`): FCM (Android) and APNs (iOS) token registration, stored in `user_push_subscriptions`.
- **Web** (PWA): Service Worker + VAPID key push subscription.
- Toggle in Settings page.

### Notification Types
- `CONNECTION_ACCEPTED` — when a Trade Network connect is established.
- Database triggers fire notifications on key events.

---

## 14. Sync Engine & Offline Support

**Module:** `src/features/sync/`

### Offline-First Architecture
- All data stored locally via Redux Persist (IndexedDB).
- App fully functional without internet connectivity.
- Changes queued in outbox when offline.

### Sync Outbox
- Failed/offline actions stored in `outbox[]` with retry metadata.
- Up to 3 retry attempts, then removed with error toast.
- Actions replayed in order when connectivity resumes.

### Connectivity Detection
- **Native**: `@capacitor/network` for reliable detection.
- **Web**: `navigator.onLine` + window events.
- `isOnline` state managed in `src/features/sync/slice`.

### Bi-Directional Sync
- **Local → Cloud**: Supabase middleware intercepts Redux actions and syncs to backend.
- **Cloud → Local**: On load or reconnect, latest data fetched and merged.

---

## 15. Scanner & OCR

**Components:** `src/components/ImeiScannerModal.tsx`, `src/components/shared/QrScannerModal.tsx`
**Utils:** `src/utils/ocrService.ts`, `src/utils/scannerUtils.ts`

### IMEI Scanner
- Full-screen camera overlay, rear-facing camera, auto-focus.
- **Barcode**: ZXing `BrowserMultiFormatReader` (primary path, fast).
- **OCR fallback**: Tesseract.js singleton worker for printed/engraved IMEIs.
- Adaptive thresholding + sharpen preprocessing for low-light/damaged labels.
- Hardware zoom, torch/flash toggle, exposure control.
- Zero-blink HUD via Passive Ref pattern (direct DOM updates — no React re-renders at 60fps).
- Luhn checksum validation on decoded result.
- Haptic success feedback.

### QR Scanner *(new)*
- `QrScannerModal` — simpler full-screen overlay.
- `BrowserQRCodeReader` with QR-only hints (faster than multi-format).
- No preprocessing needed — QR codes are high-contrast.
- Accepts `finventree://connect/{CODE}`, `finventree.app/connect/{CODE}`, or raw 6-char trade codes.
- Animated viewfinder, haptics, "Type manually" fallback.

---

## 16. Master Data & Device Catalog

**Module:** `src/features/masterData/`
**Data:** `src/data/deviceCatalog.ts`, `src/data/deviceMappings.ts`

### Global Device Catalog
- Pre-seeded database of 200+ phone models with specs (RAM, storage, colors).
- `useDeviceCatalog` hook loads and caches catalog data.

### Master Data Categories
- **Brands**: Apple, Samsung, OnePlus, Xiaomi, etc.
- **Models**: Per-brand model lists with spec sheets.
- **RAM / Storage options**: Standardized value lists.
- **Colors**: Per-model color options.
- **Issue tags**: Cracked screen, water damage, battery, etc.
- **Repair catalog**: Common repair types and costs.

### Catalog Autocomplete
- Keyboard-accessible dropdowns for brand → model → specs.
- Fuzzy matching for quick selection.

---

## 17. Export & Document Generation

**Utils:** `src/utils/export.ts`, `src/utils/generateInvoice.tsx`, `src/utils/generatePurchaseOrderPDF.tsx`

### Excel Export
- One-click XLSX export for ledger entries and inventory data.
- Customizable date range and filters.

### Invoice PDF
- **Web**: `window.print()` with styled React-rendered print layout (selectable text).
- **Native**: `generateInvoicePDF` via `@capacitor/filesystem` + `@capacitor/share`.

### Purchase Order PDF
- Includes supplier details, item list, inspection summary, rejected items section.

### Public Share Links
- Token-based public URLs via `shareService.ts` (HMAC-signed, 30-day expiry).
- `PublicView` page — accessible without authentication.

---

## 18. UX, PWA & Native Features

### Theming
- Light, dark, and system-auto themes.
- `ThemeContext` syncs theme to `@capacitor/status-bar` background + style.
- `@capacitor/keyboard` style syncs to keyboard appearance (light/dark).

### Mobile-Optimized Navigation
- Bottom navigation bar for primary screens.
- Swipe-to-close app drawer.
- Keyboard scroll-into-view via `useKeyboard` hook on native.

### Haptic Feedback
- `useHaptics` hook: success, error, warning patterns via `@capacitor/haptics`.

### Splash Screen
- Branded loading screen, 2s duration, `@capacitor/splash-screen`.
- Smooth animation, no native logo warping.

### Safe Areas
- Edge-to-edge header using `pt-safe-area-inset-top`.
- Bottom nav uses `pb-safe-area-inset-bottom`.
- No double-inset issues.

### Install Prompts
- `IosInstallPrompt` for Safari users.
- Android PWA install banner with cooldown logic.

### Desktop UI
- Responsive sidebar layout on `md+` screens for `app.finventree.com`.

---

## 19. Admin Panel

**URL:** `admin.finventree.com`
**Stack:** Next.js static export on Cloudflare Pages

- **Supervision dashboard** — all tenants, plan, trial status, last active.
- **Trial management** — extend trial (6-month grant), suspend/reactivate tenants.
- **Plan assignment** — manually set tier per tenant.
- **Feature flags** — toggle individual features per tenant.
- **Analytics page** — PostHog proxy charts.
- **Audit log** — user action history, searchable.
- **Revenue page** — subscription revenue charts.
- **Health page** — DB, Edge Function, and latency status.
- **IMEI lookup** — search any IMEI across all tenants.
- **Overdue orders** — list past-due orders across all tenants.
- **Share links** — manage/revoke public share tokens.
- **Funnel analysis** — signup → paid conversion funnel.

---

## 20. Landing Site

**URL:** `finventree.com`
**Stack:** Next.js static export on Cloudflare Pages

- **Marketing landing page** — product highlights, pricing CTA.
- `/register` — new account creation.
- `/login` — sign in with magic link.
- `/activate` — email verification.
- `/join/:token` — team invite acceptance.
- `/status` — app operational status.
- Google Search Console verification.

---

## 21. Capacitor Compatibility Audit

### ✅ Correctly Handled

| Feature | How |
| :--- | :--- |
| Print / PDF | `Capacitor.isNativePlatform()` → native PDF gen; web → `window.print()` |
| External URLs | `@capacitor/browser` on native; `window.open` on web |
| Clipboard | `@capacitor/clipboard` on native; `navigator.clipboard` on web |
| Share | `@capacitor/share` on native; `navigator.share` / clipboard on web |
| Router | `HashRouter` on native (detected at runtime); `BrowserRouter` on web |
| Network detection | `@capacitor/network` on native; `navigator.onLine` on web |
| Status bar theme | `@capacitor/status-bar` `setBackgroundColor` + `setStyle` on theme change |
| Keyboard | `@capacitor/keyboard` scroll-into-view + style sync |
| Push notifications | `@capacitor/push-notifications` on native; VAPID/Service Worker on web |
| Deep links | `com.hyllos.finventree://` registered in `Info.plist` and `AndroidManifest.xml` |
| Camera | `navigator.mediaDevices.getUserMedia()` — works in Capacitor WebView |
| PWA service worker | Stubbed with `virtual:pwa-register` in native builds |
| Upgrade / pricing URL | `@capacitor/browser` on native; `window.open` on web |

### Native Capabilities Table

| Feature | Plugin | iOS | Android |
| :--- | :--- | :---: | :---: |
| Deep links (auth + connect) | `@capacitor/app` | ✓ | ✓ |
| Clipboard | `@capacitor/clipboard` | ✓ | ✓ |
| Native share sheet | `@capacitor/share` | ✓ | ✓ |
| External browser | `@capacitor/browser` | ✓ | ✓ |
| PDF filesystem | `@capacitor/filesystem` | ✓ | ✓ |
| Push notifications | `@capacitor/push-notifications` | ✓ (APNs) | ✓ (FCM) |
| Haptic feedback | `@capacitor/haptics` | ✓ | ✓ |
| Keyboard management | `@capacitor/keyboard` | ✓ | ✓ |
| Network status | `@capacitor/network` | ✓ | ✓ |
| Persistent preferences | `@capacitor/preferences` | ✓ | ✓ |
| Splash screen | `@capacitor/splash-screen` | ✓ | ✓ |
| Status bar | `@capacitor/status-bar` | ✓ | ✓ |
| Camera (getUserMedia) | Web API in WebView | ✓ | ✓ |
| Barcode / QR scanning | `@zxing/browser` in WebView | ✓ | ✓ |
| OCR | Tesseract.js in WebView | ✓ | ✓ |

### ⚠️ Known Issues

| Issue | Severity | Notes |
| :--- | :--- | :--- |
| `window.print()` in `PublicView.tsx` — no Capacitor guard | Low | Acceptable — public links are web-only URLs, not opened via native app |
| `ConnectRedirect` reads `window.location.pathname` | Low | Acceptable — `/connect/:code` is a web-only route; native uses deep link handler in `main.tsx` |

---

## Technical Patterns

| Pattern | Description | Used In |
|---|---|---|
| **Watchtower** | Automated ledger entries via Redux `extraReducers` listeners | Ledger slice |
| **Passive Ref** | Direct DOM updates bypassing React for 60fps scanner HUD | IMEI Scanner modal |
| **Outbox Queue** | Offline action queue with retry logic | Sync engine |
| **Selector Composition** | `reselect` memoized selectors for derived analytics | Analytics, Wallet |
| **RLS Isolation** | Supabase Row-Level Security for multi-tenant data safety | All tables |
| **SECURITY DEFINER RPCs** | All mutations via server-side RPCs; no direct client table writes | Trade Network, Transfers |
| **Type Inversion** | If I call you X, you call me Y — mirror relationship types on connect | ConnectSheet |

---

*Last updated: May 2026*
