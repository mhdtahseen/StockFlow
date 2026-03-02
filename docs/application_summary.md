# StockFlow Application Summary

StockFlow is a premium, offline-first inventory and financial management system designed specifically for gadget retail shops (mobile phone stores). It operates on a multi-tenant architecture, allowing multiple shops to manage their inventory, staff, and cash flow independently while benefiting from a robust, cloud-synced backend.

---

## 1. Application Context

StockFlow addresses the critical need for mobile retailers to track individual high-value items (serial-tracked inventory) alongside complex cash flows (deposits, escrows, sales, and withdrawals). The application is built to be resilient, functioning flawlessly in areas with intermittent internet connectivity by using an "offline-after-auth" strategy.

---

## 2. Architecture

The application follows a modern, distributed architecture:

### Frontend (Client-Side)

- **Framework**: React 19 + TypeScript + Vite.
- **State Management**: Redux Toolkit (RTK) for predictable state transitions.
- **Persistence**: `redux-persist` with LocalStorage/localForage to ensure data survives browser refreshes and offline sessions.
- **Styling**: Tailwind CSS 4 with a custom design system focusing on "vibrant glassmorphism" and premium UX.
- **Offline Sync Engine**:
  - **Middleware**: Intercepts actions and queues them in a local "Outbox".
  - **Sync Manager**: A dedicated hook that monitors connectivity and handles sequential, referential-integrity-aware syncing to Supabase.
  - **Retry Logic**: Implements retry timers for failed sync items (e.g., when a ledger entry depends on a phone ID that hasn't synced yet).

### Backend (Server-Side)

- **Database**: PostgreSQL (hosted on Supabase).
- **Authentication**: Supabase Auth with custom metadata handling for multi-tenancy.
- **Real-time**: Supabase Realtime (Walrus) for live notifications and data updates.
- **Database Logic**: Heavy use of PostgreSQL Triggers and Functions (PL/pgSQL) to enforce multi-tenant isolation and automate context population (user_id/tenant_id).

---

## 3. Features

### Core Management

- **Multi-Tenancy**: Complete data isolation between different shops/tenants.
- **Staff Roles**:
  - **Admin**: Full access, team management, financial oversight.
  - **Manager**: Inventory and basic financial access.
  - **Associate**: Front-line inventory updates.
- **Inventory Tracking**:
  - Detailed phone records (Brand, Model, RAM, Storage, Color).
  - Status lifecycle: `PENDING` -> `IN_STOCK` -> `SOLD`.
  - Issue tagging for defective or pre-owned items.
  - **Global Device Catalog**: Intelligent auto-completion using a pre-populated global database of mobile devices.
- **Financial Ledger (Wallet)**:
  - **Real-time Cashflow**: Tracking incoming (deposits, sales) and outgoing (purchases, withdrawals) funds.
  - **Dual-Bucket System**: Segregated tracking of "Cash at Hand" (invested capital) vs "Profits".
  - **Bucket-Specific Withdrawals**: When an owner withdraws money, they can explicitly choose to deduct from the Profit Bucket or Cash at Hand, allowing for precise operational ledger tracking.
  - **Escrow/Lien Management**: Visual tracking of "Pledged" funds during pending acquisitions (refund/lock logic).

### Advanced UX & Polish

- **Offline Experience**: Users can continue adding stock or entries without internet; the app syncs silently in the background when back online.
- **Financial Reporting**:
  - Daily summary footers showing Opening and Closing balances.
  - EOD (End of Day) report generation.
  - Automated Profit/Loss calculations on a per-day and per-range basis.
- **System Notifications**:
  - Real-time Bell icon popover.
  - Postgres-triggered alerts (e.g., notifying Admin when an associate makes a sale).
  - Persistent read/unread status.
- **Data Filtering**:
  - Quick-preset date filters (Today, 7 days, 30 days).
  - Custom date range picker with referential balance calculation.
- **Exporting**: One-click Excel export for ledger and inventory data.
- **Onboarding**: Invite-link system for team members to join a specific tenant shop.

---

## 4. Database Schema

### Core Tables

- **`tenants`**: Stores shop details, slugs, and subscription plans.
- **`profiles`**: Extended user data linked to `auth.users`, defining roles and tenant membership.
- **`phones`**: The inventory heart. Stores attributes, pricing, and sync status.
- **`ledger`**: A double-entry style log of every penny moving through the shop.
- **`notifications`**: Real-time alerts for system and business events.
- **`master_data`**: Tenant-specific configuration for dropdowns (brands, models, colors, etc.).
- **`catalog`**: Global reference data for common mobile devices to speed up data entry.

---

## 5. File Structure

```text
StockFlow/
├── docs/               # Architecture and Schema documentation (SQL files)
├── src/
│   ├── app/            # Core configuration (Store, Sync Manager, Supabase API)
│   ├── features/       # Redux slices and business logic by domain
│   │   ├── inventory/  # Inventory state and phone management
│   │   ├── ledger/     # Financial transaction logic
│   │   ├── sync/       # Outbox and connectivity state
│   │   └── wallet/     # Dashboard computations and selectors
│   ├── components/     # UI Components
│   │   ├── shared/     # Reusable logic-heavy UI (Notifications, Modals)
│   │   └── ui/         # Design system primitives (Buttons, Inputs)
│   ├── pages/          # Full-page route components
│   ├── hooks/          # Reusable react hooks (Device catalog, offline status)
│   ├── context/        # React context (Auth, Theme)
│   ├── lib/            # External library initializations (Supabase, etc.)
│   └── types/          # TypeScript interfaces and enums
└── tailwind.config.ts  # Design tokens and theme configuration
```
