# Testing Patterns

**Analysis Date:** 2026-04-23

## Test Framework

**Runner:**

- Not detected in app codebase (`package.json` has no `test` script; no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` at project root).
- Config: Not applicable

**Assertion Library:**

- Not detected

**Run Commands:**

```bash
Not configured for automated tests
Not configured for watch mode
Not configured for coverage
```

## Test File Organization

**Location:**

- No `*.test.*`, `*.spec.*`, or `__tests__` patterns detected for app modules under `src`.
- Ad-hoc validation scripts exist outside standard test layout (example: `test-tenant.ts`, `scripts/seed_catalog.ts`).

**Naming:**

- Not applicable for automated tests.
- Existing manual script naming uses descriptive script-style names (examples: `test-tenant.ts`, `scripts/seed_catalog.ts`).

**Structure:**

```text
No automated test directory structure detected
```

## Test Structure

**Suite Organization:**

```typescript
// Not detected: no describe()/it()/test() suites in application test files.
```

**Patterns:**

- Setup pattern: Manual setup embedded inline in scripts (example: env lookup and client setup in `test-tenant.ts`).
- Teardown pattern: Not detected as a formal pattern.
- Assertion pattern: Not detected; scripts rely on console output and runtime behavior.

## Mocking

**Framework:** Not detected

**Patterns:**

```typescript
// Not detected: no standardized mocking framework or mock modules found.
```

**What to Mock:**

- No repository-level guidance enforced by tooling.
- For future additions, follow existing integration boundaries and mock external services at `src/lib/supabase.ts` and side-effect wrappers in `src/app/supabaseApi.ts`.

**What NOT to Mock:**

- No repository-level guidance detected.
- Keep domain reducers/selectors deterministic and avoid mocking pure functions in `src/features/*/slice.ts` and `src/features/*/selectors.ts`.

## Fixtures and Factories

**Test Data:**

```typescript
// Current pattern is script-level data generation, not test fixtures:
// `scripts/seed_catalog.ts` builds SQL seed data from `src/data/deviceCatalog.ts`.
```

**Location:**

- No dedicated fixtures/factories directories detected.
- Data catalogs reused for operational seeding live in `src/data/*` and `scripts/seed_catalog.ts`.

## Coverage

**Requirements:** None enforced (no coverage tooling/config detected).

**View Coverage:**

```bash
Not configured
```

## Test Types

**Unit Tests:**

- Not detected in repository.
- Candidate unit-test targets based on pure logic: selectors and slice reducers in `src/features/*/selectors.ts` and `src/features/*/slice.ts`.

**Integration Tests:**

- Not detected as automated tests.
- Current integration verification occurs in runtime paths via middleware/services (examples: `src/app/supabaseMiddleware.ts`, `src/app/useOfflineSyncManager.ts`, `src/app/supabaseApi.ts`).

**E2E Tests:**

- Not used (no Playwright/Cypress configuration found).

## Common Patterns

**Async Testing:**

```typescript
// Manual async validation pattern (not formal tests):
// async functions + try/catch + console output in `test-tenant.ts`
// and network orchestration flows in `src/app/supabaseApi.ts`.
```

**Error Testing:**

```typescript
// Not detected as assertion-based tests.
// Current approach observes error handling behavior through logs in:
// `src/app/supabaseApi.ts`, `src/app/useOfflineSyncManager.ts`,
// `src/components/shared/ErrorBoundary.tsx`.
```

---

Testing analysis: 2026-04-23
