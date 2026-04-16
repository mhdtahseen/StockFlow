# Milestone 4: PO Stability & Lifecycle Management (v2.4)

## Goal
Resolve critical data persistence issues, stabilize inspection/timeline logic, and implement full CRUD for Purchase Orders.

## Functional Requirements

### 📱 PO Data Integrity
- **FR-PO-01**: Persistence: PO item snapshots (Brand, Model, Storage, RAM, Color) must survive page refreshes and detail fetches.
- **FR-PO-02**: Ledger Sync: Frontend "pending" ledger entries must be correctly cleared when official records arrive from the database.
- **FR-PO-03**: Idempotency: Redux state must check for existing records before adding new POs or Ledger entries to prevent UI duplication.

### 🔍 Inspection & IMEI Tracking
- **FR-PO-04**: Inspection Stability: Item status must accurately reflect "PENDING_INSPECTION" vs "ACCEPTED" and remain interactive post-refresh.
- **FR-PO-05**: IMEI Propagation: IMEI records scanned during inspection must correctly link to inventory records.

### 📈 Financial & Timeline
- **FR-PO-06**: Timeline Order: Events must be sorted by Time, Type Priority, and ID tie-breaker for deterministic historical logging.
- **FR-PO-07**: Collapsible Notes: Long ledger notes (initially breaking the UI) must be truncated or collapsible for readability.

### 🛠 PO Management
- **FR-PO-08**: PO Edit: Implement full editing of PO details with support for cascaded inventory updates.
- **FR-PO-09**: PO Delete: Implement safe deletion of POs with required cleanup of associated items and ledger entries.

### 🎨 UI/UX Refinement
- **FR-PO-10**: Mobile Autocomplete: The catalog search results must be scrollable on mobile even with the virtual keyboard active.
- **FR-PO-11**: Resilient Share: The share button must be timeout-aware and fallback to clipboard if the native share sheet fails.

## Traceability Matrix

| ID | Requirement | Phase | Status |
| :--- | :--- | :--- | :--- |
| FR-PO-01 | PO Persistence | 7 | ✓ |
| FR-PO-02 | Ledger Sync | 7 | ✓ |
| FR-PO-03 | Idempotency | 7 | ✓ |
| FR-PO-04 | Inspection Logic | 7 | ✓ |
| FR-PO-05 | IMEI Propagation | 7 | — |
| FR-PO-06 | Timeline Sorting | 7 | ✓ |
| FR-PO-07 | Collapsible Notes | 7 | ✓ |
| FR-PO-08 | PO Edit | 8 | [ ] |
| FR-PO-09 | PO Delete | 8 | [ ] |
| FR-PO-10 | Mobile Autocomplete | 7 | ✓ |
| FR-PO-11 | Resilient Share | 7 | ✓ |

