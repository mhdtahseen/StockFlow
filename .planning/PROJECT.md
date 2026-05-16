# Finventree

> **Previously**: StockFlow. Rebranded May 2026.
> **Recent Changes**: See [docs/UPDATES.md](../docs/UPDATES.md) for the full 10-day change log.

## What This Is
A mobile-first, offline-resilient hybrid app (Capacitor iOS + Android + PWA) for high-frequency inventory management and financial tracking in electronics retail. Finventree connects merchants in a **Trade Network** — enabling inter-tenant stock transfers, shared business discovery via QR codes, and B2B financial settlements.

## Platforms
| Platform | URL | Stack |
| :--- | :--- | :--- |
| Mobile app (iOS/Android) | App Store / Play Store | Capacitor + Vite/React |
| Web app | `app.finventree.com` | Cloudflare Pages |
| Marketing / auth | `finventree.com` | Next.js static on Cloudflare |
| Admin panel | `admin.finventree.com` | Next.js static on Cloudflare |

## Core Value
**Inventory with Integrity**: Professional-grade P&L clarity with a native mobile experience and AI-driven automated auditing — now connected across merchant networks via Trade Network.

## Target Audience
- Retail inventory managers
- **Independent electronics resellers** (specializing in IMEI-tracked devices)
- Multi-tenant merchant networks — suppliers, retailers, wholesalers
- Small-scale wholesalers

## Requirements

### Validated (Brownfield - Existing Code)
- ✓ **High-Fidelity Listing UI**: Standardized Sales and Purchase Order list views.
- ✓ **v2.1 Scanner Persistence**: High-performance ZXing + Tesseract OCR pattern for IMEI scanning.
- ✓ **v2.1 Financial Watchtower**: Automated `extraReducer` audit engine.
- ✓ **Offline-First Resilience**: Redux/Localforage persistence with `@capacitor/network` sync manager.
- ✓ **Multi-Tenancy**: Tenant ID isolation via Supabase RLS and SECURITY DEFINER RPCs.
- ✓ **v2.2 PO Invoicing**: Professional PDF generation with rejected items logic.
- ✓ **v2.2 Secure Sharing**: Token-based document sharing with 30-day expiry.
- ✓ **v2.3 Capacitor Native**: Notch/safe-area, HashRouter, StatusBar, Keyboard, Splash, deep links.
- ✓ **v2.5 Phone Lifecycle**: Vertical history timeline and tabbed detail UI.
- ✓ **Rebrand**: StockFlow → Finventree (May 2026).
- ✓ **Monorepo**: Turborepo + pnpm workspaces (apps/app, apps/web, apps/admin).
- ✓ **Billing**: Razorpay recurring subscriptions + Free/Growth/Pro/Enterprise tiers.
- ✓ **Feature Gates**: Hybrid hide/badge gating; device cap, seat limit, credit gates enforced.
- ✓ **Analytics**: PostHog user session + event tracking with dev-mode gating.
- ✓ **Admin Panel**: Supervision, trial management, feature flags, analytics, audit, revenue.
- ✓ **Auth Web**: Login/register/activate pages on `finventree.com`; app→web token handoff.
- ✓ **Trade Network Phase 1-3**: Inter-tenant transfers, linked counterparties, trade codes, transfer status sync.
- ✓ **QR Connect**: Mutual business discovery via QR scan — in-app camera scanner + deep link handler.
- ✓ **Advance Credit System**: Overpayment auto-applied as credit to next order.
- ✓ **Order Edit + Soft Delete**: Full edit flow for PO/SO with inspection states.
- ✓ **Customer Soft Delete**: `deleted_at` column, RLS-filtered.

### Active / In Progress
- [ ] **Multi-Tenant Security Audit**: Final RLS/isolation verification.
- [ ] **iOS camera permission string**: Update to mention QR scanning (currently only says IMEI).
- [ ] **Alpha Deployment Readiness**: Performance, SEO, and vulnerability check.

### Out of Scope (For Now)
- **Overhead Accounting**: Rent, electricity, salaries — deferred to post-MVP.
- **Tenant-to-Tenant Transfers via PO**: Currently inter-tenant transfers via TRANSFER order type; full PO handoff deferred.

## Key Decisions

| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **Separate PO Printable** | Keep the PO "Rejected Items" logic isolated from the Sales invoice code. | Active |
| **Token-Based Sharing** | Ensure 30-day security without complex background cleanup jobs. | Active |
| **HashRouter on native** | BrowserRouter requires a web server; Capacitor serves via `capacitor://`. | Active |
| **SECURITY DEFINER RPCs** | All mutations go through RPCs to enforce tenant isolation server-side. | Active |
| **ZXing + Tesseract** | Hybrid barcode + OCR for IMEI scanning; ZXing-only for QR (faster). | Active |
| **@capacitor/browser** | Opens external URLs natively instead of `window.open` (which fails in WebView). | Active |
| **SAT OCR Logic** | Summed Area Tables (Integral Image) for O(N) thresholding to eliminate UI freezes. | v2.1 |
| **Trade Code format** | 6-char base-32 (A-Z, 2-9 — no 0/1/O/I confusion). | Active |

## Current State

**Version: v2.7 (Post-rebrand, Billing + Trade Network shipped)**

Last updated: **2026-05-16** after Trade Network QR Connect completion.

See [docs/UPDATES.md](../docs/UPDATES.md) for the full detailed change log.
See [docs/FEATURES.md](../docs/FEATURES.md) for the complete feature list.
See [docs/TESTING_PLAN.md](../docs/TESTING_PLAN.md) for the testing plan.

