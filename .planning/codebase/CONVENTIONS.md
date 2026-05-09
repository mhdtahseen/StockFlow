# Coding Conventions

**Analysis Date:** 2026-04-23

## Naming Patterns

**Files:**
- Use `PascalCase.tsx` for route pages and UI components in `src/pages` and `src/components` (examples: `src/pages/Inventory.tsx`, `src/components/shared/BatchAddSheet.tsx`).
- Use `camelCase.ts` for application and utility modules (examples: `src/app/supabaseMiddleware.ts`, `src/utils/financeUtils.ts`).
- Use domain-oriented filenames for Redux modules, primarily `slice.ts`, `types.ts`, and `selectors.ts` under `src/features/*` (examples: `src/features/inventory/slice.ts`, `src/features/ledger/selectors.ts`).

**Functions:**
- Use `camelCase` for functions, including hooks and helpers (examples: `syncActionToSupabase` in `src/app/supabaseApi.ts`, `useOfflineSyncManager` in `src/app/useOfflineSyncManager.ts`).
- Prefix React hooks with `use` (examples: `usePushNotifications` in `src/hooks/usePushNotifications.ts`, `useOfflineSyncManager` in `src/app/useOfflineSyncManager.ts`).
- Prefix selector factories/selectors with `select` (examples: `selectTrueProfit`, `selectCustomerBalance` in `src/features/ledger/selectors.ts`).

**Variables:**
- Use `camelCase` for locals and object fields in app-layer code (examples: `hasFetchedInitial`, `isProcessingOutboxRef` in `src/app/useOfflineSyncManager.ts`).
- Use explicit boolean naming (`is*`, `has*`) for flags (examples: `isOnline`, `hasLocalFlag`, `isSuperAdmin` in `src/App.tsx`).
- Use `SCREAMING_SNAKE_CASE` for module-level constants where values are effectively static (example: `PUBLIC_VAPID_KEY` in `src/hooks/usePushNotifications.ts`).

**Types:**
- Use `PascalCase` for interfaces and type aliases (examples: `Phone`, `InventoryState` in `src/features/inventory/types.ts`).
- Use union literals for constrained domain values (examples: `PhoneStatus` in `src/features/inventory/types.ts`).
- Use action payload typing via `PayloadAction<T>` in slices (example: `src/features/inventory/slice.ts`).

## Code Style

**Formatting:**
- Tool used: Not detected (no Prettier/Biome config found in repository root).
- Key settings inferred from source:
  - Trailing semicolons are common across TS/TSX modules (examples: `src/App.tsx`, `src/app/store.ts`).
  - Multi-line object/array formatting with trailing commas is common (examples: `src/main.tsx`, `src/app/useOfflineSyncManager.ts`).
  - Mixed quote style exists and should be normalized per-file when modifying code (double quotes in `src/App.tsx`; single quotes in `src/hooks/usePushNotifications.ts` and `src/lib/supabase.ts`).

**Linting:**
- Tool used: Not detected (no `.eslintrc*` or `eslint.config.*` found; no lint script in `package.json`).
- Key rules enforced through TypeScript in `tsconfig.json`:
  - `"strict": true`
  - `"noFallthroughCasesInSwitch": true`
  - `"moduleResolution": "bundler"`
  - `"baseUrl": "."` and alias path mapping for `"@/*": ["./src/*"]`

## Import Organization

**Order:**
1. External packages first (examples: `react`, `react-router-dom`, `@reduxjs/toolkit`).
2. Internal aliases (`@/...`) and app-local modules next (examples in `src/App.tsx`, `src/app/useOfflineSyncManager.ts`).
3. Side-effect/style imports last (example: `import "./index.css";` in `src/App.tsx` and `src/main.tsx`).

**Path Aliases:**
- Use `@` alias for `src`-root imports (configured in `tsconfig.json` and `vite.config.ts`).
- Prefer alias imports for cross-feature references (examples: `@/features/sync/slice`, `@/lib/supabase`).

## Error Handling

**Patterns:**
- Use `try/catch` around network and side-effect boundaries (examples: `syncActionToSupabase` in `src/app/supabaseApi.ts`, `togglePushNotifications` in `src/hooks/usePushNotifications.ts`).
- Return boolean/null fallback signals from service functions rather than rethrowing in UI-facing code paths (examples: `syncActionToSupabase` returns `boolean`; `lookupUnitByImei` returns `null` on failure in `src/app/supabaseApi.ts`).
- Distinguish known database error codes for idempotent retry behavior (example: handling `23505` and `23503` in `src/app/supabaseApi.ts`).

## Logging

**Framework:** `console`

**Patterns:**
- Use `console.warn` for recoverable sync and state issues (examples in `src/main.tsx`, `src/app/supabaseApi.ts`).
- Use `console.error` for failure diagnostics and exceptions (examples in `src/components/shared/ErrorBoundary.tsx`, `src/app/useOfflineSyncManager.ts`).
- Use informational logging for idempotent/expected non-fatal events (example: `console.info` in `src/app/supabaseApi.ts`).

## Comments

**When to Comment:**
- Add intent comments around high-risk data consistency logic and offline sync behavior (examples in `src/main.tsx`, `src/app/supabaseMiddleware.ts`, `src/app/supabaseApi.ts`).
- Keep inline comments short and operationally focused (examples: DB-trigger notes and hydration exclusions in `src/app/supabaseApi.ts` and `src/app/supabaseMiddleware.ts`).

**JSDoc/TSDoc:**
- Use selective block comments for exported selectors and API helpers (examples in `src/features/ledger/selectors.ts`, `src/app/supabaseApi.ts`).
- Full TSDoc coverage is not enforced; comments are pragmatic and uneven across modules.

## Function Design

**Size:** Large orchestration functions are accepted for integration boundaries (example: `syncActionToSupabase` in `src/app/supabaseApi.ts`), while UI helpers are typically short and focused (example: handlers in `src/components/ui/ReusableAutocomplete.tsx`).

**Parameters:** Strongly type function inputs for slice reducers and public helpers; permit `any` in RPC payload mapping hotspots where schema objects are dynamic (examples in `src/app/supabaseApi.ts` and `src/app/useOfflineSyncManager.ts`).

**Return Values:** Use explicit primitive/status returns for side-effect operations (`boolean`, `null`, arrays) to support retry and guard logic (examples in `src/app/supabaseApi.ts`).

## Module Design

**Exports:**
- Use `default` export for top-level React pages/components and Redux reducers (examples: `src/App.tsx`, `src/features/inventory/slice.ts`).
- Use named exports for actions, selectors, hooks, and utility functions (examples: `src/features/inventory/slice.ts`, `src/features/ledger/selectors.ts`, `src/app/supabaseApi.ts`).

**Barrel Files:** Not detected as a common pattern; modules are imported directly by file path.

---

*Convention analysis: 2026-04-23*
