# Finventree — Testing Plan

> Platform: iOS (Capacitor), Android (Capacitor), Web (`app.finventree.com`)
> Test against all three platforms unless noted otherwise.

---

## 0. Setup & Prerequisites

| Step | Detail |
| :--- | :--- |
| Dev build | `pnpm --filter @finventree/app dev` — web at `localhost:5173` |
| iOS simulator | `npx cap run ios` from `apps/app/` |
| Android emulator | `npx cap run android` from `apps/app/` |
| Physical device | Preferred for camera, haptics, push notifications |
| Test accounts | Create two Finventree tenants (Tenant A + Tenant B) for Trade Network tests |
| Supabase env | `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |

---

## 1. Authentication

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 1.1 | Register at `finventree.com/register` | Account created, verification email sent | Web |
| 1.2 | Log in at `finventree.com/login` | Redirected to app with session active | Web |
| 1.3 | Open auth email link on mobile | OS routes `com.hyllos.finventree://callback` deep link, session established | iOS / Android |
| 1.4 | App → web handoff | Opening web link from app keeps user logged in (token handoff) | iOS / Android |
| 1.5 | Session persistence | Refresh / restart app — user remains logged in | All |
| 1.6 | Logout | Session cleared, redirected to login | All |
| 1.7 | Suspended account | `SuspendedScreen` shown, no data accessible | All |

---

## 2. Inventory (Phone Management)

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 2.1 | Add phone manually | Form validates, phone appears in inventory list | All |
| 2.2 | IMEI scanner — barcode | Camera opens, rear-facing, scans barcode, IMEI auto-fills | iOS / Android |
| 2.3 | IMEI scanner — OCR fallback | Printed IMEI text recognised via Tesseract | iOS / Android |
| 2.4 | IMEI scanner — flash toggle | Torch toggles on/off | iOS / Android |
| 2.5 | IMEI scanner — close | Camera stops, stream released | All |
| 2.6 | Edit phone | All fields update, sync to Supabase | All |
| 2.7 | Soft delete phone | Phone hidden from list, `deleted_at` set | All |
| 2.8 | Phone detail tabs | Details / Finance / History tabs all render | All |
| 2.9 | Phone history timeline | Purchase → Repair → Sale events shown in order | All |
| 2.10 | Share phone details | Native share sheet (iOS/Android), clipboard fallback (web) | All |
| 2.11 | Offline add phone | Phone queued in outbox, syncs when back online | iOS / Android |

---

## 3. Customers

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 3.1 | Customer list | All customers shown, type colour bar, AR balance, order count | All |
| 3.2 | Search | Live search filters by name and phone | All |
| 3.3 | Filter by type | WHOLESALER / CUSTOMER / RETAILER / PLATFORM filters work | All |
| 3.4 | Add customer via picker | CustomerPicker opens, creates new customer | All |
| 3.5 | Edit customer | Name, phone, type all update | All |
| 3.6 | Delete customer | Soft delete — confirmation required, hidden from list | All |
| 3.7 | Customer detail | AR balance, order list, linked tenant badge | All |
| 3.8 | Link tenant (CustomerDetail) | Profile pill opens LinkTenantSheet; trade code lookup links tenant | All |
| 3.9 | Unlink tenant | Unlink removes `linkedTenantId`, pill reverts to grey | All |
| 3.10 | Share customer link | Native share (iOS/Android), clipboard fallback | All |

---

## 4. Sales Orders

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 4.1 | Create sale order | Select customer, add phones, set price → order created | All |
| 4.2 | Order detail view | Status, items, totals, payment history shown | All |
| 4.3 | Edit sale order | Change items/prices → order updates | All |
| 4.4 | Cancel sale order | Status set to CANCELLED (soft delete) | All |
| 4.5 | Generate invoice PDF | Invoice opens in print window (web) or PDF share (native) | All |
| 4.6 | Share public link | Token-based public view accessible without login, expires in 30 days | All |
| 4.7 | Public view print | `window.print()` works on public view page | Web |

---

## 5. Purchase Orders

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 5.1 | Create purchase order | Select supplier, batch-add phones → PO created | All |
| 5.2 | PO detail view | Status, items with inspection state, totals shown | All |
| 5.3 | Edit PO — inspection states | Per-item ACCEPTED (green) / REJECTED (red) / PENDING (amber) | All |
| 5.4 | Edit PO — rejected items preserved | Reopen edit sheet — rejection states survive | All |
| 5.5 | Cancel PO | Soft delete, status CANCELLED | All |
| 5.6 | Generate PO PDF | PO PDF with rejected items list | All |
| 5.7 | Certify PO | Atomic certification marks items as received | All |

---

## 6. Payments & Ledger

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 6.1 | Record payment | Amount, mode, note recorded against order | All |
| 6.2 | Exact payment | Balance becomes zero | All |
| 6.3 | Overpayment (advance credit) | Excess amount stored as credit against customer | All |
| 6.4 | Credit auto-applied | Next order for same customer has credit pre-applied | All |
| 6.5 | Allocation sheet | Multi-order payment allocation works | All |
| 6.6 | Ledger page | All entries appear, linked to source transactions | All |
| 6.7 | Ledger watchtower | Financial totals match sum of ledger entries | All |
| 6.8 | Transactions page | Full transaction history, filter by date | All |

