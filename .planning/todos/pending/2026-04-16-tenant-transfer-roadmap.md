---
created: 2026-04-16T18:17:15Z
title: Tenant Transfer Roadmap
area: planning
files:
  - src/components/shared/BatchAddSheet.tsx
  - src/components/shared/POConfirmSheet.tsx
  - src/pages/OrderDetail.tsx
---

## Problem

Currently, Purchase Orders (PO) and Sale Orders (SO) are independent entities within individual tenant silos. However, high-volume traders often buy and sell between each other using the same application. Manually creating a PO for a batch of units that already exist as an SO in another tenant's session is redundant and prone to entry errors (IMEI typos, etc.).

## Solution

Implement an "Inter-tenant Transfer" protocol:

1. **Transfer Mechanism**: When Tenant A marks an SO as "External Transfer", a bridge record is created.
2. **Automated PO Draft**: Tenant B receives a notification and a "Draft PO" is automatically populated in their "Awaiting Receipt" list, pre-filled with the exact units, IMEIs, and agreed specs from Tenant A's SO.
3. **Data Integrity**: The unit's `id` or a common `serial` is used to maintain a consistent history across the transfer.
4. **Financial Reconciliation**: Tenant A's proceeds automatically match Tenant B's liability/cost basis.
