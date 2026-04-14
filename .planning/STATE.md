# StockFlow: STATE.md

**Current Phase**: Phase 2: Financial Integrity (P&L Tracking)
**Current Task**: Audit P&L math and Ledger reconciliation

## Milestone Progress
- `[x]` Milestone 1: Performance & Financial Stabilization (100%)
- `[/]` Milestone 2: Production Readiness & Native Experience (10%)
- [ ] Milestone 3: Beta & Delivery (0%)

## Active Phase Breakdown (Milestone 1)

### Phase 1: Scanner Persistence & Performance
- `[x]` Audit `ImeiScannerModal.tsx` bottlenecks (Completed)
- `[x]` implement Unified Canvas-Based Decoding loop in `ImeiScannerModal.tsx`
- `[x]` develop and integrate Adaptive Thresholding (Otsu) preprocessor
- `[x]` implement convolution-based Sharpening filter
- `[x]` add Hardware Zoom (1.5x) and Exposure Compensation logic
- `[x]` update Scanner UI with Zoom controls and status indicators
- `[x]` verify performance and accuracy improvements in various lighting conditions

### Phase 2: Financial Integrity (Watchtower Logic)
- `[x]` Standardize Ledger Entry Types and Metadata (`ledger/types.ts`)
- `[x]` Implement Ledger Watchtower (extraReducers) for `addSaleOrder`
- `[x]` Implement Ledger Watchtower (extraReducers) for `addCustomerSettlement`
- `[x]` Fix blank `note` fields in `PhoneDetail.tsx` and manual `addEntry` calls
- `[x]` Implement `selectTrueProfit` selector with Landed Cost logic
- `[x]` Implement `selectCustomerBalance` with automated Ledger scanning
- `[x]` Verify logic by simulating Sale -> Settlement flows

## Blockers & Risk
- **Risk**: Device-specific camera behavior (focus/torch) varies on Android TWA.
- **Risk**: Tesseract.js initialization latency on slow networks.
- **Risk**: RLS validation depth for complex ledger aggregations.

## Current Context
We are shifting from "Build" mode to "Stabilization" mode. Most core features exist but require reliability hardening before MVP 2 release.

---
*Last updated: 2026-04-12*
