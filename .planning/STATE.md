# StockFlow: STATE.md

**Current Phase**: Phase 3: Procurement Documentation & Pricing Logic
**Current Task**: Finalizing reactive PO creation & Public Viewer RLS

## Milestone Progress
- `[x]` Milestone 1: Performance & Financial Stabilization (100%)
- `[x]` Milestone 2: Document Automation & Sharing (v2.2) (100%)
- [ ] Milestone 3: Beta & Delivery (0%)

## Active Phase Breakdown (Milestone 2)

### Phase 3: Procurement Documentation & Branding
- `[x]` Standardize terminology (Purchase Order / Invoice) across all UI
- `[x]` Create `PurchaseOrderPrintable` component (Supplier logic)
- `[x]` Implement **Reactive Pricing Manifest** (Last-Item-Fill logic) in `BatchAddSheet`
- `[/]` Implement `generatePurchaseOrderPDF` utility (Pending)

### Phase 4: Secure Document Sharing
- `[x]` Create Public Viewer Route (`/public/view/:token`)
- `[x]` Implement 30-day link expiry logic (`shared_links`)
- `[x]` Integrate Native Mobile Share API
- `[x]` Configure Supabase RLS for anonymous record access

## Refinements (Off-Track Accomplishments)
- **Smart Manifest**: Implemented a spreadsheet-like reactive pricing system where the last item balances the total manifest value automatically.
- **Terminology Guard**: Cleaned up legacy "Procurement Request" labels to ensure professional "Purchase Order" branding throughout the workflow.
- **Manifest Hardening**: Added IMEI verification, row-level scanning, and draft persistence to the Batch Add workflow.

## Blockers & Risk
- **Risk**: Cache invalidation for public links if DB tokens are manually altered.
- **Risk**: Large manifest performance (UI lag) during reactive price recalculation (>50 items).

## Current Context
We have advanced rapidly through the Document Automation phase. The reactive pricing logic provides a premium "Power User" feel to PO creation. Next focus is on PDF generation and the "Edit" flow for existing orders.

---
*Last updated: 2026-04-14*
