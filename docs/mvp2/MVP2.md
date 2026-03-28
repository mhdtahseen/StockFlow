# StockFlow: The Financial Operating System for Global Device Trade

> **Executive One-Liner**: Professionalizing the $50B+ informal secondary electronics market through a robust, offline-first, multi-tenant ERP.

---

## 💡 Investment Thesis (The "Why")

The secondary smartphone market is fragmented, informal, and plagued by "missing capital" and "opaque inventories." Retailers often rely on paper logs or generic Excel sheets that cannot handle the high-velocity IMEI-specific tracking or the complex financial pledging required for bulk sourcing.

**StockFlow solves this by providing a high-fidelity "Single Source of Truth."** It isn't just an inventory app; it’s a financial layer that protects the owner's capital while enabling staff to operate at peak efficiency.

---

## ✅ Accomplishments to Date (MVP2 Milestone)

Since inception, we have built a complete **Production-Ready Core**:

| Milestone | Capability | Status |
|-----------|------------|--------|
| **Multi-Tenancy** | Bulletproof data isolation using Row-Level Security (RLS). | 🟢 Complete |
| **Financial Engine** | Professional 4-Bucket Accrual Accounting (Equity, Debt, P&L, Liquidity). | 🟢 Complete |
| **Sync Manager** | Persistent offline-first state with background auto-sync & retry. | 🟢 Complete |
| **Device Lifecycle** | Full "PO → Inspection → Sales → Invoicing" pipeline. | 🟢 Complete |
| **Analytics 1.0** | Real-time margin tracking and brand market share visualization. | 🟢 Complete |
| **Premium UX** | Custom mobile-first design system with Framer Motion animations. | 🟢 Complete |

---

## 🛡️ Our "Moat": Why StockFlow is Unique

### 1. The Offline-First Resilience
Most cloud ERPs fail in low-connectivity areas (market basements, rural shops). StockFlow uses a sophisticated **Redux-Supabase Outbox** pattern. Every action is local-first; the system handles conflict resolution and background retries behind a premium animated loader.

### 2. Double-Entry Logic for Informal Trade
We built "Financial Pledging." In device trade, money is often "blocked" for stock that isn't yet verified. StockFlow separates **Liquid Wallet** from **Pledged Capital**, preventing owners from spending cash they don't yet truly own.

### 3. The Condition Catalog
Detailed "Issue Tags" (Screen Burn, Battery Fade, etc.) are indexed. This allows us to calculate **Weighted Margins** based on device health, not just model name.

### 4. Zero-Dependency Professional Invoicing
A custom-built PDF/Print engine that produces VAT-compliant, branded invoices directly from the browser/PWA with no external API calls required.

---

## 📖 Operational Guide: How to Use StockFlow

### 1. Sourcing (Acquisition)
- Create a **Purchase Order (PO)** for a batch of phones.
- Funds are automatically **Pledged** from the wallet (Locked).
- Staff uses the **Inspection Queue** to verify each IMEI against defined **Issue Tags**.

### 2. Inventory Management
- Accepted units move to **In Stock**.
- The system captures a **snapshot** of the brand/model variant (Ensures historical accuracy even if the catalog is updated).
- Managers track **Inventory Velocity** (Avg. Days on Shelf) to prioritize sales.

### 3. Sales & Fulfillment
- Rapid **Sales Order** creation for Retail or Bulk clients.
- Automated **PDF Invoice** generation with dynamic discounting.
- **Profit Buckets** extract the margin into a separate withdrawal-only account.

---

## ⚙️ Engineering & Architecture (For Technical Due Diligence)

- **Frontend**: React 18, Vite, Redux Toolkit (Offline Persistence).
- **Backend**: Supabase (PostgreSQL), Auth, Realtime Extensions.
- **Moat Logic**: 
    - **Subquery-Inlined RLS**: Optimized for high-concurrency multi-tenancy.
    - **Exponential Backoff Sync**: Outbox pattern for server-less data resilience.
    - **Automatic Lifecycle Triggers**: Database-level triggers for data consistency.

---

## ❓ Comprehensive FAQ (Investor Deep-Dive)

### Q: How do you prevent data leakage in a multi-tenant environment?
**A**: We use **deterministic Row Level Security (RLS)**. Every query is scoped via a server-side helper function `get_user_tenant_id()`. This prevents users—even via direct API calls—from ever seeing data belonging to another store ID.

### Q: Can the system scale to 1,000+ stores and millions of IMEIs?
**A**: Yes. Our database documentation (v5 Schema) already includes b-tree indexes on foreign keys and optimized subqueries to avoid the "InitPlan Trap." We use PostgreSQL partitioning logic for the `ledger` and `inventory` tables as we scale.

### Q: Is it truly "Offline First"?
**A**: Absolutely. The entire `billing` and `inventory` state lives in an encrypted Redux store. When a user creates an order while offline, it goes to an **Outbox**. The `SyncManager` monitors connectivity and flushes the outbox with transactional integrity when the network returns.

### Q: How do you handle price depreciation in phones?
**A**: Our **Analytics Module** tracks "Time on Shelf." We provide visual cues (Aging reports) informing the manager if a device has sat too long, allowing for dynamic markdown strategies before the model loses market value.

### Q: What is the monetization strategy?
**A**: We use a conversion-optimized tiered SaaS model designed to "hook" users with high-value features in the Trial phase, then segment them into high-margin tiers.

