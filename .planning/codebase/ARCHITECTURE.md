# Architecture

## 1. Core Principles
- **Mobile-First Progressive Web App (PWA)**: Optimized for touch interaction, field use, and high performance on mobile browsers.
- **Offline-First Resilience**: All core data is cached in Redux/Localforage; transactions are queued in an outbox (`src/features/sync`) for delayed synchronization.
- **Multi-Tenancy**: Strict isolation between merchant tenants ensured by a global `tenant_id` state and Supabase RLS policies.

## 2. State Management (Redux Architecture)
- **Centralized Store**: All shared data (inventory, orders, customers) lives in the Redux store.
- **Feature Slicing**: Dividied into domain-specific slices (`billingSlice`, `inventorySlice`, `ledgerSlice`).
- **Persistence**: Hybrid approach using `redux-persist` for local persistence and `isSyncing` flags for network state.
- **Selectors**: Memoized selectors using `createSelector` to prevent unnecessary UI re-renders.

## 3. Financial Model (4-Bucket Strategy)
StockFlow uses a cash-basis financial model for real-world accuracy:
- **Ledger Groups**: Payments are categorized into four core buckets (Cash, Bank, Wallet, Credit).
- **Transaction Atomicity**: Ledger entries are cross-referenced with Sales/Purchase orders to ensure zero partial-payment leakage.

## 4. Database Layer (Supabase/PostgreSQL)
- **RPC Logic**: Complex domain logic (e.g., `link_phone_to_po`) is handled via PL/pgSQL RPCs for speed and consistency.
- **Hardened Functions**: `SECURITY DEFINER` functions with `SET search_path = ''` to prevent search path injection attacks.
