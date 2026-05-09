# Milestone 6: The Inter-Tenant Business Network (v2.6)

---

# Milestone 4: Inspection & Defects (v2.4)

## Goal
Establish a professional-grade device appraisal system that tracks physical defects and standardizes quality grading.

## Functional Requirements

### 🔍 Inspection HUD
- **FR-INSP-01**: **Defect Cataloging**: Implement a 100+ item fault catalog categorized by component (Screen, Camera, etc).
- **FR-INSP-02**: **Severity Scoring**: Map each defect to a 1-5 severity scale for impact calculation.
- **FR-INSP-03**: **Alias Search**: Support fuzzy search/OCR aliases for defect selection.

### 🏷️ Quality & Grading
- **FR-INSP-04**: **Quality Tiers**: Implement standard retail grades (Premium, A, B, C, D).
- **FR-INSP-05**: **Functional Status**: Automatically aggregate functional health based on active defects.
- **FR-INSP-06**: **UI Integration**: Display status/quality badges in the unit registry and history timeline.

---


## Goal
Transform StockFlow into a B2B network where silos can securely trade, discover partners, and transfer stock with zero friction.

## Functional Requirements

### 🤝 Discovery & Identity
- **FR-NW-01**: **Smart Match**: Implement background lookup of phone/email during customer creation to identify existing tenants.
- **FR-NW-02**: **Business Card**: Create a store-specific ID and QR code generator in Settings.
- **FR-NW-03**: **QR Scanner**: Add a scanner to the partner onboarding flow for instant, accurate linking.
- **FR-NW-04**: **Verified Badge**: Show a distinct visual indicator for "Verified StockFlow Businesses" in the customer list.

### 🌉 The Transfer Bridge
- **FR-NW-05**: **Push to Partner**: Allow a seller to send an finalized Sale Order manifest to a linked partner.
- **FR-NW-06**: **Incoming Inbox**: Implement a view for buyers to see pending stock transfers from partners.
- **FR-NW-07**: **Handshake Review**: A verification UI where the buyer inspects the incoming manifest (specs/IMEIs) before accepting it into inventory.
- **FR-NW-08**: **Auto-PO Creation**: Upon acceptance, automatically create a finalized Purchase Order for the buyer using the transfer data.

### 🛡️ Privacy & Data Integrity
- **FR-NW-09**: **Financial Isolation**: Ensure the seller's cost and profit are never exposed to the buyer. Only the "Selling Price" transfers as the buyer's "Purchase Price."
- **FR-NW-10**: **Catalog Sync**: Allow the buyer to override/correct Brand/Model/Spec data during the handshake if they mismatch the physical device.

## Traceability Matrix

| ID | Requirement | Phase | Status |
| :--- | :--- | :--- | :--- |
| FR-INSP-01 | Defect Cataloging | 06 | [x] |
| FR-INSP-02 | Severity Scoring | 06 | [x] |
| FR-INSP-03 | Alias Search | 06 | [x] |
| FR-INSP-04 | Quality Tiering | 07 | [x] |
| FR-INSP-05 | Functional Status | 07 | [x] |
| FR-INSP-06 | UI Integration | 07 | [x] |
| FR-NW-01 | Smart Match Discovery | 11 | [ ] |

| FR-NW-02 | Business Card QR | 11 | [ ] |
| FR-NW-03 | Partner Scanner | 11 | [ ] |
| FR-NW-05 | Push to Partner | 12 | [ ] |
| FR-NW-06 | Incoming Inbox | 12 | [ ] |
| FR-NW-07 | Handshake Review UI | 12 | [ ] |
| FR-NW-08 | Auto-PO Generation | 12 | [ ] |
| FR-NW-09 | Financial Isolation | 11/12 | [ ] |
