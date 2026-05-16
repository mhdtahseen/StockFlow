# Finventree — Release Updates Log

> Changes shipped between **9 May 2026 – 16 May 2026**.
> All work is on branch `chore/monorepo-setup`.

---

## 16 May 2026

### Auth — Full Registration Flow on finventree.com
**Commits:** (current)

- **`apps/web` activate page** (`finventree.com/activate`): After the user sets their password, the page calls the `auth-handoff` Edge Function to mint a one-time cross-domain session token.
- **Two-button success screen**: "Open Web App" navigates to `app.finventree.com/auth/handoff?token_hash=...` — user lands on the dashboard already signed in. "Open in App" opens the native app via `com.hyllos.finventree://callback?token_hash=...` — also lands directly in the dashboard.
- **`AuthHandoff.tsx`** (new page at `/auth/handoff` in `apps/app`): Receives the handoff token, calls `supabase.auth.verifyOtp()` to establish a session on the `app.finventree.com` domain, then redirects to `/`. Shows loading → success → error states.
- **`main.tsx` native deep link**: Extended `appUrlOpen` to handle `token_hash` param — calls `supabase.auth.verifyOtp()` directly in the native app and navigates home.
- **`apps/web` supabase client**: Added `flowType: 'pkce'` for correct PKCE invite token exchange.
- **No more "log in again"**: The cross-domain session ferry means a user who activates on `finventree.com` is immediately authenticated on `app.finventree.com` and in the native app — zero extra login steps.

---

### Feature Gates — Gap Fixes
**Commit:** `6e99b05`

