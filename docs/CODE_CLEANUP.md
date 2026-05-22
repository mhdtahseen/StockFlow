# StockFlow — Code Cleanup Plan

**Prepared**: June 2025  
**Branch**: `chore/monorepo-setup`  
**Scope**: `apps/app/src/`, root `src/`, `scratch/`  
**Status**: Documentation pass — no changes applied yet

---

## Overview

This document is the result of a full dead code, redundant code, commented code, and debug statement audit across the StockFlow app codebase. Each item is categorised, explained, and accompanied by a plan, reason, and consequences.

Items are grouped by type and ordered by impact/risk (highest priority first within each category).

---

## Summary Table

| # | Item | Category | File(s) | Priority |
|---|------|----------|---------|----------|
| 1 | Legacy root `src/` directory | Dead files | `src/` (10 files) | 🔴 High |
| 2 | `scratch/` developer scratchpad | Dead files | `scratch/` (3 files) | 🔴 High |
| 3 | `AddPhoneUpdate.tsx` — unrouted page | Dead file | `apps/app/src/pages/` | 🔴 High |
| 4 | 11× duplicate `formatCurrency` | Redundant utility | 9 page/component files | 🟡 Medium |
| 5 | Unused billing/purchasing selectors | Dead exports | 2 Redux selector files | 🟡 Medium |
| 6 | 5 unused icon imports in Dashboard | Unused import | `Dashboard.tsx` | 🟢 Low |
| 7 | `ArrowDownLeft` in Ledger | Unused import | `Ledger.tsx` | 🟢 Low |
| 8 | `SearchResult` type in Support | Unused import | `Support.tsx` | 🟢 Low |
| 9 | Commented sticky-header block — AddPhoneUpdate | Commented code | `AddPhoneUpdate.tsx` | 🟢 Low |
| 10 | Commented sticky-header block — AddDevices | Commented code | `AddDevices.tsx` | 🟢 Low |
| 11 | Commented plan-badge block — AppDrawer | Commented code | `AppDrawer.tsx` | 🟢 Low |
| 12 | Commented table `<thead>` — OrderPrintView | Commented code | `OrderPrintView.tsx` | 🟢 Low |
| 13 | Orphan `AppGate` comment markers — App.tsx | Commented code | `App.tsx` | 🟢 Low |
| 14 | Debug `console.log` in PublicView | Debug log | `PublicView.tsx` | 🟢 Low |
| 15 | Debug `console.log` in usePushNotifications | Debug log | `usePushNotifications.ts` | 🟢 Low |

> **Note on `console.error` / `console.warn` statements:** 44 other console statements exist in the codebase (auth errors, sync failures, OCR failures, etc.). These are **intentional error-handling logs** — they aid production debugging on mobile where no DevTools are available. They are **not included** in this cleanup plan.

> **Note on `usePlan.ts` TODO comment:** `bulk_invoice: ["enterprise"], // TODO: not yet built` is kept — it accurately tracks a genuinely unbuilt feature gate and should remain until that feature ships.

---

## Category A — Dead Files

### Item 1 — Legacy root `src/` directory

**What it is:**  
A root-level `src/` directory that is a leftover from before the monorepo was restructured under `apps/app/`. It contains 10 files that are exact or near-exact copies of files that now live in `apps/app/src/`.

**Files inside it:**
```
src/
  main.tsx
  app/
    store.ts
    useOfflineSyncManager.ts
  components/
    ImeiScannerModal.tsx
    SplashScreen.tsx
  hooks/
    useHaptics.ts
    usePushNotifications.ts
  pages/
    CustomerDetail.tsx
    OrderDetail.tsx
    PhoneDetail.tsx
```

**Plan:**  
Delete the entire `src/` directory at the workspace root.  
Before deleting, confirm none of these files are referenced in any `tsconfig.json`, `vite.config.ts`, or `package.json` import path.

**Reason:**  
The real application entry point is `apps/app/index.html` → `apps/app/src/main.tsx`. The root `src/` is never built, never imported, and never bundled. It exists purely as an artefact of the pre-monorepo layout. It creates confusion about which version of a file is authoritative (e.g. `useHaptics.ts` in root `src/hooks/` vs. the actively maintained one in `apps/app/src/hooks/`).

