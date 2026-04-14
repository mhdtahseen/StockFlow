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
- ✓ **v2.2 PO Invoicing**: Professional PDF generation with rejected items logic.
- ✓ **v2.2 Secure Sharing**: Token-based document sharing with 30-day expiry.

### Active (Milestone 3 - Production & Alpha Prep)
- [ ] **Android TWA Optimization**: Optimization for TWA (PWABuilder) wrapping (Phase 5).
- [ ] **Biometric Login**: WebAuthn/Passkey integration for fast checkout/access.
- [ ] **Multi-Tenant Security Audit**: Third-party review of RLS and isolation logic.

### Out of Scope (For Now)
- **Overhead Accounting**: Rent, electricity, and salaries are deferred to post-MVP 2.
- **Subscription Gatekeeping**: Moved to MVP 3.
- **Tenant-to-Tenant Transfers**: Moved to MVP 3.

## Key Decisions

| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **Separate PO Printable** | Keep the PO "Rejected Items" logic isolated from the Sales invoice code. | — Active |
| **Token-Based Sharing** | Ensure 30-day security without complex background cleanup jobs. | — Active |
| **TWA vs PWA** | Native feel on Android via Play Store deployment while maintaining web codebase. | — Active |
| **SAT OCR Logic** | Switched to Summed Area Tables (Integral Image) for O(N) thresholding to eliminate UI freezes. | — v2.1 |

## Evolution
Current Version: **v2.2** (Document Automation & Sharing)
Next Version: **v2.3** (Android TWA & Biometrics)

---
*Last updated: 2026-04-14 after Milestone 2 Activation*
