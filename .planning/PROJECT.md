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
- ✓ **v2.3 TWA Hardening**: Notch/safe-area support and native-feel integration.

- [ ] **Multi-Tenant Security Audit**: Final RLS/Isolation verification (Phase 5 Part 2).
- [ ] **Alpha Deployment Readiness**: Final performance, SEO, and vulnerability check.

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

## Current Milestone: v2.4 PO Stability & Lifecycle Management

**Goal**: Resolve critical data persistence issues, stabilize inspection/timeline logic, and implement full CRUD for Purchase Orders.

**Target features**:
- **PO Data Integrity**: Fix data loss on refresh and PR download.
- **Inspection Logic**: Stabilize inspection state and IMEI tracking.
- **Financial & Timeline**: Breakdown Note tabs and fix timeline ordering/payments.
- **PO Management**: Implement full Edit (with cascade) and Delete flows.
- **UI/UX Refinement**: Fix mobile autocomplete and share button.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

Current Version: **v2.4** (PO Stability & CRUD)
Next Version: **v2.5** (Expansion & Scaling)

---
*Last updated: 2026-04-14 after Milestone 2 Activation*
