# Architecture

**Analysis Date:** 2026-04-23

## Pattern Overview

**Overall:** Feature-sliced React SPA with centralized Redux state, offline-first sync outbox, and Supabase-backed persistence.

**Key Characteristics:**
- Route-driven page composition is centralized in `src/App.tsx` and rendered through nested layouts in `src/components/layout/AppLayout.tsx`.
- Domain state is partitioned by Redux slices under `src/features/*/slice.ts` and unified in `src/app/store.ts`.
- Data writes follow optimistic local updates first, then asynchronous Supabase synchronization through `src/app/supabaseMiddleware.ts` and `src/app/supabaseApi.ts`.

## Layers

**Application Bootstrap Layer:**
- Purpose: Bootstraps runtime providers, persistence, and PWA lifecycle hooks.
- Location: `src/main.tsx`
- Contains: React root mounting, Redux `Provider`, `PersistGate`, React Query persist provider, service worker registration.
- Depends on: `src/app/store.ts`, `src/context/*`, `src/App.tsx`, Vite PWA runtime.
- Used by: Browser entrypoint (`index.html`).

**Routing and Access Control Layer:**
- Purpose: Declares route map and auth/admin route guards.
- Location: `src/App.tsx`
- Contains: `ProtectedRoute`, `AdminProtectedRoute`, nested route trees for app and admin paths.
- Depends on: `src/context/AuthContext.tsx`, `react-router-dom`, page modules in `src/pages/*`.
- Used by: `src/main.tsx`.

**Layout and App Shell Layer:**
- Purpose: Provides consistent shell, nav chrome, app-level hooks, and tenant/paywall gating.
- Location: `src/components/layout/*`
- Contains: `AppLayout`, `AppHeader`, `AppDrawer`, `BottomNav`, announcement banner.
- Depends on: `src/app/useOfflineSyncManager.ts`, `src/hooks/usePushNotifications.ts`, `src/hooks/usePlan.ts`, `src/context/AuthContext.tsx`.
- Used by: Root route element in `src/App.tsx`.

**Domain State Layer:**
- Purpose: Maintains business state for inventory, ledger, customers, purchasing, billing, tenant, sync.
- Location: `src/features/*/slice.ts`, `src/features/*/selectors.ts`, `src/features/*/types.ts`
- Contains: Redux Toolkit slices, action creators, selectors, domain types.
- Depends on: `@reduxjs/toolkit`, shared app types from `src/app/store.ts`.
- Used by: Pages/components and middleware (`src/app/supabaseMiddleware.ts`).

**Data Sync and Integration Layer:**
- Purpose: Maps Redux actions to Supabase writes and manages retryable outbox processing.
- Location: `src/app/supabaseMiddleware.ts`, `src/app/supabaseApi.ts`, `src/app/useOfflineSyncManager.ts`
- Contains: Action filtering, queueing, retry/backoff, RPC/table mutation mapping, initial hydration queries.
- Depends on: `src/lib/supabase.ts`, `src/features/sync/slice.ts`, feature action types, Supabase RPCs/tables.
- Used by: Redux store middleware chain and `AppLayout` initialization.

**Context and Session Layer:**
- Purpose: Tracks auth session, role flags, profile, and tenant metadata for cross-app access control.
- Location: `src/context/AuthContext.tsx`, `src/context/ThemeContext.tsx`
- Contains: React context providers and consumer hooks.
- Depends on: `src/lib/supabase.ts`, browser storage, toast notifications.
- Used by: Route guards, layout, pages, and feature hooks (for example `src/hooks/usePlan.ts`).

## Data Flow

**User Mutation Flow (Optimistic + Sync Queue):**

1. A page or sheet dispatches a domain action (for example from `src/pages/OrderDetail.tsx` or `src/components/shared/CreateOrderSheet.tsx`).
2. Slice reducer updates local Redux state immediately in `src/features/*/slice.ts`.
3. `src/app/supabaseMiddleware.ts` inspects action type, queues it in `sync.outbox`, and calls `syncActionToSupabase`.
4. `src/app/supabaseApi.ts` maps action type to Supabase table mutations or RPC calls and returns success/failure.
5. `src/features/sync/slice.ts` removes completed items or schedules retry with exponential backoff.