---

## 7. Trade Network — Link & Connect

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 7.1 | Trade Code visible on Profile | 6-char code displayed with copy button | All |
| 7.2 | Copy trade code | Capacitor Clipboard (native), `navigator.clipboard` (web) | All |
| 7.3 | Share connect link | Native share sheet with `https://finventree.app/connect/{CODE}` | iOS / Android |
| 7.4 | Profile QR code displayed | `QRCodeSVG` renders encoding `com.hyllos.finventree://connect/{CODE}` | All |
| 7.5 | External QR scanner → deep link | Generic scanner opens `com.hyllos.finventree://connect/...` → app opens ConnectSheet | iOS / Android |
| 7.6 | In-app QR FAB | Violet QR button on Customers opens full-screen camera scanner | All |
| 7.7 | In-app scanner — scan QR | Camera decodes QR, extracts 6-char code, closes scanner, opens ConnectSheet pre-filled | iOS / Android |
| 7.8 | In-app scanner — "Type manually" | Dismisses scanner, opens ConnectSheet with empty input | All |
| 7.9 | ConnectSheet scan button | ScanLine button inside sheet opens scanner; on scan fills code and auto-looks up | All |
| 7.10 | ConnectSheet code lookup | 6-char code resolves to business name (green verified banner) | All |
| 7.11 | ConnectSheet invalid code | Error toast "No Finventree business found" | All |
| 7.12 | ConnectSheet self-connect | Blocked server-side | All |
| 7.13 | ConnectSheet — choose type | WHOLESALER / CUSTOMER / RETAILER picker | All |
| 7.14 | Connect — mutual creation | Both tenants get counterparty entry; Redux updated; success toast | All |
| 7.15 | Already connected | "Already connected" info toast, sheet closes | All |
| 7.16 | Web deep link `/connect/{CODE}` | Navigates to `/customers?connect={CODE}`, ConnectSheet opens | Web |
| 7.17 | Native deep link → app cold start | App opens to correct screen when launched from a QR scan | iOS / Android |

---

## 8. Trade Network — Inter-Tenant Transfers

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 8.1 | Create TRANSFER order | Select linked counterparty in order sheet → type auto-set to TRANSFER | All |
| 8.2 | Transfer RPC | `create_transfer` called, both sides get order entries | All |
| 8.3 | Transfer status banner | OrderDetail shows "Inter-tenant transfer" status ribbon | All |
| 8.4 | Sync transfer status | `syncTransferStatus` action updates local state from remote | All |
| 8.5 | CustomerPicker linked badge | Linked tenants show "Verified" badge with linked name | All |
| 8.6 | LinkTenantSheet | Trade code lookup in CustomerDetail links the tenant correctly | All |

---

## 9. Billing & Subscriptions

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 9.1 | Free tier limits | Device cap / seat limit / credit gates enforced | All |
| 9.2 | Upgrade flow | Upgrade modal opens, Razorpay checkout loads | All |
| 9.3 | Razorpay checkout — native | Opens in `@capacitor/browser` in-app browser | iOS / Android |
| 9.4 | Razorpay checkout — web | Opens in `window.open` new tab | Web |
| 9.5 | Subscription webhook | Plan tier updates in DB after successful payment | — (server) |
| 9.6 | Trial period | Trial banner visible; trial expiry shows `TrialExpiredPaywall` | All |
| 9.7 | Feature gate — badge mode | Locked feature shows badge overlay; tapping opens upgrade modal | All |
| 9.8 | Feature gate — hide mode | Locked feature is hidden entirely | All |
| 9.9 | Pricing page | All tiers displayed with feature comparison | All |

---

## 10. Analytics

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 10.1 | PostHog session starts | Session captured in PostHog dashboard on login | All |
| 10.2 | Page view tracking | Navigation events recorded in PostHog | All |
| 10.3 | Feature usage events | Key actions (create order, record payment, connect) tracked | All |
| 10.4 | Dev mode gating | PostHog events NOT fired in `localhost` / dev environment | Dev |
| 10.5 | Analytics page | Dashboard shows correct charts (if on Pro+ plan) | All |

---

## 11. Notifications

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 11.1 | Push permission request | Prompt appears first time user enables notifications | iOS / Android |
| 11.2 | FCM/APNs token stored | Token saved to `user_push_subscriptions` in Supabase | iOS / Android |
| 11.3 | Push notification received | Alert shown when app is in background | iOS / Android |
| 11.4 | `CONNECTION_ACCEPTED` notification | Received when another tenant connects with you | iOS / Android |
| 11.5 | Web push | PWA push notification works in browser | Web |
| 11.6 | Disable notifications | Token removed from DB, no further notifications | All |

---

