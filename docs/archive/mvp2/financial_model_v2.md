# StockFlow Financial Model (v2)

## 1. Unified Ledger Core
All financial movements (Inflow/Outflow) are strictly linked to a specific cause:
- **TRADE_ORDERS**: Every `SaleOrder` (AR) or `PurchaseOrder` (AP) generates relevant ledger entries.
- **DIRECT_COSTS**: Repair, Logistics, or Sourcing costs are tagged directly to `phone_id` for accurate margin calculation.
- **CAPITAL_MOVEMENTS**: Initial wallet top-ups or direct withdrawals.

## 2. FIFO Settlement System
To simplify bulk payments (Lump Sum), the system now uses a **Server-Side FIFO Allocation** logic:
- **AR (Customer Payments)**: Payments automatically clear the **oldest** pending `sale_orders` first.
- **AP (Supplier Payouts)**: Funds automatically clear the **oldest** pending `purchase_orders` first.
- **Integrity**: Each settlement is atomic; it creates a `customer_payment` / `supplier_payment` record and individual `allocation` links for every order it touches.

## 3. Mandatory Order Linking
To prevent "Ghost Funds" and ensure auditability:
- Sales must have a registered `SaleOrder`.
- Purchases must have a registered `PurchaseOrder`.
- This creates a perfect bridge between Inventory Status (SOLD/STOCK) and Financial Balance.

## 4. Current Hierarchy
- **Tenant** (Business Owner)
  - **Counterparty** (Customer/Supplier)
    - **Trade Order** (Grouping of items + Financial state)
      - **Settlement** (Lump sum or partial payment allocated via FIFO)
    - **Ledger** (Global cashflow view)
