# Redux State Architecture

This document maps out the complete structure of the Redux global state store for the StockFlow application. It uses `redux-persist` under the hood to preserve the structure offline.

## Root State Object

Below is a complete snapshot of the entire Redux state tree and the current structural values it holds in JSON.

```json
{
  "inventory": {
    "phones": [
      {
        "id": "e4b3c2a1...",
        "brand": "Apple",
        "model": "iPhone 13 Pro",
        "ram": "6GB",
        "storage": "256GB",
        "color": "Sierra Blue",
        "imeis": ["352011234567890"],
        "purchasePrice": 45000,
        "status": "IN_STOCK",
        "createdAt": "2026-03-01T10:00:00Z"
      }
    ]
  },

  "ledger": {
    "entries": [
      {
        "id": "a1b2c3d4...",
        "type": "MONEY_ADDED",
        "amount": 200000,
        "createdAt": "2026-02-28T09:00:00Z"
      }
    ]
  },

  "masterData": {
    "brands": ["Apple", "Samsung"],
    "models": ["iPhone 13", "Galaxy S23"],
    "ramOptions": ["4GB", "6GB", "8GB"],
    "storageOptions": ["128GB", "256GB"],
    "colorOptions": ["Sierra Blue", "Phantom Black"],
    "issueTags": ["Minor Scratches"]
  },

  "customers": {
    "customers": [
      {
        "id": "c1...",
        "name": "Jane Doe",
        "type": "CUSTOMER",
        "phone": "9876543210"
      }
    ],
    "payments": []
  },

  "billing": {
    "orders": [
      {
        "id": "o1...",
        "counterpartyId": "c1...",
        "orderType": "RETAIL",
        "totalAmount": 52000,
        "amountPaid": 0,
        "status": "OPEN",
        "items": []
      }
    ]
  },

  "purchasing": {
    "orders": [],
    "payments": []
  },

  "tenant": {
    "teamMembers": [
      {
        "id": "u1...",
        "full_name": "Admin User",
        "role": "admin"
      }
    ],
    "lastUpdated": "2026-03-27T05:00:00Z"
  },

  "sync": {
    "outbox": [],
    "isOnline": true
  }
}
```

## Detailed Slice Breakdowns

### 1. `inventory` Slice
- Maintains the core array of all `phones`.
- Contains `imeis` and `issueTags` as string arrays.
- Tracks `purchasePrice`, `salePrice`, and `status`.

### 2. `ledger` Slice
- Stores chronological list of all cashflow transactions.
- Recalculates vault cash and profit values on the fly.

### 3. `masterData` Slice
- Localized dictionary for predictive text (brands, models, options).

### 4. `customers` Slice
- Manages `counterparties` (customers, suppliers, wholesalers).
- Stores recent payments received from customers.

### 5. `billing` Slice
- Manages `sale_orders` and their embedded items (snapshots).
- Handles open/partial payments for retail and bulk sales.

### 6. `purchasing` Slice
- Manages `purchase_orders` and `supplier_payments`.
- Tracks phone-by-phone inspection status (`PENDING_INSPECTION`, `ACCEPTED`, `REJECTED`).

### 7. `tenant` Slice
- Stores `teamMembers` (profiles) for the current organization.
- Updates `lastUpdated` whenever a role or member is changed.

### 8. `sync` Slice
- Background Queue mechanism for Supabase integration.
- `outbox` persists actions while offline.
- `isOnline` drives the synchronization logic.
