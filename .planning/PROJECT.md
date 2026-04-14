# StockFlow

## What This Is
A mobile-first, offline-resilient PWA designed for high-frequency inventory management and financial tracking in the retail sector. StockFlow bridges the gap between raw ledger accounting and physical inventory movement using a cash-basis "4-bucket" financial model.

## Core Value
**Inventory with Integrity**: Professional-grade P&L clarity with a native mobile experience (TWA) and AI-driven automated auditing.

## Target Audience
- Retail inventory managers
- **Independent electronics resellers** (specializing in IMEI-tracked devices)
- Multi-tenant merchant networks
- Small-scale wholesalers

## Requirements

### Validated (Brownfield - Existing Code)
- ✓ **High-Fidelity Listing UI**: Standardized Sales and Purchase Order list views.
- ✓ **v2.1 Scanner Persistence**: High-performance SAT OCR and Passive HUD pattern (Phase 1).
- ✓ **v2.1 Financial Watchtower**: Automated `extraReducer` audit engine (Phase 2).
- ✓ **Offline-First Resilience**: Redux/Localforage persistence with sync manager.
- ✓ **Multi-Tenancy**: Tenant ID isolation logic injected into database and state layers.

### Active (MVP 2 Release)
- [ ] **Android TWA Compatibility**: Optimization for TWA (PWABuilder) wrapping (Phase 3).
- [ ] **Native Auth**: WebAuthn passkey integration for secure TWA login.
- [ ] **Production CI/CD**: Setup deployment procedures for Vercel/Supabase (Phase 4).
- [ ] **Global UI Audit**: Glassmorphism and touch target consistency (Phase 5).

### Out of Scope (For Now)
- **Overhead Accounting**: Rent, electricity, and salaries are deferred to post-MVP 2.
- **Subscription Gatekeeping**: Moved to MVP 3.
- **Tenant-to-Tenant Transfers**: Moved to MVP 3.

## Key Decisions

| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **TWA vs PWA** | Native feel on Android via Play Store deployment while maintaining web codebase. | — Active |
| **SAT OCR Logic** | Switched to Summed Area Tables (Integral Image) for O(N) thresholding to eliminate UI freezes. | — v2.1 |
| **Passive HUD** | Use Ref-based direct DOM updates for scanner to avoid React re-render flicker. | — v2.1 |
| **Event-Driven Audit**| Ledger listens to business events globally (Watchtower) to eliminate manual entry errors. | — v1.2 |

## Evolution
Current Version: **v2.1** (Shipped 2026-04-14)

---
*Last updated: 2026-04-14 after v2.1 completion*