| Feature Segment | Starter Tier | Pro Tier (Most Popular) | Enterprise Tier |
|-----------------|--------------|-------------------------|-----------------|
| **Max Inventory**| 200 Devices | Unlimited | Unlimited |
| **Trade Ops** | ❌ None | Purchase Orders, Sourcing | Bulk Sales, Trade Networks |
| **Financials** | Basic Wallet | Full Ledger, Profit Buckets | Receivables, Customer P&L |
| **CRM** | ❌ None | Basic Customer Registry | Advanced CRM & History |
| **Advanced UX** | Basic UI | IMEI Scanner, PDF Invoicing | Bulk Invoicing, API Access |
| **Support** | Self-serve | Priority Email | 24/7 Account Manager |

**The "Product-Led Growth" Play**:
- **14-Day Full-Enterprise Trial**: Every new sign-up gets 100% access to Enterprise features. This creates deep product dependency (stickiness) before the first payment.
- **Hard-Capped DB-Level RLS**: Constraints (e.g., 200-phone limit for Starter) are enforced at the database layer, making them bypass-proof.

---

## 🧾 Complete Feature Registry (The Full Build)

Below is an exhaustive breakdown of every module and minute feature currently active in the StockFlow ecosystem.

### 🏢 Architectural Foundation (MVP 1)
- **Multi-Tenant DNA**: Deterministic data isolation based on `tenant_id` at the database core.
- **Modular Layout**: Mobile-first responsive shell with persistent navigation and dynamic headers.
- **Dual-Theme Engine**: Seamless Light/Dark mode transitions with system-preference detection.
- **Auth & Onboarding**: Secure login/signup with an invitation-based organizational scale.
- **Global Device Database**: Pre-seeded master list of mainstream manufacturers and models.

### 📱 Advanced Inventory Management (MVP 2)
- **IMEI-Precision Tracking**: Serial-number level visibility for 100% individual unit accountability.
- **Snapshot Logic**: Automatic capture of current Brand/Model/Color/Variant data at the time of entry (protects against future catalog changes).
- **Hierarchical Condition Mapping**: A multi-severity issue catalog for precise quality grading (e.g., Screen Scratches vs. Logic Board failure).
- **Interactive Inspection Queue**: A structured workflow for staff to verify inbound stock before it becomes available for sale.
- **Batch Processing**: Sourcing multiple devices under single Purchase Orders (PO) for bulk intake.

### 🏦 Financial Integrity & 4-Bucket Accounting
- **The 4-Bucket Strategy**: Advanced categorization into **Equity, Debt (AR/AP), P&L (Accrual), and Internal Liquidity**.
- **Accrual-First Model**: Revenue (`PHONE_SALE`) and COGS (`FUNDS_CONSUMED`) are booked at the time of transaction, regardless of cash collection.
- **Sign-Aware Precision Ledger**: Standardized +/- audit trail ensuring mathematical consistency across all wallet calculations.
- **Credit & Debt Offsetting**: Automated balancing of unpaid portions during sales and purchases to keep wallet balances accurate.
- **Total Value Tracking**: Every sale and purchase tracks the "Full Transaction Value," providing a true picture of business volume.
- **Owner-Only Withdrawals**: Specialized logic for withdrawing realized profits without depleting core business capital.
- **Platform Fee Attribution**: Direct tracking of 3rd-party sourcing fees as part of unit expenditure.

### 📄 Billing & Professional Client Services
- **Sale Order Orchestrator**: Supports single Retail sales, high-volume Bulk transactions, and Internal Transfers.
- **FIFO Settlement Engine**: Optimized algorithm for "First-In-First-Out" debt collection and supplier payout distribution.
- **Custom-Branded Invoicing**: Instant professional PDF generation with tenant-specific colors and contact details.
- **Direct-to-Print**: Seamless integration with mobile/desktop thermal and standard printers.
- **Real-Time AR/AP Visibility**: Manage customer/supplier balances with specific "Due Dates" and settlement alerts.
- **Dynamic Discounting**: Apply fixed or percentage-based discounts with automatic ledger reconciliation.

### 📈 Business Intelligence & Sync
- **Growth Trend Analytics**: Visualizing Revenue vs. Expenditure across 6+ distinct time periods.
- **Market Share Heatmaps**: Visual breakdown of inventory by brand dominance and profitability.
- **Inventory Velocity (Shelf-Time)**: Automatic calculation of "Days on Shelf" to flag depreciating assets.
- **The Sync Manager**: High-resilience "Outbox" system ensuring no data is lost during network drops.
- **Fuzzy Search & Filters**: High-performance device searching using Fuse.js for approximate IMEI or model matches.

## 🗺️ Strategic Roadmap: The Path to V6 and Beyond

StockFlow is evolving from a single-store ERP to a global trade network.

### Phase 1: Intelligent Automation (Upcoming)
- **AI Pricing Engine**: Real-time market valuation using historical sales data and scraping public marketplaces.
- **Auto-Scanning OCR**: Use the phone camera to immediately ingest IMEIs and Serial numbers without manual typing.
- **WhatsApp Business Bridge**: Automated customer notifications for invoices, payments, and stock arrivals.

### Phase 2: The Trade Network
- **Inter-Tenant Catalog**: Allow trusted tenants to view each other's "Bulk Stock" for seamless B2B trading within the platform.
- **Escrow-as-a-Service**: Integrated financial services for safe cross-border or cross-city trading between StockFlow users.
- **Logistics Integration**: Deep API bridges with couriers (Aramex, DHL) for automated labels and tracking.

### Phase 3: Financial Services
- **Inventory-Backed Lending**: Provide credit to high-velocity shops based on their "Time on Shelf" and "Ledger Integrity" metrics.
- **Payment Gateway V2**: Direct in-app card processing with automated ledger reconciliation.

---
*StockFlow: Scaling the world's gadgets with financial integrity.*