**Consequences:**
- ✅ **Benefit**: Eliminates ambiguity about which files are the source of truth. Reduces cognitive overhead when navigating the repo. Prevents future edits from being made in the wrong location.
- ✅ **Benefit**: Removes 10 files (~1,500–2,000 lines) that TypeScript's `tsconfig.base.json` may inadvertently include in type-checking, causing phantom type errors.
- ⚠️ **Risk**: Very low. Verify with `grep -r "from.*src/" tsconfig*.json vite.config.ts` that no config references the root path directly.
- 🔗 **No runtime impact** — these files are not imported by anything in the live app.

---

### Item 2 — `scratch/` developer scratchpad directory

**What it is:**  
A `scratch/` directory at the workspace root containing three developer utility files that were used during development but have no place in the production codebase.

**Files inside it:**
```
scratch/
  OrderDetail_old.tsx    (~old version of the page, pre-refactor)
  check_tags.js          (script for checking Supabase tags)
  check_tags.py          (Python version of the same tag-checker)
```

**Plan:**  
Delete the entire `scratch/` directory.  
If historical reference value is needed, these are already in Git history.

**Reason:**  
- `OrderDetail_old.tsx` is explicitly named "old" and replaced by the current `apps/app/src/pages/OrderDetail.tsx` (1,650+ lines). Keeping it creates a false reference point.
- `check_tags.js` / `check_tags.py` are one-off diagnostic scripts. Their logic, if ever needed again, belongs in `scripts/` with a clear name and documentation — not in a catch-all scratch folder.

**Consequences:**
- ✅ **Benefit**: Removes developer noise from the repo. Prevents reviewers from mistaking scratch content for production code.
- ✅ **Benefit**: Reduces repo size (the old OrderDetail.tsx alone is significant).
- ⚠️ **Risk**: None. All three files are unreferenced by any build tool, import, or test.
- 🔗 **No runtime impact**.

---

### Item 3 — `AddPhoneUpdate.tsx` — unrouted page

**What it is:**  
`apps/app/src/pages/AddPhoneUpdate.tsx` (~750 lines) is a full-featured page for updating an existing device record. It handles hybrid payment channels, IMEI editing, tag management, and FK-safe Redux dispatch — identical in pattern to `CreateOrderSheet.tsx`.

**Plan:**  
Two options:
1. **Wire it** — add a route in `App.tsx` (e.g. `/inventory/:id/edit`) and link to it from `PhoneDetail.tsx` or `Inventory.tsx`. This is the correct long-term path.
2. **Delete it** — if editing a device record is handled inline or is not a planned near-term feature.

Before deleting, check whether any `useNavigate("/inventory/:id/edit")` calls exist anywhere. (Audit confirms: none found.)

**Reason:**  
No `<Route>` exists for this page in `App.tsx`. No `useNavigate`, `<Link>`, or `href` anywhere in the codebase points to it. The file is effectively unreachable at runtime — it is dead code from a user's perspective. Three comments in `CreateOrderSheet.tsx` reference it as a pattern, but those are code-style comments, not imports.

**Consequences:**
- ✅ **Benefit (delete path)**: Eliminates ~750 lines of unmaintained code that will silently drift out of sync with the data model.
- ✅ **Benefit (wire path)**: Delivers a completed edit-device flow that currently doesn't exist in the app.
- ⚠️ **If deleted**: The "edit device" use case has no UI. Users must delete and re-add a device to correct a mistake. This is acceptable only if the feature is explicitly not planned.
- ⚠️ **If wired**: Needs a review pass — payment state, form validation, and error handling should be tested against the current data model before shipping.
- 🔗 **No runtime impact** in either case — the page is currently unreachable.

---

## Category B — Redundant Utility

### Item 4 — 11× duplicate `formatCurrency` function

**What it is:**  
Every file that needs to display a currency amount defines its own local function:

```ts
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
```

This pattern appears in **11 files** across `apps/app/src/` and `apps/admin/src/`:

| File | Location |
|------|----------|
| `apps/app/src/pages/Dashboard.tsx` | L117 |
| `apps/app/src/pages/Analytics.tsx` | L70 |
| `apps/app/src/pages/Ledger.tsx` | L124 |
| `apps/app/src/pages/Inventory.tsx` | L121 |
| `apps/app/src/pages/PhoneDetail.tsx` | L126 |
| `apps/app/src/components/shared/InvoicePrintable.tsx` | L37 |
| `apps/app/src/components/shared/PurchaseOrderPrintable.tsx` | L37 |
| `apps/app/src/components/shared/SalesInvoicePrintable.tsx` | L37 |
| `apps/app/src/components/shared/OrderPrintView.tsx` | L15 |
| `apps/admin/src/app/overdue/page.tsx` | L74 |
| `apps/admin/src/app/financials/page.tsx` | L57 |

