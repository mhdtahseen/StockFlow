# Finventree — UI Audit, Enhancement & Platform Discrepancy Report

> **Prepared:** July 2026 · **App Version:** v2.7
> **Scope:** Component-by-component + page-by-page analysis across iOS, Android, and Desktop (Web) surfaces.
> **User Base:** ~90% Mobile (iOS/Android) · ~10% Desktop/Laptop

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Native Platform Issues (iOS vs Android)](#2-critical-native-platform-issues-ios-vs-android)
3. [Layout & Navigation — Global Components](#3-layout--navigation--global-components)
4. [Page-by-Page Audit](#4-page-by-page-audit)
   - 4.1 [Dashboard](#41-dashboard)
   - 4.2 [Inventory List](#42-inventory-list)
   - 4.3 [Phone Detail](#43-phone-detail)
   - 4.4 [Add/Edit Phone](#44-addedit-phone)
   - 4.5 [Orders (Sales Orders)](#45-orders-sales-orders)
   - 4.6 [Order Detail](#46-order-detail)
   - 4.7 [Purchase Orders](#47-purchase-orders)
   - 4.8 [Customers List](#48-customers-list)
   - 4.9 [Customer Detail](#49-customer-detail)
   - 4.10 [Ledger / Wallet](#410-ledger--wallet)
   - 4.11 [Analytics](#411-analytics)
   - 4.12 [Profile & Business Settings](#412-profile--business-settings)
   - 4.13 [Settings Page](#413-settings-page)
   - 4.14 [Support Page](#414-support-page)
   - 4.15 [Onboarding](#415-onboarding)
5. [Feature Implementation vs Feature Specification Gap](#5-feature-implementation-vs-feature-specification-gap)
6. [Desktop (10% User Base) Discrepancies](#6-desktop-10-user-base-discrepancies)
7. [Accessibility & Internationalisation Gaps](#7-accessibility--internationalisation-gaps)
8. [Priority Action Matrix](#8-priority-action-matrix)

---

## 1. Executive Summary

The Finventree app is a well-architected mobile-first SaaS for second-hand phone trading. The core feature set (inventory, orders, ledger, customers, analytics) is complete and functional. However, an in-depth component and page traversal has revealed:

- **2 Critical native-platform bugs** causing visible layout breakage on Android and iOS.
- **6 Medium-priority UI enhancements** that would immediately improve the mobile experience for the 90% mobile user base.
- **8 Desktop optimisation gaps** where the 10% desktop user base sees a degraded, mobile-centric view without proper use of additional screen space.
- **5 Missing feature implementations** where gate keys exist in `usePlan.ts` but the UI is absent.
- **Multiple polish-level discrepancies** (inconsistent touch targets, missing skeleton states, hardcoded empty-state behaviours).

---

## 2. Critical Native Platform Issues (iOS vs Android)

### 2.1 🔴 Safe-Area Bottom Gap (CRITICAL — Already Documented in TODO.md)

| Platform | Symptom |
|---|---|
| **Android** | Black strip below BottomNav. `env(safe-area-inset-bottom)` returns `0` on Android WebView < v140, leaving a raw black navigation-bar gap. |
| **iOS** | Extra white/background-coloured space at the very bottom on newer iPhones with home indicators. |

**Root Cause:** `BottomNav.tsx` uses `env(safe-area-inset-bottom)` directly in inline styles. The Capacitor `StatusBar.overlaysWebView` API is deprecated on Android 15+. The fix requires migrating to the Capacitor 8 `SystemBars` API with `insetsHandling: 'css'`.

**Files Affected:**
- `apps/app/capacitor.config.ts`
- `apps/app/src/context/ThemeContext.tsx`
- `apps/app/src/components/layout/AppHeader.tsx`
- `apps/app/src/components/layout/AppDrawer.tsx`
- `apps/app/src/components/layout/BottomNav.tsx`
- `apps/app/android/app/src/main/res/values/styles.xml` (add `navigationBarColor`, `windowLightNavigationBar`)
- Create `apps/app/android/app/src/main/res/values-night/styles.xml` (dark variant)

**Exact Code Fix (BottomNav.tsx):**
```ts
// BEFORE
style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)` }}

// AFTER
style={{ paddingBottom: `calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 8px)` }}
```

---

### 2.2 🔴 iOS Keyboard Pushes Layout (BottomNav Overlap)

**Component:** `BottomNav.tsx`, `AppLayout.tsx`

**Symptom (iOS):** When a text input is focused (e.g., searching in Inventory or adding an order), the iOS keyboard slides up but the BottomNav remains `fixed` at the bottom. On iOS, the fixed positioning of the nav bar is not adjusted for the software keyboard, causing the keyboard to overlap the focused input field with the nav bar sitting above the keyboard.

**Root Cause:** The app uses `@capacitor/keyboard` to hide `BottomNav` when the keyboard shows (`isKeyboardVisible` state in `AppLayout.tsx`). However, there is a timing race — the keyboard becomes visible before the `keyboardWillShow` event fires in WebView, causing a brief flash of the nav bar over the input.

**Recommended Fix:**
1. Move the keyboard listener to `BottomNav.tsx` itself and use `keyboardWillShow` (not `keyboardDidShow`) to start the hide animation earlier.
2. Add a CSS `transition: opacity 0.15s ease` to BottomNav so the disappearance is smooth rather than instant.

---

### 2.3 🟡 Android Back Button — No Custom Handler on Detail Pages

**Symptom (Android):** On `PhoneDetail`, `CustomerDetail`, `OrderDetail`, pressing the hardware back button triggers the browser's default back action, which is correct. However, when modals (e.g., the repair cost modal, CreateOrderSheet) are open, the Android back gesture dismisses the entire page rather than just the modal.

**Root Cause:** Capacitor's `App.addListener('backButton')` is not globally registered. Modals on these pages (`showRepairModal`, `showSaleModal`) do not trap the Android back button.

**Files Affected:**
- `PhoneDetail.tsx` — repair modal and CreateOrderSheet
- `CustomerDetail.tsx` — PaymentAllocationSheet, CustomerEditSheet
- `OrderDetail.tsx` — any open sheets/dialogs

**Recommended Fix:**
```ts
// In each modal-owning component
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;
  const handler = App.addListener('backButton', () => {
    if (showRepairModal) setShowRepairModal(false);
    else if (showSaleModal) setShowSaleModal(false);
    else navigate(-1);
  });
  return () => handler.then(h => h.remove());
}, [showRepairModal, showSaleModal]);
```

---

### 2.4 🟡 Android Dark Theme — Navigation Bar Colour Mismatch

**Symptom (Android Dark Mode):** When the app switches to dark mode (`dark:bg-slate-950`), the system navigation bar at the very bottom of the Android screen remains white (or the OEM default colour), creating a stark contrast with the dark app background.

**Root Cause:** No `values-night/styles.xml` exists for Android. The `ThemeContext.tsx` calls `StatusBar.setBackgroundColor` but does not update the navigation bar colour (separate from status bar).

**Recommended Fix:** Create `apps/app/android/app/src/main/res/values-night/styles.xml`:
```xml
<resources>
  <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">#0F172A</item>
    <item name="android:windowLightNavigationBar">false</item>
  </style>
</resources>
```

---

### 2.5 🟡 iOS Safe-Area Top Padding Inconsistency on Sub-Pages

**Symptom (iOS):** On iPhone 14/15 Pro with Dynamic Island, `AppHeader.tsx` has `pt-3` (12px) as static top padding. This is insufficient for the Dynamic Island cutout area (~56px safe-area-inset-top). On pages that push via `navigate()`, the header title can clip behind the Dynamic Island.

**Root Cause:** `AppHeader.tsx` uses a static `py-3` class instead of a safe-area-aware padding.

**Recommended Fix (AppHeader.tsx):**
```tsx
// BEFORE
<header className="flex items-center gap-3 px-4 py-3 ...">

// AFTER
<header className="flex items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+var(--safe-area-inset-top,env(safe-area-inset-top,0px)))] ...">
```

---

### 2.6 🟡 iOS QR Scanner Camera Permission String — Misleading

**Symptom (iOS):** The camera permission dialog shown by iOS reads a string about capturing the IMEI, but QR scanning (for Trade Network connect) also uses the camera. Users presented with the QR scan flow after the IMEI prompt may be confused by the old permission reason.

**File:** `apps/app/ios/App/App/Info.plist`
**Key:** `NSCameraUsageDescription`

**Recommended Fix:**
```
Change from: "Finventree uses the camera to scan IMEI barcodes."
Change to: "Finventree uses the camera to scan IMEI barcodes and QR codes for Trade Network connections."
```

---

## 3. Layout & Navigation — Global Components

### 3.1 AppLayout.tsx

| Issue | Severity | Details |
|---|---|---|
| `100dvh` height works on modern browsers but falls back poorly on older Android WebView pre-Chrome 108 | Low | Test on Android WebView < 108 to confirm no layout overflow. |
| Desktop: No breadcrumb navigation | Medium | Sub-pages (PhoneDetail, CustomerDetail) have a back button in the header, but desktop users have no URL-level breadcrumb or sidebar highlight showing current location. |
| No global "loading" overlay when `useFreshFetch` is in flight | Low | Individual pages handle this inconsistently — some show `<Loader>`, others show nothing. |

### 3.2 BottomNav.tsx

| Issue | Severity | Details |
|---|---|---|
| Safe-area bug (see §2.1) | **Critical** | Described above |
| No haptic feedback on tab press | Low | On native platforms, `Haptics.impact({ style: ImpactStyle.Light })` should fire on tab selection for a native feel. |
| Active tab indicator is only a colour change | Low | A subtle scale(1.1) + colour animation on the active icon would improve affordance. |
| "More" tab absent | Medium | As features grow, a "More" overflow tab might be needed. Currently all 5 tabs are always visible — on small Android screens (360px width), the labels truncate. |

### 3.3 AppHeader.tsx

| Issue | Severity | Details |
|---|---|---|
| Dynamic sub-page titles use `useMatch` with hardcoded path strings | Medium | If routes change, titles silently break. Consider a `RouteTitle` context instead. |
| No visual search affordance on list pages | Medium | The header shows a title, but no search icon for Inventory, Customers, Orders — users on desktop expect a search bar in the header area, not a separate sticky bar. |

### 3.4 AppDrawer.tsx

| Issue | Severity | Details |
|---|---|---|
| Drawer has no keyboard shortcut on desktop | Low | `Escape` key should close the drawer; currently it does not. |
| PRO badge on locked items uses colour only | Medium | Accessibility: the lock icon is present but the colour-only distinction (grey vs active) may not be sufficient for colour-blind users. Adding a `cursor-not-allowed` + tooltip explaining the upgrade needed would help. |

### 3.5 DesktopSidebar.tsx

| Issue | Severity | Details |
|---|---|---|
| Sidebar is always full-width (240px), no collapsible mode | Low | Large-screen users (1440px+) might want to collapse the sidebar to give more space to the main content area. |
| No keyboard navigation between sidebar items | Medium | Tab + Enter navigation through sidebar links is not implemented. |

---

## 4. Page-by-Page Audit

### 4.1 Dashboard

**Status:** ✅ Feature-complete as specced.

| Enhancement | Priority | Description |
|---|---|---|
| Metric cards are not tappable on mobile | Medium | Cards like "Total Revenue", "In Stock Devices" look like they should navigate to the relevant page (Ledger, Inventory) but have no `onClick`. Add navigation on tap to improve discoverability. |
| "Recent Activity" list has no empty-state illustration | Low | When a brand-new tenant logs in, the list area is blank with just grey text. An illustration + CTA ("Add your first device") would improve onboarding. |
| Metric cards do not animate on first load | Low | A subtle count-up animation (0 → actual value) on the large numbers would make the dashboard feel more alive and polished. |
| No refresh gesture (pull-to-refresh) | Medium | `useFreshFetch` fetches on mount but there is no way for mobile users to manually refresh data without navigating away. A pull-to-refresh with `@capacitor/push-notifications` or a manual trigger would be expected by mobile users. |
| Dark mode hero card colours are slightly desaturated | Low | The dark variant of the primary blue card (`dark:bg-[#0a3a7a]`) can feel washed out at certain brightness levels — consider `dark:bg-primary-700` for better contrast. |

---

### 4.2 Inventory List

**Status:** ✅ Feature-complete. Multi-select, bulk actions, filtering, and sorting are all implemented.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Multi-select UI collapses the header into a floating action bar — but on Android the action bar overlaps the system status bar | High | The `fixed top-0` position for the multi-select action bar does not account for the safe-area-inset-top. Add `pt-[env(safe-area-inset-top,0px)]` to the action bar container. |
| Filter sheet does not animate smoothly on Android | Medium | The filter bottom sheet uses a simple `translate` animation but lacks the spring physics that iOS users expect. Wrapping in `framer-motion` `AnimatePresence` with a spring preset would feel native. |
| "Sort by" dropdown is a raw HTML `<select>` on mobile | Medium | Native `<select>` renders the OS picker (iOS wheel picker, Android spinner) which is fine, but it doesn't match the app's design language. Replace with a custom sheet-based sorter for design consistency. |
| Swipe-to-act gestures missing | Medium | Mobile inventory apps typically support swipe-right to mark as sold or swipe-left for delete. This is absent — consider adding with `@use-gesture/react`. |
| Pending items (PENDING status) have no distinct visual treatment in the list | Medium | `PENDING` phones only show an amber badge, but users with many pending items have no way to sort or filter by PENDING status in the current filter set. |
| Image/photo of device is absent | Low | Each inventory card shows a generic `<Smartphone>` icon. An optional device photo would help users identify items visually, especially for multiple similar models. |
| Inventory search does not highlight the matched term | Low | Fuse.js returns matches but the matched substring in the results is not highlighted. Adding a `<mark>` highlight on the matched characters improves scannability. |

---

### 4.3 Phone Detail

**Status:** ✅ Feature-complete. Finance tab, History tab, repair log, CreateOrderSheet, Share all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| The "Finance Breakdown" tab and "Unit History" tab switching has no animation | Low | Simply toggling between tab content with no transition feels abrupt. Add a `fade-in slide-in-from-bottom-4` animation on tab content change. |
| Repair modal on iPhone — keyboard pushes inputs below the fold | High | The `repairAmount` CurrencyInput is at the bottom of the modal. When the keyboard opens, it is obscured. The modal needs `max-h-[80dvh] overflow-y-auto` or the fields need reordering (amount first, description second). |
| Device IMEI display shows only last 4 digits (`**** 1234`) — copy-to-clipboard is absent | Medium | Users often need the full IMEI for warranty or insurance purposes. Add a long-press or tap-to-copy on the full IMEI (visible only after a reveal toggle) — guarded by the `phone.status !== 'SOLD'` flag for privacy. |
| "Create Sales Order" button is inactive when status is PENDING | Correct — by design | This is correct behaviour. |
| The "Reject" action for PENDING phones has no confirmation dialog | High | Tapping "Reject" immediately dispatches `removePhone` and navigates away with no confirmation. This is a destructive action that should show a confirmation sheet ("Are you sure you want to reject and remove this device?"). |
| History tab: "Authenticity Clear" empty state uses `ShieldCheck` which is unfamiliar | Low | Consider replacing the empty state copy with "No prior trading history found for this IMEI" which is more informative than "Authenticity Clear". |
| Phone Detail has no "Duplicate" action | Low | When adding multiple identical phones, users would benefit from a "Duplicate this phone" shortcut that pre-fills the Add Phone form. |

---

### 4.4 Add/Edit Phone

**Status:** ✅ Feature-complete (IMEI scanning, issue tags, dual-SIM, RAM/storage/colour fields, purchase price, etc.)

| Issue / Enhancement | Priority | Description |
|---|---|---|
| IMEI Scanner button is not prominently visible on the form | Medium | The QR/barcode scan icon is small and placed inline within the IMEI input. On mobile, it should be a large, dedicated scan button (full-width secondary button) below the IMEI field to reduce tap errors. |
| Form validation fires on submit only — no inline feedback | Medium | Entering an invalid IMEI (wrong length) gives no feedback until the user taps "Save." Add real-time validation (`onBlur`) for the IMEI field showing a character count and checksum validation result. |
| The "Issues" multi-select uses a custom autocomplete that shows a flat list | Medium | On Android with many issue options, the list is long and unwieldy. Consider grouping issues by category (Screen, Battery, Body, etc.) with section headers. |
| No "Required" field indicators | Low | Stars or label styling are absent. New users don't know which fields (IMEI, purchase price) are mandatory vs optional. |
| Date picker for "Purchase Date" is a plain HTML `<input type="date">` | Medium | On iOS, this renders a native date wheel picker, which is good. On Android, it renders a system date picker dialog, which can be inconsistent with app design. Consider using a consistent in-app date picker component. |
| Keyboard type is wrong on Price field | Medium | The CurrencyInput component should use `inputMode="decimal"` to show the numeric keyboard with decimal point on both iOS and Android. Check that this attribute is set. |
| `AddDevices.tsx` (bulk add flow) is 40KB — the largest non-detail page | Medium | This file is very large. Consider splitting the bulk add steps into separate components for readability and performance (code splitting). |

---

### 4.5 Orders (Sales Orders)

**Status:** ✅ Feature-complete. Filtering, sorting, bulk actions, status chips all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Bulk action toolbar (select all, mark paid) overlaps the BottomNav on Android | High | Same safe-area issue as Inventory — the bulk action toolbar at the bottom needs bottom safe-area inset. |
| Order list "amount due" shows even for SETTLED orders (as ₹0) | Low | For settled orders, showing "Bal: ₹0" is redundant and adds visual noise. The balance display is already conditionally shown (`o.status !== 'SETTLED'`) — verify this renders correctly. |
| Order status pills don't use consistent sizing | Low | `OPEN`, `PARTIAL`, `SETTLED` chips have inconsistent padding leading to layout jitter when filtering. Use fixed-width chips. |
| No empty state for filtered results | Low | When filters produce 0 results (e.g., filtering for PARTIAL orders when none exist), the screen is blank rather than showing a contextual empty state ("No partial orders found. All orders are settled!"). |
| "Create Order" FAB is absent | Medium | The `+` action (create a new sales order) is only accessible via the Header Actions area. On mobile, a large FAB (Floating Action Button) pinned above the BottomNav is the conventional pattern and reduces thumb travel. |

---

### 4.6 Order Detail

**Status:** ✅ Feature-complete. Payment allocation, line items, GST, share, PDF generation all present. File is 71KB — the largest in the codebase.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| **File is 71KB (1,800+ lines)** — extreme complexity | High | `OrderDetail.tsx` is doing too much. The payment recording sheet, GST breakdown section, line items table, and timeline should each be split into separate sub-components. This is both a maintainability and a performance concern (slower initial render). |
| PDF generation uses `window.print()` which does not work on native iOS/Android | High | On Capacitor, `window.print()` either does nothing or shows a blank print dialog. The invoice PDF feature is **broken on mobile**. Needs a proper PDF library (e.g., `jspdf` with `html2canvas`) or a server-side Supabase Edge Function that returns a PDF blob shared via `@capacitor/share`. |
| Payment amount input on mobile — numeric keyboard absent | Medium | The payment `<input type="number">` may show a full keyboard on some Android devices. Use `inputMode="decimal"` on all currency inputs. |
| GST breakdown section is collapsed by default with no affordance | Low | The GST accordion shows a `ChevronDown` but first-time users may not know it's expandable. A label like "Tap to see GST breakdown" or a "Tax" badge with the total would guide users. |
| WhatsApp share opens in a new browser tab on native — breaking the flow | Medium | `navigator.share` fallback opens a system share sheet on native which is correct. But ensure the WhatsApp share deeplink (`https://wa.me/...`) uses the Capacitor Browser plugin rather than `window.open()` to avoid app context loss. |

---

### 4.7 Purchase Orders

**Status:** ✅ Feature-complete. Receiving flow, supplier payments, and PO status management are all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| `PurchaseOrderDetail.tsx` is 69 bytes — it's essentially empty | **CRITICAL** | The file contains almost no code (69 bytes). Either the component is using a shared `OrderDetail.tsx` via routing, or this is a stub that was never completed. Verify that `/purchase-orders/:id` renders correctly. If PO detail is using the sales Order Detail page, this should be documented. |
| Receiving flow ("Mark as Received") shows no IMEI verification step by default | Medium | When receiving a purchase order, the current flow allows marking items received without verifying IMEIs. Adding an optional IMEI scan step before marking received would improve inventory accuracy. |
| Supplier payment history per-order is absent | Low | The PO detail page shows total paid vs total owed, but no history of individual payments made. This is visible in CustomerDetail's "Payments" tab but missing from the PO context. |

---

### 4.8 Customers List

**Status:** ✅ Feature-complete. Fuse.js search, type filtering, tag filtering, Trade Network QR scan, AR balance display all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Tag filter pills overflow without visual indication on narrow screens | Low | The horizontal tag scroll does not show a fade gradient at the right edge to indicate there are more pills. Add a CSS `mask-image: linear-gradient(to right, black 80%, transparent)` to the pills container. |
| "GST" badge on customer card uses a very small font (`text-[8px]`) | Low | At `8px`, the "GST" label is barely readable on 2x screens and invisible on 1x screens. Increase to at minimum `text-[10px]` or use a dedicated icon. |
| Phone number shown in the list is not formatted | Low | Raw 10-digit numbers are shown (e.g., `9876543210`). Format as `98765 43210` for improved readability. |
| Call button (`tel:` link) fires without confirmation on mobile | Low | On mobile, tapping the phone icon directly initiates a call. Consider a 300ms delay or long-press to distinguish between tapping a card (navigate to detail) and tapping the call icon. Currently this is acceptable but adding a subtle haptic feedback on call icon tap would clarify intent. |
| No "Sort by" option | Medium | Users can search and filter by type/tag but cannot sort by Outstanding Balance, Last Activity, or Name. A sort control (in the header actions area) would be useful for businesses tracking AR. |

---

### 4.9 Customer Detail

**Status:** ✅ Feature-complete. Three tabs (Orders, Payments, Timeline), AR/AP balance, overdue banner, order sharing, Trade Network link, delete/edit all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| "Lifetime Value" stat (`lifetimeStats`) is computed but NOT displayed anywhere in the UI | High | The `lifetimeStats` object (total orders, lifetime value, avg order value) is computed in `useMemo` at line 153 but never rendered. This is a significant omission — a "Customer Stats" header card or summary section should display this data. |
| The Timeline tab has filter pills but they are visually small and easily missed | Low | The `ALL / ORDERS / PAYMENTS` filter pills appear inline without clear separation from the content. Add a sticky or prominently padded filter bar. |
| Overdue banner for orders past due date is only shown if `dueDate` is set | Medium | If `dueDate` is not set on an order (it's optional), overdue tracking simply doesn't work for that customer. Consider showing a separate "No Due Date Set" warning for unsettled orders older than 30 days. |
| Payment allocation sheet closes without confirmation if user navigates away | Low | If a user partially fills in the PaymentAllocationSheet and presses the Android back button, the form closes without warning. |
| Long customer names truncate with no tooltip | Low | Customer names that are very long (company names) are truncated with `truncate`. On desktop, a tooltip (`title` attribute) would reveal the full name. |
| "Delete Customer" is accessible to all admins with no soft-delete | High | `removeCustomer` dispatches immediately and navigates away. Per `TODO.md`, soft delete is planned. Until then, add a "TYPE THE CUSTOMER NAME TO CONFIRM" verification step in the delete dialog for safety. |

---

### 4.10 Ledger / Wallet

**Status:** ✅ Feature-complete. Swipeable card, AR/AP metrics, EOD summary, transaction list with FIFO allocations, date filter, all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Swipeable card uses `framer-motion` drag but has no swipe hint animation on first load | Low | The swipe indicator chevron animates (opacity pulse) but only on Card 1. New users may not discover Card 2 (Business Health). A more prominent first-load tutorial overlay (shown once, stored in localStorage) would help. |
| Date picker inputs in the custom range filter show native OS date pickers that look unstyled on Android | Medium | The `input[type="date"]` elements render the system date picker, which can appear with different styling across Android OEMs. The `[color-scheme:light]` class partially helps. Test on Samsung and Xiaomi devices where the OS date picker looks very different. |
| "Add Funds" and "Withdraw" actions are deeply nested behind the wallet icon tap | Medium | New users don't discover these actions easily. A dedicated `+` FAB or a split button row at the top of the ledger page ("+ Add Funds" | "− Withdraw") would make the core action more discoverable. |
| FIFO settlement expansion shows a spinner but no timeout/error state | Low | If `fetchAllocations` fails (network error), there is a `console.error` but no user-facing error message in the expanded row. |
| Filter chips (`All`, `Sales`, `Purchases`, `Repairs`) use `framer-motion` layoutId animation which is visually heavy on low-end Android | Low | Consider a simpler CSS transition for the active chip indicator on low-end devices. |
| `FeatureGate` wraps the AR/AP cards — but the gate renders nothing when the feature is locked, leaving an unexplained empty space | Medium | When `receivables` feature is not available, the AR/AP card grid disappears leaving a visual gap between the wallet card and the EOD summary. The `FeatureGate` with `badge` prop should still render a muted, blurred placeholder card explaining what the feature does. |

---

### 4.11 Analytics

**Status:** ✅ Feature-complete. All 5 charts (Revenue/Expenditure, Profit Margin, Brand Share, Payment Modes, Supplier Yields) are implemented plus the KPI hero card.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Period selector is a custom dropdown using `classList.toggle('hidden')` — not React-controlled state | High | `document.getElementById('analytics-period-menu')?.classList.toggle('hidden')` is a DOM manipulation in a React component. This bypasses React's virtual DOM and can cause sync issues. Replace with `useState` for the dropdown open state. |
| Charts in the Carousel do not show swipe dot indicators on iOS — dots are cut off | Medium | The Carousel `<CarouselContent>` overflow is clipped, but the pagination dots shown at the bottom of the chart card may be cut off on smaller iPhones (SE, mini). Test and add bottom padding to the chart card. |
| Recharts tooltips are styled with inline style objects — these won't adapt to dark mode | Medium | The `tooltipBg` and `tooltipBorder` variables are read from `useTheme()` correctly, but if the theme changes while the tooltip is open, it doesn't re-render. This is an edge case but worth noting. |
| "See All" link in "Common Issues" section is non-functional | High | The "See All" button is rendered as a `<span>` with no `onClick`. It has no navigation target. Either remove it or wire it to a filtered inventory view. |
| Analytics charts are not accessible to screen readers | Low | `<ResponsiveContainer>` charts have no `aria-label` or `role` attributes. Add descriptive aria labels to each chart container. |
| Quarterly and Half-Yearly periods are absent from the period selector UI | Medium | `selectCashflowSummary` accepts `quarterly` and `halfYearly` as `TimePeriod` values, but the `periods` array in `Analytics.tsx` only exposes `daily`, `weekly`, `monthly`, `annually`. The quarterly and half-yearly views are inaccessible. |
| No "No Data" illustration — just text | Low | "No data available for this period" and "Make some sales to see margin trends" are plain text. A small icon illustration would make the empty states more premium. |

---

### 4.12 Profile & Business Settings

**Status:** ✅ Feature-complete. Avatar picker, personal info, business identity, Trade Network QR + code share, security settings all present.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Avatar picker loads 16 avatars on every modal open using `Math.random()` — slow on low-end devices | Low | `generateRandomAvatars()` runs synchronously and generates 16 DiceBear SVGs on every `handleOpenAvatarModal` call. Move this to a `useMemo` or lazy-load avatars in batches. |
| Phone number field in Profile does not sync bidirectionally | Medium | `phone` state is populated from `session.user.user_metadata?.phone || tenant?.phone`. However, updating the phone in Business Identity (`handleUpdateBusiness`) updates `tenants.phone`, while updating in Personal Info (`handleUpdateProfile`) updates `auth.user_metadata.phone`. These are two separate sources of truth for the same piece of data. Consolidate. |
| No unsaved changes warning | Medium | If a user edits their business name and then navigates away without saving, changes are lost with no warning. Add a `useBeforeUnload` or equivalent prompt for unsaved changes. |
| GSTIN validation logic duplicated | Low | `isValidGstin()` is called in both `Profile.tsx` and `Customers.tsx` inline, with the same validation message pattern. The error display logic could be extracted into a `GstinInput` component. |
| The "Reset Onboarding Tour" dev tool is only visible to `isSuperAdmin` — but is still in production builds | Low | While correctly gated, dev tools in production are a bad practice. Consider moving this to a `__DEV__` guard or a separate admin route. |

---

### 4.13 Settings Page

**Status:** Needs review (`Settings.tsx` is 9.6KB — relatively small).

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Dark mode toggle is present but theme persists to `localStorage` only | Medium | When the app is uninstalled and reinstalled, dark mode preference is lost. Consider syncing the preference to `profiles.preferences` in Supabase so it follows the user. |
| Currency and locale settings are absent | Medium | The app is India-specific (₹ INR, `en-IN` locale) with hardcoded formatting throughout. For future international expansion, a locale setting should be centralized here. |
| "Data Export" is absent | Low | Users expect to be able to export their inventory/order data as CSV. This feature is not present or gated. |

---

### 4.14 Support Page

**Status:** `Support.tsx` is 24KB — more complex than expected for a support page.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Help articles are likely hardcoded — any update requires a new app release | Medium | If support content is in the component file, it should be moved to Supabase (or a CMS) so content can be updated without a deploy. |
| In-app chat (if present) may not work correctly on Capacitor native due to WebView sandboxing | Medium | Verify that any embedded chat widget (Intercom, Crisp, etc.) functions correctly on iOS and Android native. |

---

### 4.15 Onboarding

**Status:** `Onboarding.tsx` is 19KB — comprehensive.

| Issue / Enhancement | Priority | Description |
|---|---|---|
| Back button during onboarding on Android navigates to the login screen | High | The Android hardware back button during onboarding should navigate to the previous onboarding step, not exit the flow entirely. Trap the back gesture during onboarding. |
| Onboarding completion is tracked via `localStorage` AND `supabase profiles.onboarding_completed_at` | Low | Having two sources of truth (localStorage + DB) for onboarding state can cause a freshly-installed app to show onboarding even if the user has completed it on another device. Prefer DB as the single source of truth. |

---

## 5. Feature Implementation vs Feature Specification Gap

Based on `TODO.md` and the `FEATURE_GATES` in `usePlan.ts`, the following gate keys exist but the corresponding UI is **not implemented**:

| Feature Gate Key | Tier | Status | Description |
|---|---|---|---|
| `customer_pnl` | Pro+ | ❌ Gate exists, no UI | Per-customer Profit & Loss section is missing from `CustomerDetail.tsx`. The `lifetimeStats` data is computed but not displayed. |
| `bulk_invoice` | Enterprise | ❌ Gate exists, no UI | Multi-order batch PDF generation. No UI entry point exists. |
| `external_repair` | Pro+ | ❌ Gate exists, no UI | Send phone to external shop, `OUT_FOR_REPAIR` tracking. `PhoneDetail.tsx` has no "Send for Repair" action. |
| `phone_repair_link` | Enterprise | ❌ Gate exists, no UI | Link phone to repair ticket. Phase 5 of Repair Module. |
| `flow_repair` | Repair+ | ❌ Gate exists, routing stub only | The repair flow feature gate is defined but `BottomNav.tsx` doesn't conditionally show repair nav items. |
| `quarterly`/`halfYearly` analytics periods | All | ⚠️ Selector missing | Period selector in Analytics only shows 4 of the 6 defined time periods. |

---

## 6. Desktop (10% User Base) Discrepancies

Desktop users currently get the mobile layout stretched to full-screen width. Several pages have `md:max-w-5xl md:mx-auto` max-width constraints, which is better than full-stretch but still lacks true desktop UX patterns.

| Page | Desktop Issue | Recommended Fix |
|---|---|---|
| **Dashboard** | Metric cards stack vertically in a single column | Use `md:grid-cols-2 lg:grid-cols-4` for the metrics grid |
| **Inventory** | Cards in a single column | Use `md:grid-cols-2 lg:grid-cols-3` card grid for inventory |
| **Customers** | Already uses `md:grid-cols-2 lg:grid-cols-3` ✅ | Good — no change needed |
| **Analytics** | Charts are tall but narrow — wasted horizontal space | Use `md:grid-cols-2` for the chart pair (Revenue/Expenditure + Profit Margin side by side) |
| **Ledger** | Single-column transaction list | On `lg:` screens, consider a two-column layout (filters/summary on left, transaction list on right) |
| **Order Detail** | Long vertical scroll | On `lg:` screens, consider a two-panel layout (order info left, payment history right) |
| **Phone Detail** | Single-column, centered at `max-w-lg` | This is acceptable but the Finance/History tabs waste whitespace on desktop. A two-column layout (device info + finance) would be better. |
| **Profile** | Cards stack in single column | On `md:` and above, use a two-column card layout (Personal Info left, Business Info right) |
| **All pages** | `BottomNav` is hidden on desktop but no keyboard shortcuts exist | Add `Ctrl+1` through `Ctrl+5` keyboard shortcuts mapping to the main nav items for power users |

---

## 7. Accessibility & Internationalisation Gaps

| Gap | Severity | Details |
|---|---|---|
| Missing `aria-label` on icon-only buttons | Medium | Buttons with only an icon (edit, delete, share) throughout the app lack `aria-label` attributes. Screen readers will announce "button" with no context. |
| Focus rings removed or invisible | Medium | Many custom buttons use `outline-none` without a custom focus-visible ring. Keyboard and switch-control users cannot determine focused elements. Replace `outline-none` with `focus-visible:ring-2 focus-visible:ring-primary-500`. |
| Colour alone used to distinguish status | Medium | Order status, inventory status, and payment direction are communicated via colour only. Colourblind users (8% of males) cannot distinguish green (sold) from amber (in stock) without the text label. The text labels are present but very small (`text-[10px]`). |
| Currency formatting assumes `en-IN` locale globally | Low | `Intl.NumberFormat("en-IN", ...)` is hardcoded throughout. Indian users on devices set to `en-US` locale may see unexpected number formatting. |
| No RTL support | Low | The app is left-to-right only. Not an issue for the current Indian market but worth noting for future expansion. |
| Minimum touch target size | Medium | Several action icons (`size-8 = 32px`) are below the recommended 44×44px minimum touch target (Apple HIG) and 48×48dp (Material Design). At minimum, wrap in a larger transparent hit area. |

---

## 8. Priority Action Matrix

| # | Issue | Severity | Effort | Who Is Affected |
|---|---|---|---|---|
| 1 | Safe-area bottom gap (Android black bar + iOS whitespace) | 🔴 Critical | Medium | 90% Mobile |
| 2 | `PurchaseOrderDetail.tsx` is empty (69 bytes) — verify PO detail renders | 🔴 Critical | Low | All |
| 3 | "See All" link in Analytics is non-functional | 🔴 High | Low | All |
| 4 | Bulk action toolbar overlaps system UI on Android | 🔴 High | Low | Android |
| 5 | PDF generation broken on native iOS/Android (uses `window.print()`) | 🔴 High | High | 90% Mobile |
| 6 | Android back button dismisses page instead of closing modal | 🔴 High | Medium | Android |
| 7 | `lifetimeStats` computed but never rendered in CustomerDetail | 🟡 Medium | Low | All |
| 8 | Reject PENDING phone has no confirmation dialog | 🟡 Medium | Low | All |
| 9 | iOS Dynamic Island safe-area top padding on AppHeader | 🟡 Medium | Low | iOS |
| 10 | Analytics period dropdown uses DOM manipulation, not React state | 🟡 Medium | Low | All |
| 11 | `Quarterly` and `HalfYearly` periods missing from Analytics selector | 🟡 Medium | Low | All |
| 12 | Delete Customer has no soft-delete / name-confirm guard | 🟡 Medium | Medium | All |
| 13 | Desktop: Dashboard, Inventory, Ledger lack multi-column grid layouts | 🟡 Medium | Medium | 10% Desktop |
| 14 | All icon-only buttons missing `aria-label` | 🟡 Medium | Medium | Accessibility |
| 15 | Focus rings removed without visible replacement | 🟡 Medium | Medium | Accessibility |
| 16 | Android dark mode nav bar colour mismatch | 🟡 Medium | Low | Android |
| 17 | iOS camera permission string doesn't mention QR | 🟡 Medium | Low | iOS |
| 18 | `customer_pnl`, `bulk_invoice`, `external_repair` gates have no UI | 🟡 Medium | High | Pro/Enterprise users |
| 19 | Onboarding back button exits flow on Android | 🟡 Medium | Low | Android Onboarding |
| 20 | Minimum touch target size compliance (32px → 44px) | 🟡 Medium | Medium | 90% Mobile |

---

*Report generated via systematic component and page traversal of the Finventree v2.7 codebase.*
*For implementation questions, reference `TODO.md`, `docs/FEATURES.md`, and `docs/MOBILE_DEVELOPMENT.md`.*
