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
- **Analytics Patch**: Implemented dual-path checking for Time-on-Shelf metrics in `selectInventoryMetrics` to securely support new grouped `Trade Orders` alongside legacy direct cart sales.
- **To-Do Tracking**: Logged the required manual configuration for enabling `pg_cron` in the Supabase Dashboard.