**Initial Hydration Flow:**

1. `src/components/layout/AppLayout.tsx` initializes `useOfflineSyncManager`.
2. `src/app/useOfflineSyncManager.ts` checks auth/session and online state.
3. If outbox is empty, it reads canonical datasets from Supabase and dispatches hydration actions like `inventory/setPhones`, `ledger/setEntries`, `purchasing/setPurchaseOrders`.
4. Hydration actions are ignored by sync middleware to prevent write loops.

**State Management:**
- Global app state uses Redux Toolkit in `src/app/store.ts` with `redux-persist` (`localforage`) and typed hooks from `src/app/hooks.ts`.
- Server query caching for selected hook-based reads is handled via React Query in `src/main.tsx` and hooks such as `src/hooks/useDeviceCatalog.ts`.

## Key Abstractions

**Feature Slice Abstraction:**
- Purpose: Encapsulate state transitions per business domain.
- Examples: `src/features/inventory/slice.ts`, `src/features/ledger/slice.ts`, `src/features/purchasing/slice.ts`
- Pattern: Redux Toolkit `createSlice` + colocated `types.ts` + optional `selectors.ts`.

**Outbox Sync Abstraction:**
- Purpose: Guarantee eventual write consistency between local state and Supabase.
- Examples: `src/features/sync/slice.ts`, `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`
- Pattern: Queue-first action persistence, idempotent sync handling, scheduled retries.

**Supabase Action Router Abstraction:**
- Purpose: Centralize action-to-API mapping and idempotency logic.
- Examples: `src/app/supabaseApi.ts`, `src/lib/supabase.ts`
- Pattern: Switch-on-action-type dispatcher invoking Supabase table operations and RPCs.

**Route Guard Abstraction:**
- Purpose: Control access by auth/session and role.
- Examples: `ProtectedRoute` and `AdminProtectedRoute` in `src/App.tsx`, role state from `src/context/AuthContext.tsx`
- Pattern: Wrapper components returning children or redirect `Navigate`.

## Entry Points

**Client Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser load of app bundle.
- Responsibilities: Provider composition, persistent store/query setup, PWA registration/update behavior.

**Route Entry Point:**
- Location: `src/App.tsx`
- Triggers: React render after provider initialization.
- Responsibilities: Route table composition, guarded route decisions, page module wiring.

**Sync Lifecycle Entry Point:**
- Location: `src/components/layout/AppLayout.tsx`
- Triggers: Authenticated app shell mount.
- Responsibilities: Starts offline sync manager and push notification hook.

**Backend Schema Entry Point:**
- Location: `supabase/migrations/*.sql`
- Triggers: Supabase migration execution.
- Responsibilities: Defines schema, RPC contracts, and transactional behavior that `src/app/supabaseApi.ts` calls.

## Error Handling

**Strategy:** Fail-safe local-first UX with deferred remote reconciliation and explicit retry.

**Patterns:**
- Sync errors are caught and converted into retry semantics in `src/app/supabaseMiddleware.ts` and `src/features/sync/slice.ts`.
- Supabase API errors are normalized with idempotency handling (`23505` or conflict) in `src/app/supabaseApi.ts` to avoid duplicate-write failures.
- Auth/session errors are guarded by initialization and fallback state transitions in `src/context/AuthContext.tsx`.

## Cross-Cutting Concerns

**Logging:** `console.warn`/`console.error`/`console.info` diagnostics are used in sync/auth/data modules such as `src/app/supabaseApi.ts` and `src/context/AuthContext.tsx`.
**Validation:** Type-level validation is primarily TypeScript domain interfaces in `src/features/*/types.ts`; form validation is component-level using `zod` + `react-hook-form` in page modules like `src/pages/Login.tsx`.
**Authentication:** Supabase auth session and profile-role checks are managed in `src/context/AuthContext.tsx`; route enforcement is in `src/App.tsx`.

---

*Architecture analysis: 2026-04-23*
