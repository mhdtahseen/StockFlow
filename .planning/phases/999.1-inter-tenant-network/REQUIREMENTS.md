# Milestone 6: The Inter-Tenant Business Network (v2.6)

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
| FR-NW-01 | Smart Match Discovery | 11 | [ ] |
| FR-NW-02 | Business Card QR | 11 | [ ] |
| FR-NW-03 | Partner Scanner | 11 | [ ] |
| FR-NW-05 | Push to Partner | 12 | [ ] |
| FR-NW-06 | Incoming Inbox | 12 | [ ] |
| FR-NW-07 | Handshake Review UI | 12 | [ ] |
| FR-NW-08 | Auto-PO Generation | 12 | [ ] |
| FR-NW-09 | Financial Isolation | 11/12 | [ ] |
