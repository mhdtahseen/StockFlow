# Codebase Structure

**Analysis Date:** 2026-04-23

## Directory Layout

```text
StockFlow/
├── src/                 # React app source (routing, UI, state, sync, contexts)
├── supabase/            # Database migrations and edge-function scaffolding
├── public/              # Static assets and PWA artifacts served as-is
├── scripts/             # Data seed and SQL utility scripts
├── docs/                # Product/architecture/testing documentation
├── .planning/           # GSD planning artifacts and codebase maps
├── scratch/             # Experimental or temporary files
├── package.json         # npm scripts and dependency manifest
├── vite.config.ts       # Vite bundling, aliasing, and PWA setup
└── tsconfig.json        # TypeScript compiler options and path aliases
```

## Directory Purposes

**`src/`:**
- Purpose: Production frontend application code.
- Contains: App bootstrap, route pages, reusable components, Redux feature modules, contexts, hooks, utility modules.
- Key files: `src/main.tsx`, `src/App.tsx`, `src/app/store.ts`, `src/app/supabaseApi.ts`.

**`src/app/`:**
- Purpose: App-level wiring and infra logic.
- Contains: Redux store, typed hooks, sync middleware, Supabase sync API, offline sync manager.
- Key files: `src/app/store.ts`, `src/app/hooks.ts`, `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`.

**`src/features/`:**
- Purpose: Domain state modules organized by business capability.
- Contains: `slice.ts`, `types.ts`, and `selectors.ts` per feature.
- Key files: `src/features/inventory/slice.ts`, `src/features/ledger/selectors.ts`, `src/features/purchasing/slice.ts`, `src/features/sync/slice.ts`.

**`src/components/`:**
- Purpose: Shared UI and shell composition.
- Contains: `ui/` primitives, `shared/` workflows/sheets, `layout/` app shell.
- Key files: `src/components/layout/AppLayout.tsx`, `src/components/shared/CreateOrderSheet.tsx`, `src/components/ui/button.tsx`.

**`src/pages/`:**
- Purpose: Route-level screens.
- Contains: Dashboard/admin/auth/detail/list pages, each composing feature selectors and shared components.
- Key files: `src/pages/Dashboard.tsx`, `src/pages/LedgerPage.tsx`, `src/pages/OrderDetail.tsx`.

**`src/context/`:**
- Purpose: Cross-cutting runtime context providers.
- Contains: auth session/tenant context and theme mode context.
- Key files: `src/context/AuthContext.tsx`, `src/context/ThemeContext.tsx`.

**`supabase/`:**
- Purpose: Backend schema evolution and server-side logic source of truth.
- Contains: SQL migrations and function directory skeleton.
- Key files: `supabase/migrations/20260423_finance_integrity.sql`, `supabase/migrations/20260418_certify_po_atomic.sql`.

**`scripts/`:**
- Purpose: Seeder and SQL helper tooling for dataset/bootstrap operations.
- Contains: `.mjs`, `.ts`, and `.sql` seeds.
- Key files: `scripts/seed_catalog.ts`, `scripts/seed_catalog.mjs`, `scripts/batch_sql.mjs`.

**`.planning/codebase/`:**
- Purpose: Machine-consumable codebase reference docs used by GSD planning/execution.
- Contains: Architecture, structure, stack, integration, quality, concern maps.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Client bootstrap and provider composition.
- `src/App.tsx`: Route map and auth/admin guard logic.

**Configuration:**
- `package.json`: npm scripts (`dev`, `build`, `preview`) and dependencies.
- `tsconfig.json`: strict compiler settings and `@/*` alias.
- `vite.config.ts`: React + Tailwind + PWA plugin config and manual chunking.
- `components.json`: shadcn component generator configuration.
- `vercel.json`: deployment routing/config for Vercel.

**Core Logic:**
- `src/app/supabaseApi.ts`: Redux action to Supabase mutation/RPC adapter.
- `src/app/supabaseMiddleware.ts`: optimistic-sync orchestration and outbox queueing.
- `src/app/useOfflineSyncManager.ts`: connectivity, outbox processing, and hydration.
- `src/features/*/slice.ts`: domain reducers/actions.
- `src/features/*/selectors.ts`: derived domain metrics.

**Testing:**
- `docs/TESTING.md`: testing process documentation.
- `test-tenant.ts`: standalone tenant test script.
- Not detected: dedicated test directory with `*.test.*` or `*.spec.*` patterns in `src/`.

## Naming Conventions

**Files:**
- React components and pages use PascalCase filenames (for example `src/pages/CustomerDetail.tsx`, `src/components/shared/POConfirmSheet.tsx`).
- Feature state modules use lowercase canonical filenames (`slice.ts`, `types.ts`, `selectors.ts`) inside feature directories (for example `src/features/ledger/slice.ts`).
- App infrastructure modules use descriptive camelCase filenames (for example `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`).

**Directories:**
- Domain grouping under `src/features/<domain>/` (for example `src/features/customers/`, `src/features/purchasing/`).
- UI grouping by role under `src/components/layout/`, `src/components/shared/`, `src/components/ui/`.
- Top-level route screens under `src/pages/`.

## Where to Add New Code

**New Feature:**
- Primary code: create `src/features/<new-domain>/` with `slice.ts`, `types.ts`, and optional `selectors.ts`.
- Route screen: add page in `src/pages/` and register route in `src/App.tsx`.
- Supabase sync mapping (if mutation exists): add action handling in `src/app/supabaseMiddleware.ts` and `src/app/supabaseApi.ts`.
- Tests: project-specific automated test structure is not detected; add focused validation scripts near existing script patterns (for example `scripts/`) and update `docs/TESTING.md`.

**New Component/Module:**
- Shared workflow component: `src/components/shared/`.
- Layout/navigation component: `src/components/layout/`.
- Reusable primitive or atom: `src/components/ui/`.
- Domain-specific complex widget tightly bound to one page: colocate in page file first, then extract to `src/components/shared/` when reused.

**Utilities:**
- Shared helper logic: `src/utils/`.
- Domain-specific selectors/derived state: `src/features/<domain>/selectors.ts` rather than generic `src/utils/`.
- Cross-app hooks: `src/hooks/`.

## Special Directories

**`dist/`:**
- Purpose: Build output emitted by Vite.
- Generated: Yes.
- Committed: No.

**`.planning/`:**
- Purpose: Planning, roadmap, state, and generated analysis docs for GSD workflows.
- Generated: Partially (mixed manual + tool-generated artifacts).
- Committed: Yes.

**`scratch/`:**
- Purpose: Ad hoc experiments and temporary scripts.
- Generated: No (manual sandbox content).
- Committed: Mixed; treat as non-production unless promoted.

**`supabase/.temp/`:**
- Purpose: Local Supabase CLI temp/runtime files.
- Generated: Yes.
- Committed: No (should remain ephemeral).

---

*Structure analysis: 2026-04-23*
