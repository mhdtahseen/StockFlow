# Codebase Concerns

**Analysis Date:** 2026-04-23

## Tech Debt

**Type Safety Debt Across Core Flows:**
- Issue: Widespread `any` usage and casting bypasses compile-time guarantees in inventory, ledger, sync, and page-level mapping logic.
- Files: `src/app/useOfflineSyncManager.ts`, `src/features/ledger/slice.ts`, `src/pages/OrderDetail.tsx`, `src/pages/CustomerDetail.tsx`, `src/components/ledger/LedgerComponents.tsx`
- Impact: Schema drift and payload-shape regressions compile successfully and fail at runtime, especially in offline reconciliation and finance screens.
- Fix approach: Define strict DTO/domain mapper types for Supabase rows and Redux actions, then remove `as any` in high-risk financial and sync paths first.

**Monolithic UI/Domain Files:**
- Issue: Large files mix data fetching, transformation, business rules, and rendering in single components.
- Files: `src/pages/AdminCatalog.tsx`, `src/pages/LedgerPage.tsx`, `src/pages/OrderDetail.tsx`, `src/pages/PhoneDetail.tsx`, `src/components/shared/BatchAddSheet.tsx`
- Impact: High change risk, difficult code review, and increased regression probability for small edits.
- Fix approach: Split by concern (query hooks, mappers, domain services, presentational components) and add boundaries with typed interfaces.

**Hydration and Sync Coupling:**
- Issue: Initial hydration and mutation syncing are tightly coupled with manual action-type allow/ignore logic.
- Files: `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`, `src/features/sync/slice.ts`
- Impact: New Redux actions can accidentally sync when they should not, or fail to sync when required.
- Fix approach: Add explicit action metadata for sync intent and centralize action-to-sync mapping in one typed registry.

## Known Bugs

**Outbox Actions Are Permanently Dropped After Retry Limit:**
- Symptoms: Failed mutations disappear after 5 retries without user intervention UI.
- Files: `src/app/useOfflineSyncManager.ts`, `src/features/sync/slice.ts`
- Trigger: Keep the app online with a persistently failing mutation (e.g., FK violation or malformed payload) until retry count reaches 5.
- Workaround: None in-product; user must manually recreate the lost action through UI re-entry.

**Auth Gate Can Be Driven by Local Flag Instead of Session Truth:**
- Symptoms: Protected routes can render when `stockflow_auth` is `true` even if current session is null/expired.
- Files: `src/App.tsx`, `src/context/AuthContext.tsx`, `src/pages/Login.tsx`
- Trigger: Stale `localStorage` auth flag combined with delayed auth refresh.
- Workaround: Clearing local storage (`stockflow_auth` and persisted root state) forces a clean auth state.

## Security Considerations

**Client-Side Auth Trust Surface:**
- Risk: Route protection partially relies on client-controlled `localStorage` flag (`stockflow_auth`), which is mutable in browser context.
- Files: `src/App.tsx`, `src/context/AuthContext.tsx`
- Current mitigation: Supabase session checks still run in auth context and backend policies enforce data access.
- Recommendations: Remove local flag from authorization decisions; gate only on validated Supabase session/profile state.

**Verbose Runtime Logging of Sensitive Workflows:**
- Risk: Console logs in public-share and sync flows can expose operational details (error internals, token-flow behavior) to browser observers.
- Files: `src/pages/PublicView.tsx`, `src/services/shareService.ts`, `src/app/supabaseApi.ts`, `src/app/supabaseMiddleware.ts`
- Current mitigation: No explicit log redaction strategy detected.
- Recommendations: Route logs through environment-aware logger; redact database error details and token-related diagnostics in production.

## Performance Bottlenecks

**Full Catalog Scans With Client-Side Materialization:**
- Problem: Catalog loaders page through entire `catalog_models_v2` and materialize full arrays/maps in memory before rendering.
- Files: `src/hooks/useDeviceCatalog.ts`, `src/pages/AdminCatalog.tsx`
- Cause: `while (hasMore)` fetch loops with batch accumulation (`allModels`) and broad selection patterns.
- Improvement path: Server-side filtering/pagination, partial field fetches, and incremental UI rendering with virtualization.

