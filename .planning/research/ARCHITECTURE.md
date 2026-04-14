# Project Research: ARCHITECTURE.md

## High-Level Architecture

### Component Boundaries
- **PWA Core (React)**: Main business logic, scanning, and UI.
- **TWA Shell (Android)**: Native wrapper handling Deep Linking, App Shortcuts, and Bio-Auth (via WebAuthn).
- **Service Worker (Workbox)**: Asset caching and background sync for the Sync Outbox.
- **Financial Engine**: State-managed ledger logic that reconciles the 4 buckets against Supabase snapshots.

### Data Flow
1. **Transaction Entry**: User records sale/purchase (Redux State update).
2. **Outbox Persistence**: Transaction added to IndexedDB (localforage).
3. **Background Sync**: Service Worker attempts sync to Supabase when online.
4. **P&L Aggregation**: View layer calculates "On-Hand" vs "Sold" margins from the local validated state.

### Suggested Build Order
1. **Scanner Optimization**: Resolve accuracy/latency before adding more scanner-dependent features.
2. **Ledger Robustness**: Ensure P&L math is solid before TWA deployment.
3. **Android Shell (PWABuilder)**: final wrapper and splash screen integration.