## 12. Offline / Sync

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 12.1 | Go offline — add phone | Phone queued in outbox, UI shows queued state | iOS / Android |
| 12.2 | Come back online | Outbox processed, Supabase updated, toast shown | iOS / Android |
| 12.3 | Offline indicator | Network loss banner / icon visible | All |
| 12.4 | Data persistence on restart | Redux state persisted via localforage survives app restart | iOS / Android |
| 12.5 | Conflict — server wins | If server has newer state, outbox retries without overwriting | All |
| 12.6 | Retry limit | After 3 failures, outbox item removed with error toast | All |

---

## 13. Admin Panel (`admin.finventree.com`)

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 13.1 | Admin login | Field validation, secure login | Web |
| 13.2 | Tenant supervision | List all tenants, view plan, trial status | Web |
| 13.3 | Extend trial | Grant 6-month extension → tenant plan updated | Web |
| 13.4 | Feature flags | Toggle feature flags → app respects new state | Web |
| 13.5 | Revenue page | Subscription revenue charts | Web |
| 13.6 | Analytics page | Session / event data from PostHog proxy | Web |
| 13.7 | IMEI lookup | Search IMEI across all tenants | Web |
| 13.8 | Overdue orders | List orders past due date | Web |
| 13.9 | Audit log | User actions recorded and searchable | Web |
| 13.10 | Health page | System status — DB, Edge Functions, latency | Web |

---

## 14. Native Capacitor — Platform-Specific

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 14.1 | Splash screen | Shows 2s, animates out smoothly, no warping | iOS / Android |
| 14.2 | Status bar | Background colour matches app header; changes with theme | iOS / Android |
| 14.3 | Dark mode | System dark mode activates app dark mode; StatusBar updates | iOS / Android |
| 14.4 | Keyboard | Input scrolls into view when keyboard opens | iOS / Android |
| 14.5 | Keyboard style | Keyboard appearance matches light/dark theme | iOS / Android |
| 14.6 | Haptics — success | Gentle success vibration on scan / connect | iOS / Android |
| 14.7 | Haptics — error | Error vibration pattern on validation fail | iOS / Android |
| 14.8 | Safe areas | Content not obscured by notch, home indicator, status bar | iOS / Android |
| 14.9 | Deep link — auth | Tapping email auth link opens app and establishes session | iOS / Android |
| 14.10 | Deep link — connect | QR scan routes to `/customers?connect={CODE}` | iOS / Android |
| 14.11 | PDF share | Invoice/PO PDF generated and native share sheet opens | iOS / Android |
| 14.12 | Camera permission (IMEI) | Permission prompt, deny shows error state | iOS / Android |
| 14.13 | Camera permission (QR) | Same prompt/error as IMEI — verify string mentions both | iOS / Android |
| 14.14 | HashRouter | All routes navigable via `/#/path`; no blank screens | iOS / Android |
| 14.15 | App icon | Correct Finventree icon on home screen | iOS / Android |
| 14.16 | Back gesture (Android) | Back swipe navigates correctly, no app exit surprise | Android |

---

## 15. Web (`app.finventree.com`)

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 15.1 | Desktop sidebar | Sidebar visible on md+ screens | Web |
| 15.2 | Mobile PWA install | "Add to Home Screen" prompt works | Web (mobile) |
| 15.3 | iOS install prompt | Custom `IosInstallPrompt` shown for Safari users | Web (iOS) |
| 15.4 | Print invoice | `window.print()` opens correct styled print view | Web |
| 15.5 | Light/dark theme | Theme toggle persists across reload | Web |
| 15.6 | `/connect/:code` route | Navigates to ConnectSheet with code pre-filled | Web |

---

## 16. Security

| # | Test | Expected | Platforms |
| --- | :--- | :--- | :--- |
| 16.1 | RLS tenant isolation | Cannot query another tenant's data directly | — (DB) |
| 16.2 | RPC security | All mutations via SECURITY DEFINER RPCs; no direct table writes exposed | — (DB) |
| 16.3 | Public view token | Expired token → 403 / no data | Web |
| 16.4 | Self-connect block | `connect_by_trade_code` rejects same-tenant call | — (DB) |
| 16.5 | Auth route protection | Unauthenticated users redirected to `/login` | All |
| 16.6 | Admin auth | Admin panel requires separate admin credentials | Web |
| 16.7 | Trade Code brute force | No client-side rate limiting needed — server RPC enforces lookup count | — |

---

## 17. Known Issues / Open Items

| Issue | Severity | Notes |
| :--- | :--- | :--- |
| iOS `NSCameraUsageDescription` only mentions IMEI | Low | Should also mention QR scanning |
| `window.print()` in PublicView not guarded for native | Low | PublicView only accessible from web (token links are web URLs) |
| `ConnectRedirect` uses `window.location.pathname` | Low | On HashRouter this will always be `/` — but `/connect/:code` is a web-only route, so this is not exercised on native |
| Tesseract OCR worker memory on low-end Android | Medium | Monitor for OOM crashes on 2GB RAM devices |