**Broad `select("*")` Usage in Interactive Screens:**
- Problem: Multiple screens request all columns from Supabase tables even when subset fields are needed.
- Files: `src/pages/AdminCatalog.tsx`, `src/pages/OrderDetail.tsx`, `src/app/useOfflineSyncManager.ts`, `src/pages/AdminApprovals.tsx`, `src/pages/AdminNotifications.tsx`
- Cause: Convenience querying without projection contracts.
- Improvement path: Define query-specific column projections and typed selectors per feature surface.

## Fragile Areas

**Order Lifecycle + Ledger Joining Logic:**
- Files: `src/pages/OrderDetail.tsx`, `src/features/ledger/slice.ts`, `src/app/supabaseApi.ts`
- Why fragile: Multiple ID-shape fallbacks (`camelCase` vs `snake_case`) and ad-hoc mapping create hidden coupling between DB schema and UI assumptions.
- Safe modification: Introduce a single mapper layer for order/ledger normalization and enforce it before state insertion.
- Test coverage: No automated tests detected for order-ledger reconciliation behavior.

**Offline-First Sync Orchestration:**
- Files: `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`, `src/features/sync/slice.ts`
- Why fragile: Async middleware side effects, queue timing, retry scheduling, and hydration guards interact through implicit sequencing.
- Safe modification: Add deterministic sync-state machine tests and isolate queue processing from React lifecycle effects.
- Test coverage: No automated sync retry/outbox durability tests detected.

## Scaling Limits

**Redux Persisted State Growth:**
- Current capacity: Entire inventory, ledger, customers, purchasing, billing, and sync slices are persisted as one root payload.
- Limit: Large tenants increase startup hydration time, storage footprint, and merge complexity during online/offline transitions.
- Scaling path: Persist only critical slices, archive historical records, and adopt paginated/virtualized feature stores.

**Single-Page Admin Data Management:**
- Current capacity: Admin catalog management keeps full dataset and operations in one page component.
- Limit: Large catalog size increases memory pressure and slows derived computations/search.
- Scaling path: Move to paginated endpoints, server-driven search, and split admin domains into isolated route modules.

## Dependencies at Risk

**`redux-persist` + Custom Sync Middleware Coupling:**
- Risk: Persisted queue semantics and runtime side effects can diverge under version/schema changes.
- Impact: Outbox replay inconsistencies and hard-to-diagnose sync regressions.
- Migration plan: Introduce versioned outbox schema migrations and contract tests for persisted action replay.

## Missing Critical Features

**Dead-Letter and Recovery UX for Failed Sync Actions:**
- Problem: No user-facing recovery flow exists for permanently failing sync entries.
- Blocks: Reliable offline-first operation and safe financial mutation recovery in production incidents.

**Automated Test Harness:**
- Problem: No test runner config or test files are present.
- Blocks: Safe refactoring of large financial, sync, and admin modules.

## Test Coverage Gaps

**Finance and Reconciliation Logic:**
- What's not tested: Ledger settlement generation, order payment updates, and PO receipt flows.
- Files: `src/features/ledger/slice.ts`, `src/app/supabaseApi.ts`, `src/components/shared/POConfirmSheet.tsx`, `src/pages/LedgerPage.tsx`
- Risk: Silent accounting drift or duplicate/missing entries during edge cases.
- Priority: High

**Authentication/Authorization Routing:**
- What's not tested: Protected-route behavior under stale local flags, session expiry, and role transitions.
- Files: `src/App.tsx`, `src/context/AuthContext.tsx`
- Risk: Access-state inconsistencies and user lockout/access confusion.
- Priority: High

**Offline Queue Durability and Retry Policy:**
- What's not tested: Exponential backoff behavior, retry cap handling, and rehydration after app restart.
- Files: `src/features/sync/slice.ts`, `src/app/useOfflineSyncManager.ts`, `src/app/supabaseMiddleware.ts`
- Risk: Data loss for failed mutations and non-deterministic sync outcomes.
- Priority: High

---

*Concerns audit: 2026-04-23*
