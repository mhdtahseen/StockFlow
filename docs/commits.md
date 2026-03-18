# StockFlow Commit Log

## MVP 2

### Commit: feat(mvp2): complete phase 1 schema and phase 2 redux state syncing
**Date:** 2026-03-19

**Implemented Features & Changes:**
- **Database Schema (Phase 1)**: Added schema file `docs/schemas/005_mvp2_billing.sql` establishing tables for tracking counterparties, sale and purchase orders, order items, along with customer and supplier payments/allocations. Included requisite RLS policies and new helper RPCs.
- **Redux State Slices (Phase 2)**: 
  - Created new feature slices, typed interfaces, and selectors for `billing` (AR), `purchasing` (AP), and `customers` features.
- **Store Configuration**: Updated `src/app/store.ts` to merge the three new reducers and bumped `stockflow-root` persistence version to `2`.
- **Offline Sync Middleware**: Linked new slice actions in `supabaseApi.ts` and `supabaseMiddleware.ts` to sync offline actions directly with the new atomic RPC functions securely on the Supabase backend.
- **Data Hydration**: Augmented `useOfflineSyncManager.ts` to actively fetch open trade orders, active purchase orders, customer payments (last 30-days), and counterparty lists for the active tenant upon startup.
- **Auth Context**: Configured a lightweight 15-minute polling interval to dynamically track tenant plan changes seamlessly within the app.
- **To-Do Tracking**: Logged the required manual configuration for enabling `pg_cron` in the Supabase Dashboard.

### Commit: feat(mvp2): complete phase 3 navigation and feature gates
**Date:** 2026-03-19

**Implemented Features & Changes:**
- **Feature Gates**: Created `usePlan` hook and `FEATURE_GATES` config to restrict feature execution selectively depending on the `tenant.plan` setting.
- **Paywalls & Access Blocks**: Added `TrialExpiredPaywall.tsx` as a full overlay for expired plans, and `UpgradePrompt.tsx` to tease locked capabilities throughout the UI.
- **Side Drawer**: Built `AppDrawer.tsx`, a slide-in overlay menu rendering available/locked sections natively mapping back to new routes.
- **Bottom Navigation**: Cleaned up `BottomNav.tsx` down to just Dashboard, Add, and Menu to keep the app feeling spacious.
- **Layout & Routing**: Altered `AppLayout.tsx` and `App.tsx` installing the 7 minimal component stubs to guarantee routing integrity across Phase 4 pages `financials`, `ledger`, `customers`, `orders`, and `pricing`.