- **Trade Network deep-link bypass fixed**: `?connect=` query param on the Customers page now checks `canUse("trade_network")` before opening ConnectSheet — previously a free-plan user could bypass the gate via a deep link URL.
- **PDF Invoice secondary button gated**: The "Document" button in the OrderDetail core actions row was missing a `FeatureGate pdf_invoice` wrapper (the identical button in the header was gated, this one wasn't). Now consistent.
- **Excel export gated**: "Export Financial ledgers" button in Settings wrapped with `FeatureGate full_ledger` — free users now see the upgrade prompt.

---

### Bug Fixes
**Commit:** `6e99b05`

- **`useKeyboard.ts`**: Was calling `Keyboard.removeAllListeners()` in cleanup, which nuked all Capacitor internal keyboard listeners and caused extra keyboard state churn. Now only removes the specific `keyboardWillShow` listener this hook registered.
- **`posthog.ts`**: Fixed `sample_rate` → `sampleRate` typo (TypeScript compile error).
- **`TrialExpiredPaywall.tsx`**: Added missing `Link` (react-router-dom) and `Mail` (lucide-react) imports (TypeScript compile error).

---

### Branding / Copy
**Commit:** `6e99b05`

- `ConnectSheet.tsx`: Cleaned up input placeholder (`"e.g. AB3K7Z"` → `"AB3K7Z"`).
- `LinkTenantSheet.tsx`: Updated in-sheet copy: "StockFlow" → "Finventree", "Settings" → "Profile" (trade code is now displayed on Profile, not Settings).

---

### Trade Network — QR Connect (in-app scanner)
**Commits:** `7114843`, `1fa6340`

- **QrScannerModal**: Full-screen camera overlay using `@zxing/browser` `BrowserQRCodeReader`. Continuous rear-camera decode, QR-only hints for speed. Parses three QR formats: `com.hyllos.finventree://connect/{CODE}`, `https://finventree.app/connect/{CODE}`, and raw 6-char trade codes.
- **Viewfinder overlay**: Animated scan line, corner brackets, haptic feedback on success.
- **"Type code manually" fallback**: Dismisses scanner and opens ConnectSheet for manual entry.
- **Customers page FAB**: Violet QR icon button opens scanner; on decode, opens ConnectSheet pre-filled with the trade code.
- **ConnectSheet scan button**: ScanLine icon added next to the trade code input field for in-sheet scanning.
- **ConnectSheet** (`ConnectSheet.tsx`): New component — 6-char trade code entry, business lookup, relationship type picker (Supplier/Customer/Retailer), mutual connect via `connect_by_trade_code` RPC, dispatches `addCustomer` to Redux.
- **Profile QR code**: Displays `QRCodeSVG` encoding `com.hyllos.finventree://connect/{TRADE_CODE}` so other users can scan to connect.
- **Share button** (Profile): Native share via `@capacitor/share`, web fallback to `navigator.share`, clipboard fallback.
- **DB migration** `20260517_connect_by_trade_code.sql`: `connect_by_trade_code(p_trade_code, p_type_for_me, p_type_for_them)` SECURITY DEFINER RPC — mutual counterparty creation, idempotency check, `CONNECTION_ACCEPTED` notification insertion.
- **supabaseApi**: `connectByTradeCode()` calling the new RPC.
- **App.tsx**: `/connect/:code` route + `ConnectRedirect` component for web deep links.
- **main.tsx**: Extended `appUrlOpen` listener to handle `finventree://connect/{CODE}` deep links → navigates to `/customers?connect={CODE}`.

---

### Trade Network — Phase 1-3 Implementation
**Commits:** `394405b`, `406c4d4`, `6dc552a`, `c6e1a2a`

- **Trade Network types** (`tenant` feature slice): `tradeCode`, `linkedTenantId`, `linkedTenantName` fields on customers; `TRANSFER` order type; sync/transfer status enums.
- **LinkTenantSheet**: Bottom sheet to link an existing customer to a Finventree tenant by trade code lookup.
- **CustomerDetail**: Profile header pill showing linked status; opens `LinkTenantSheet`.
- **Profile page**: Trade Code card moved from Settings; QR code + copy + share.
- **Settings**: Removed Trade Network section (now in Profile).
- **DB migration** `20260517_trade_network.sql`: `lookup_tenant_by_trade_code` RPC, `sync_transfer_status` RPC, tenant trade code column.
- **CreateOrderSheet**: Auto-detects TRANSFER type for linked counterparties; calls `createTransfer` RPC.
- **OrderDetail**: Trade Network badges, inter-tenant transfer status banner, `syncTransferStatus` action.
- **CustomerPicker**: Verified badge + `linkedTenantName` display for linked counterparties.

---

### Payments — Advance Credit System
**Commit:** `93dc441`

- Overpayment on a sale order is automatically applied as a credit note against the customer's next order.
- `RecordPaymentSheet` redesigned: cleaned up layout, accessible `SheetDescription`.
- Credit balance display in customer/order context.

---

### Orders — Full Edit + Soft Delete
**Commits:** `d4bafd8`, `2bb751d`, `3a792af`, `363a392`

- **Edit flow** for both Sale Orders and Purchase Orders: `EditSaleOrderSheet`, `EditPurchaseOrderSheet` components.
- **Soft delete** for orders (status set to `CANCELLED`, not hard delete).
- **EditPurchaseOrderSheet**: Visual inspection states — ACCEPTED (green), REJECTED (red), PENDING (amber) per line item.
- Removed dead old edit sheets and unused imports from OrderDetail.
- `EditPurchaseOrderSheet` aligned visually with `BatchAddSheet` style.

---

### Customer UI — Comprehensive Refinements
**Commits:** `dfb68ca`, `56c80a5`, `a1fe763`

- Customer list cards: AR balance, order count, type colour bar, linked tenant badge.
- Add/Edit customer sheet redesign.
- **Delete flow** in CustomerDetail: soft-delete with confirmation.
- **Soft delete for customers and phones** in DB (`deleted_at` column, RLS-filtered).

---

### Analytics — PostHog Integration
**Commits:** `0308cc0`, `39dbbbf`, `4d14d06`

- PostHog integrated with safe proxy and dev-mode gating.
- Beta feature usage tracking optimised.
- Session recording, page view tracking, custom events.

---

## 15 May 2026

### Billing — Razorpay Recurring Subscriptions
**Commit:** `d828007`

- Full Razorpay integration: `razorpay-create-subscription`, `razorpay-webhook`, `razorpay-cancel-subscription` Edge Functions.
- Subscription plans: Free / Growth / Pro / Enterprise tiers.
- Webhook signature verification; plan entitlements updated in DB on payment events.

### Billing — Subscription Tier Redesign
**Commit:** `5a42a95`

- Pricing page (`Pricing.tsx`) redesigned with tier cards, feature comparison table.
- Upgrade modal with feature highlight and direct checkout CTA.

### Feature Gates — Hybrid Hide/Badge Gating
**Commits:** `2a4dc92`, `cf443bd`, `f9948be`

- `FeatureGate` component: hides or shows a "badge" upgrade prompt depending on gate mode.
- Badge mode blocks inner button via pointer-intercept overlay (no JS hacking needed).
- **Hard enforcement**: device cap, seat limit, receivables credit gates enforced at runtime.

### Auth — Web Login + App→Web Token Handoff
**Commit:** `e2e9e6b`

- `finventree.com` web login page.
- Seamless app→web token handoff: deep link carries session token so user stays logged in when opening a link from the app.

### Admin — Supervision, Feature Flags, Trial Management
**Commits:** `76f6a9b`, `beebf81`, `8ab1374`, `faaed02`, `8439903`

- Admin supervision UI: tenant list, plan assignment, trial extension.
- 6-month trial grant + `extend-trial` admin action.
- Sync feature gates between admin config and app entitlements.
- Field-level validation on admin login page.

### Analytics — PostHog Setup
**Commits:** `7fade31`, `2bfaf52`

- PostHog SDK integrated for user session and event tracking.
- Storage-version management for PostHog persistence.

### Web — Light Mode Theme Fix
**Commit:** `ca5b36a`

- Theme toggling and visibility improved in light mode.

---

## 14 May 2026

### Invoice — Print System
**Commit:** `744702c`

- Replaced `html2canvas` PDF generation with `window.print()` system for pixel-perfect PDFs with selectable text.
- Native Capacitor fallback: `generateInvoicePDF` / `generatePurchaseOrderPDF` via `@capacitor/filesystem` + `@capacitor/share`.

### Secure Public Order Sharing
**Commit:** `59df301`

- Token-based public share links for orders: `PublicView` page accessible without login.
- 30-day expiry, HMAC-signed tokens.
- Atomic PO certification migrations.

### Admin — Analytics, Audit, Revenue, Health Pages
**Commits:** `868fef0`, `6f15143`

- Admin panel pages added: analytics, audit log, feature flags, funnel, health status, revenue.
- Financials page, overdue orders, IMEI lookup, share links.

---

## 11 May 2026

### Desktop UI + Capacitor PDF Share
**Commit:** `90d17fb`

- Responsive desktop sidebar layout for `app.finventree.com`.
- PDF share via `@capacitor/share` on native.
- Share link URL bug fixes.

---

## 10 May 2026

### Rebrand: StockFlow → Finventree
**Commits:** `bf6f3dd`, `6a20e4a`

- All source files, configs, manifests, copy updated.
- App ID: `com.hyllos.finventree`. Bundle name: `Finventree`.

### Capacitor Native Compatibility
**Commits:** `7d0d7bb`, `03c58cb`, `ec6b198`, `55af496`

- **HashRouter** on native Capacitor, BrowserRouter on web.
- Safe-area: edge-to-edge header, no double bottom inset, dynamic StatusBar style.
- `virtual:pwa-register` stubbed in Capacitor builds (was crashing app).
- Splash screen, icons, keyboard, StatusBar, Web API guards all fixed.

### Auth Pages → Web
**Commits:** `425a67e`, `8a034a4`

- `/register`, `/activate`, `/join`, `/status` moved to `finventree.com`.
- App login page logo stacked layout.

---

## 9 May 2026

### Monorepo Scaffold
**Commit:** `c1a7f2b`

- Turborepo + pnpm workspaces scaffold.
- Packages: `apps/app` (mobile/web), `apps/web` (landing), `apps/admin` (admin panel), `packages/shared`, `packages/ui`.

### Finventree Landing Page
**Commits:** `9e1fb54`, `1fb090f`, `c8ec09f`

- Landing page on `finventree.com` (Cloudflare Pages / Next.js static export).
- Admin panel migrated to Next.js static export on `admin.finventree.com`.

### Initial Capacitor Integration
**Commit:** `87540f8`

- Android and iOS native project setup.
- Capacitor plugins: SplashScreen, StatusBar, Keyboard, PushNotifications, Haptics, Share, Clipboard, Filesystem, Browser, Network, Preferences.
