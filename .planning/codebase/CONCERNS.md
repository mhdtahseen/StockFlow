# Concerns

## 1. Technical Debt (Deferred Items)
As of `todo.md` (2026-03-24):
- **Payments**: Razorpay integration is pending (Phase 6).
- **UX**: Skeleton loading states and page transitions are deferred to keep the bundle small.
- **Haptics**: Native haptic feedback for mobile actions is not yet implemented.

## 2. Potential Risks
- **Redux Scalability**: Large datasets of historical orders are currently mitigrated by "lazy-fetch" from Supabase in `OrderDetail.tsx`. As data grows, more aggressive pagination/virtualization will be required project-wide.
- **Offline Sync Edge Cases**: While a 5-retry cap exists, permanent synchronization failures (Dead Letter Queue) need a formal UI for user intervention/manual resolution.
- **Supabase Dependency**: High reliance on PL/pgSQL RPC logic means database migrations are critical path items that require careful versioning.

## 3. Financial Complexity
- **Consistency**: Maintaining the "4-bucket" accounting model requires strict adherence to ledger entry conventions. Deviations can cause reconciliation mismatches between inventory value and ledger cash flow.