**Plan:**  
1. Create `packages/shared/src/formatCurrency.ts`:
   ```ts
   export const formatCurrency = (amount: number): string =>
     new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
   ```
2. Export it from `packages/shared/src/index.ts`.
3. Replace all 11 local definitions with `import { formatCurrency } from "@stockflow/shared"`.
4. Delete the 11 local definitions.

**Reason:**  
DRY violation. If the currency, locale, or formatting options ever need to change (e.g. adding `minimumFractionDigits`, or supporting multi-currency), the change must be made in 11 places. One missed update would cause inconsistent display across the app.

**Consequences:**
- ✅ **Benefit**: Single point of change for all currency display formatting in the app.
- ✅ **Benefit**: Removes ~22 lines of boilerplate across 11 files.
- ✅ **Benefit**: `packages/shared` already exists in the monorepo — no new package required.
- ⚠️ **What changes**: Each of the 11 files gains one import line. No JSX or logic changes.
- ⚠️ **Risk**: Very low. The function signature and output are identical to all 11 local definitions. A simple find-replace after adding the export is sufficient.
- 🔗 **No runtime impact** — the formatting logic is byte-for-byte identical.

---

## Category C — Unused Redux Selectors

### Item 5 — `selectARSummary`, `selectOpenOrders`, `selectAPSummary`, `selectOpenPurchaseOrders`

**What it is:**  
Four exported selector functions in two Redux feature files that are never imported anywhere in the application:

| Selector | File | Description |
|----------|------|-------------|
| `selectARSummary` | `apps/app/src/features/billing/selectors.ts` L23 | Computes accounts-receivable summary from orders slice |
| `selectOpenOrders` | `apps/app/src/features/billing/selectors.ts` L11 | Filters orders to open/unpaid status |
| `selectAPSummary` | `apps/app/src/features/purchasing/selectors.ts` L23 | Computes accounts-payable summary from purchase orders |
| `selectOpenPurchaseOrders` | `apps/app/src/features/purchasing/selectors.ts` L11 | Filters POs to open/unpaid status |

**Plan:**  
Remove these four exported functions from their respective selector files. If the logic is ever needed, it can be reconstructed from the slice state (it's simple filter/reduce logic).

**Reason:**  
These selectors were likely written in anticipation of a dedicated AR/AP summary panel or dashboard widget that was never built. Because they are exported, TypeScript won't flag them as unused — they silently remain forever unless audited manually. Unused memoised selectors (if using `reselect`) waste computation on every Redux state change.

**Consequences:**
- ✅ **Benefit**: Reduces dead surface area in the Redux layer. Future developers won't wonder which component is using them.
- ✅ **Benefit**: If the selectors use `createSelector` (reselect), removing them eliminates memoised cache entries that are computed but never read.
- ⚠️ **What changes**: 4 exported names disappear from the billing and purchasing selector modules.
- ⚠️ **Risk**: Very low. Grep the whole codebase for each name before deleting. Audit confirmed zero imports.
- 🔗 **No runtime impact**.

---

## Category D — Unused Imports

### Item 6 — 5 unused icon imports in `Dashboard.tsx`

**What it is:**  
Five `lucide-react` icon imports in `apps/app/src/pages/Dashboard.tsx` (lines 21–28) that are not referenced anywhere in the component's JSX or logic:

```ts
import { Sun, Moon, Monitor, Download, Palette } from "lucide-react";
```

None of `Sun`, `Moon`, `Monitor`, `Download`, or `Palette` appear anywhere else in the file.

**Plan:**  
Remove these five names from the `lucide-react` import line. The import line itself should remain (other icons from the same package are used).

**Reason:**  
These icons are remnants of a theme-switcher UI (light/dark/system modes) that was moved into a dedicated settings page or context. The import line was not cleaned up when the feature was extracted. Unused imports add noise to the file header and can mislead developers into thinking these icons are in use.

**Consequences:**
- ✅ **Benefit**: Cleaner import section. Tree-shaking already removes unused icons from the bundle, so no bundle-size impact.
- ⚠️ **What changes**: The import line shrinks. No other change to the file.
- 🔗 **No runtime impact**.

---

### Item 7 — `ArrowDownLeft` in `Ledger.tsx`

**What it is:**  
`ArrowDownLeft` is imported from `lucide-react` in `apps/app/src/pages/Ledger.tsx` (line 34) but never used in the file's JSX or logic.

**Plan:**  
Remove `ArrowDownLeft` from the import line.

**Reason:**  
Likely a leftover from an earlier design iteration of the ledger entry list (credit/debit arrow icons). The current design uses different iconography. Dead imports in large files (Ledger.tsx is ~1,100 lines) are easy to miss.

**Consequences:**
- ✅ **Benefit**: Removes misleading import. No functional change.
- 🔗 **No runtime impact**.

---

### Item 8 — `SearchResult` type in `Support.tsx`

**What it is:**  
`apps/app/src/pages/Support.tsx` imports two types on line 22:

```ts
import type { FaqItem, SearchResult } from "...";
```

`FaqItem` is used (line 349). `SearchResult` is **never used** — it does not appear anywhere in the file's type annotations, function signatures, or JSX.

**Plan:**  
Remove `SearchResult` from the type import. Keep `FaqItem`.

**Reason:**  
The `SearchResult` type was imported in anticipation of a typed search state variable that was either inlined or typed differently. Because it's a `type` import, it has zero runtime cost, but it creates confusion about what the `SearchResult` shape is and whether it's supposed to be in use.

**Consequences:**
- ✅ **Benefit**: Eliminates a dangling type reference.
- 🔗 **No runtime or bundle impact** (type-only import).

---

## Category E — Commented-Out Code

### Item 9 — Commented sticky header in `AddPhoneUpdate.tsx`

**What it is:**  
Lines 317–333 of `apps/app/src/pages/AddPhoneUpdate.tsx` contain a JSX block wrapped in `{/* ... */}` — a sticky page header with a back button (`ChevronLeft`), page title, and subtitle. It was the original page-level header, replaced by the app-level `AppHeader` component.

**Plan:**  
Delete the commented block (lines 317–333).

**Reason:**  
The `AppHeader` component in `AppLayout.tsx` renders the page title globally. The per-page sticky header was a pre-layout-refactor pattern. The comment serves no documentation purpose — it is dead JSX.

**Consequences:**
- ✅ **Benefit**: ~17 lines removed from an already dense file. No ambiguity about whether the comment should be re-enabled.
- 🔗 **No runtime impact** — commented code is never executed.

---

### Item 10 — Commented sticky header in `AddDevices.tsx`

**What it is:**  
Lines 330–344 of `apps/app/src/pages/AddDevices.tsx` contain an identical sticky page header block to Item 9, also commented out. Same pattern, same reason.

**Plan:**  
Delete the commented block (lines 330–344).

**Reason:**  
Identical to Item 9 — replaced by `AppHeader`. Keeping both creates a false suggestion that the pattern might be revived per-page.

**Consequences:**
- ✅ **Benefit**: ~15 lines removed.
- 🔗 **No runtime impact**.

---

### Item 11 — Commented plan badge in `AppDrawer.tsx`

**What it is:**  
Lines 310–316 of `apps/app/src/components/layout/AppDrawer.tsx` contain a commented-out `<div>` that displays a `Crown` icon and the tenant's plan name (`{PLAN_LABELS[plan] ?? ...}`). It was likely removed from the drawer footer during a UI simplification pass.

**Plan:**  
Delete the commented block (lines 310–316).

**Reason:**  
The plan badge is displayed elsewhere in the app (the `UpgradePrompt` and `Pricing` page already handle plan status visibility). The comment has been dead for multiple sprints. If the drawer footer badge is ever needed again, it can be rebuilt from the existing `usePlan` hook.

**Consequences:**
- ✅ **Benefit**: ~7 lines removed from a high-traffic layout component.
- ⚠️ **If re-adding later**: Use `usePlan()` and the `PLAN_LABELS` constant already defined in the app — both are stable.
- 🔗 **No runtime impact**.

---

### Item 12 — Commented `<thead>` in `OrderPrintView.tsx`

**What it is:**  
Lines 151–161 of `apps/app/src/components/shared/OrderPrintView.tsx` contain a commented-out `<thead>` row with 6 `<th>` columns (No., Description, HSN, Unit Price, GST %, Amount). The table body renders correctly without it — the decision was made to use a header-less table for the print layout.

**Plan:**  
Delete the commented `<thead>` block (lines 151–161).

**Reason:**  
The print layout intentionally omits the table header (cleaner invoice look). The comment has served no purpose since the decision was made. It confuses anyone who maintains the print template about whether the header should be shown.

**Consequences:**
- ✅ **Benefit**: Cleaner print template file. No ambiguity about the intended layout.
- ⚠️ **If the table header is ever needed**: The `<th>` labels are straightforward to reconstruct and are already documented in the print template's column structure.
- 🔗 **No runtime impact** — commented JSX.

---

### Item 13 — Orphan `AppGate` comment markers in `App.tsx`

**What it is:**  
Lines 133 and 192 of `apps/app/src/App.tsx` contain:

```jsx
{/* <AppGate> */}
  ...routes...
{/* </AppGate> */}
```

`AppGate` was a wrapper component that was planned to gate all authenticated routes behind a subscription/feature check. The component no longer exists — it was either renamed, merged into `AppLayout`, or abandoned.

**Plan:**  
Delete both comment lines (133 and 192).

**Reason:**  
These are orphan markers — the referenced component doesn't exist and the markers carry no actionable information. Anyone reading `App.tsx` today will search for `AppGate` and find nothing, wasting time.

**Consequences:**
- ✅ **Benefit**: `App.tsx` reads more clearly — no ghost components.
- ⚠️ **If AppGate is ever needed**: The subscription/plan gating logic now lives in `FeatureGate.tsx` and the `usePlan` hook, which are the correct places.
- 🔗 **No runtime impact**.

---

## Category F — Debug Console Statements

> Only `console.log` statements (debug noise) are listed here. The 44 `console.error` and `console.warn` calls in the codebase are **legitimate error-handling logs** and are excluded from this plan.

### Item 14 — `console.log` in `PublicView.tsx`

**What it is:**  
Line 38 of `apps/app/src/pages/PublicView.tsx`:

```ts
console.log('Public fetch result:', result ? 'Success' : 'Not Found/Error')
```

This fires every time a customer opens a public share link.

**Plan:**  
Delete line 38.

**Reason:**  
This is a debug log added during development of the public share feature. It has no value in production — the `result` state variable is used to render the UI, so the information is already visible to the user. Every public link visit generates a console message, which is noise in production.

**Consequences:**
- ✅ **Benefit**: No debug output in production builds for public link visitors.
- ⚠️ **If debugging public link fetches**: Use the `console.error` on line 51 (already present) — it captures real failures.
- 🔗 **No runtime impact**.

---

### Item 15 — `console.log` in `usePushNotifications.ts`

**What it is:**  
Line 62 of `apps/app/src/hooks/usePushNotifications.ts`:

```ts
console.log('Push notifications not supported by this browser.')
```

This fires on every app load on browsers that don't support the Push API (e.g. iOS Safari WebView, most desktop browsers in development).

**Plan:**  
Delete line 62.

**Reason:**  
Non-support for push notifications is a normal, expected condition — it's not an error and not actionable. Logging it on every load creates console noise for developers and (if DevTools are open) misleads them into thinking something is wrong.

**Consequences:**
- ✅ **Benefit**: Cleaner console output. The surrounding logic already handles the non-support case silently (early return).
- 🔗 **No runtime impact**.

---

## Execution Order Recommendation

For a single focused cleanup PR, apply in this order:

1. **Dead files first** (Items 1–3) — highest impact, zero risk
2. **Unused imports** (Items 6–8) — two-minute fix, passes TypeScript immediately
3. **Commented code** (Items 9–13) — mechanical deletes, easy to review
4. **Debug logs** (Items 14–15) — one line each
5. **Unused selectors** (Item 5) — verify with grep before deleting
6. **Shared `formatCurrency`** (Item 4) — save for a separate PR; touches 11 files across two apps

---

## Out of Scope (Deliberately Excluded)

| Item | Reason excluded |
|------|----------------|
| 44× `console.error` / `console.warn` | Legitimate error-handling logs; valuable for mobile debugging |
| `bulk_invoice: ["enterprise"] // TODO` | Tracks a real unbuilt feature — keep until shipped |
| `AddPhoneUpdate.tsx` delete decision | Requires product decision (wire vs. delete) before action |
| Any refactoring of large pages (Ledger, OrderDetail) | Out of scope for cleanup pass; functional code |
| `apps/admin/` dead code | Not audited in this pass — separate audit recommended |
