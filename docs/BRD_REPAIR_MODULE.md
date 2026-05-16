# Business Requirements Document: Multi-Model Repair Module

> **Project**: StockFlow — Repair Flow Expansion  
> **Author**: Product Team  
> **Version**: 1.1  
> **Date**: May 2026  
> **Status**: Draft / Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Research & Opportunity](#2-market-research--opportunity)
3. [Customer Segmentation](#3-customer-segmentation)
4. [Product Vision](#4-product-vision)
5. [Business Model & Monetization](#5-business-model--monetization)
6. [Functional Requirements](#6-functional-requirements)
7. [Data Model](#7-data-model)
8. [User Experience — Per Segment](#8-user-experience--per-segment)
9. [Technical Architecture](#9-technical-architecture)
10. [Implementation Phases](#10-implementation-phases)
11. [Edge Cases & Risk Mitigation](#11-edge-cases--risk-mitigation)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Feasibility Study](#13-feasibility-study)
14. [Success Metrics & KPIs](#14-success-metrics--kpis)
15. [Use Cases](#15-use-cases)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

### Problem Statement

The Indian mobile phone aftermarket is a ₹50,000 Cr+ industry comprising three distinct operator types:

1. **Traders** — Buy and sell used/refurbished phones (our current market)
2. **Repair Shops** — Diagnose, repair, and return customer devices
3. **Hybrid Operators** — Buy damaged phones, repair them, and sell at profit

StockFlow currently serves only segment #1. Segments #2 and #3 represent an untapped market of **2.5 lakh+ repair shops** across India, most of which track repairs on paper, WhatsApp, or basic spreadsheets.

### Proposed Solution

Extend StockFlow into a **multi-business-model platform** where a single app dynamically adapts its UI, features, and workflows based on the tenant's subscription tier. No separate codebases, no separate apps — one platform, three business models.

### Strategic Value

- **3x addressable market** without building a second product
- **Higher ARPU** via hybrid plans that combine both flows
- **Network effects** — repair shops become suppliers to traders and vice versa (future Trade Network feature)
- **Retention moat** — shops managing both repair AND trade operations cannot easily switch away

---

## 2. Market Research & Opportunity

### 2.1 Market Size (India, 2025-2026)

| Segment | Estimated Count | Annual Revenue/Shop | Total Addressable Market |
|---------|----------------|--------------------:|-------------------------:|
| Used phone traders | 1.5L shops | ₹15-50L | ₹22,500 Cr |
| Mobile repair shops | 2.5L+ shops | ₹8-25L | ₹20,000 Cr |
| Hybrid operations | 50K-80K shops | ₹30-80L | ₹24,000 Cr |

Source estimates: ICEA (Indian Cellular & Electronics Association), local market surveys, Counterpoint Research aftermarket reports.

### 2.2 Current Pain Points — Repair Shops

| Pain Point | Current Workaround | Impact |
|---|---|---|
| No ticket tracking system | Paper register / WhatsApp | Lost devices, forgotten repairs, customer disputes |
| No cost tracking (parts + labor) | Mental math / rough estimates | Underpricing, margin leakage |
| No customer communication | Manual calls/messages | "Is my phone ready?" calls 10x daily |
| No financial records | Cash diary | Tax non-compliance, no loan eligibility |
| No repair history per device | None | Repeat issues undiagnosed, warranty disputes |
| Technician accountability | None | No audit trail for who did what |

### 2.3 Current Pain Points — Traders (Outsourced Repair Gap)

Traders who outsource repairs to external shops have a separate set of problems not covered by any existing tool:

| Pain Point | Current Workaround | Impact |
|---|---|---|
| No visibility on phone at external shop | Call the repair guy repeatedly | Can't track without disrupting the repairer |
| No auto-COGS update on return | Manual Excel calculation | Wrong margin on sale; phones often underpriced |
| No record of which shop repaired which phone | Memory / paper | Cannot audit repair quality or costs over time |
| Dispute over repair cost | No reference | Repair shop overcharges; trader has no proof |
| Phone status wrong in inventory | Still shows IN_STOCK while it's at shop | Salesperson promises unavailable stock |

### 2.4 Competitor Landscape (Repair SaaS)

| Product | Market | Strengths | Weaknesses |
|---------|--------|-----------|------------|
| RepairDesk | Global (US/EU focus) | Full POS + repair tracking | Expensive ($49+/mo), desktop-first, no India focus |
| RepairShopr | US | CRM + ticketing + invoicing | No mobile app, English only, no Indian payment rails |
| mHelpDesk | Global | Field service management | Overkill for small shops, complex setup |
| BytePhase | India | Repair tracking | Basic UI, no finance integration, no offline |
| Paper/WhatsApp | India (90%+) | Free, familiar | Zero automation, zero analytics, zero audit trail |

**Our Differentiator**: Mobile-first, offline-capable, Indian market focused (₹ currency, UPI/Cash modes, GST-ready), combined with buy/sell in one platform (unique to hybrid operators), AI-powered device identification.

### 2.5 Why Now

- India's smartphone installed base crossed 900M units in 2025 — more phones = more repairs
- Right-to-Repair awareness growing — OEM authorized centers losing share to local shops
- Government push for MSME digitization (Digital India, ONDC) — shop owners increasingly open to SaaS tools
- Post-COVID behavioral shift — customers expect real-time tracking (Swiggy/Zomato trained expectations)

---

## 3. Customer Segmentation

### 3.1 Segment Profiles

#### Segment A: Pure Trader
- **Who**: Buys used phones in bulk, refurbishes cosmetically, sells to retailers/end-consumers
- **Volume**: 50-500 phones/month
- **Key needs**: Stock tracking, PO/SO management, margin analytics, IMEI scanning
- **Plan mapping**: `starter`, `pro`
- **Status**: ✅ Fully served today

#### Segment B: Pure Repair Shop
- **Who**: Accepts customer phones for repair, charges labor + parts
- **Volume**: 10-50 repairs/month (small), 100-300/month (medium)
- **Key needs**: Ticket lifecycle, diagnosis tracking, cost estimation, customer updates, payment collection
- **Plan mapping**: `repair`, `repair_pro`
- **Status**: ❌ Not served

#### Segment C: Hybrid Operator
- **Who**: Buys damaged/dead phones cheap → repairs → sells at profit. Also takes walk-in repairs.
- **Volume**: Mixed — 20-100 trades + 30-100 repairs/month
- **Key needs**: Everything from A + B, plus linking a purchased phone to a repair ticket and tracking total cost-of-goods-sold (purchase price + repair cost)
- **Plan mapping**: `hybrid`, `enterprise`
- **Status**: ❌ Not served (would use workarounds with current buy/sell flow)

#### Segment D: Trader with Outsourced Repairs
- **Who**: Pure trader who doesn't repair in-house but regularly sends phones to external repair shops for reconditioning before sale
- **Volume**: 20-200 phones/month outsourced to external shops
- **Key needs**: Track phone status while it's at another shop, record the repair cost against the phone for true COGS, know when to expect it back
- **Plan mapping**: `pro` (V1 manual tracking), `enterprise` (V2 cross-tenant auto-sync)
- **Status**: ❌ Not served — **newly identified segment from inter-tenant gap analysis**

### 3.2 User Personas

**Rajesh — Independent Repair Shop Owner (Tier 2 city)**
- 1-2 technicians, 15-25 repairs/week
- Tracks everything in a spiral notebook
- Biggest frustration: customers calling "bhaiya phone ready?" 5 times a day
- Biggest financial pain: doesn't know his actual margin after parts cost

**Priya — Hybrid Operator (Metro city)**
- Team of 4 (2 traders, 2 repair techs)
- Buys "dead" phones from local markets → repairs → sells on OLX/offline
- Currently uses Excel for trade and a WhatsApp group for repair status
- Biggest pain: doesn't know true COGS (purchase + repair cost) when pricing for sale

**Amit — Multi-Location Retail Chain**
- 3 shops with repair counters
- Needs technician assignment, multi-location ticket visibility
- Currently uses a different app for repair and a different one for POS
- Wants one platform

**Suresh — Bulk Trader with Outsourced Repair**
- Buys 100-200 phones/month; ~40% need repairs before sale
- Has a "trusted repair guy" 2 streets away (not his employee)
- Sends phones via a runner; gets them back 2-5 days later
- Biggest pain: phone shows IN_STOCK but it's at the repair shop; "lost" track of 12 phones this year due to miscommunication
- Wants to know: where is my phone, when is it back, what did it cost — from the same app he already uses for trading

---

## 4. Product Vision

### 4.1 Vision Statement

> **One app that runs any mobile phone business — whether you trade, repair, or do both — adapting dynamically to your subscription. And when two StockFlow businesses work together, the platform connects them automatically.**

### 4.2 Design Principles

1. **Plan = Business Model** — Your subscription determines what the app does, not a config switch
2. **Shared Foundation** — Customers, payments, ledger, and analytics are universal; only workflows differ
3. **Zero Friction Upgrade** — Moving from repair-only to hybrid unlocks trade features without migration
4. **Mobile-First Repair** — Technicians work from phones, not desktops; every interaction must be thumb-friendly
5. **Customer Transparency** — Device owners can track repair status via a shared link (no app required)
6. **Network by Default** — When two StockFlow tenants interact, the platform detects it and offers to connect their workflows via IMEI

### 4.3 Product Structure

```
                        STOCKFLOW PLATFORM
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  TRADE FLOW  │   │ REPAIR FLOW  │   │   SHARED     │
    │              │   │              │   │              │
    │ • Inventory  │   │ • Tickets    │   │ • Customers  │
    │ • POs / SOs  │   │ • Diagnosis  │   │ • Payments   │
    │ • Stock Mgmt │   │ • Lifecycle  │   │ • Ledger     │
    │ • Margins    │   │ • Costing    │   │ • Analytics  │
    │ • IMEI Track │   │ • Invoicing  │   │ • Team       │
    │              │   │ • Tracking   │   │ • Sync       │
    └──────┬───────┘   └──────┬───────┘   └──────────────┘
           │                   │
           └───────┬───────────┘
                   │
          ┌────────▼────────┐
          │  HYBRID BRIDGE  │       ← Single-tenant (you own both flows)
          │                 │
          │ • Phone→Ticket  │
          │ • Repair→COGS   │
          │ • Buy→Fix→Sell  │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  TRADE NETWORK  │       ← Cross-tenant (two separate businesses)
          │                 │
          │ • Outsourced    │         Trader sends phone to external
          │   Repair Track  │         StockFlow repair shop → status + cost
          │ • IMEI → Link   │         sync back to trader automatically
          │ • Auto-COGS     │
          └─────────────────┘
```

---

## 5. Business Model & Monetization

### 5.1 Plan Tiers

| Plan | Monthly Price | Annual Price | Flows | Key Limits |
|------|-------------:|------------:|-------|------------|
| **Free** | ₹0 | ₹0 | Trial (14 days full access) | 50 phones / 20 tickets |
| **Starter** | ₹299 | ₹2,999 | Trade only | 200 phones, 1 user |
| **Pro** | ₹599 | ₹5,999 | Trade only + external repair tracking | Unlimited phones, 3 users, analytics |
| **Repair** | ₹399 | ₹3,999 | Repair only | 100 tickets/mo, 2 technicians |
| **Repair Pro** | ₹699 | ₹6,999 | Repair only | Unlimited tickets, 5 technicians, customer tracking |
| **Hybrid** | ₹899 | ₹8,999 | Trade + Repair | Everything in Pro + Repair Pro |
| **Enterprise** | ₹1,499 | ₹14,999 | All + Trade Network | Multi-location, unlimited seats, cross-tenant linking |

### 5.2 Feature Gate Mapping

```
FEATURE_GATES:
  // Top-level business model gates
  flow_trade:        [starter, pro, hybrid, enterprise]
  flow_repair:       [repair, repair_pro, hybrid, enterprise]

  // Trade sub-features
  trade_orders:      [starter, pro, hybrid, enterprise]
  purchase_orders:   [starter, pro, hybrid, enterprise]
  imei_scanner:      [pro, hybrid, enterprise]
  bulk_orders:       [pro, hybrid, enterprise]

  // Repair sub-features
  repair_tickets:    [repair, repair_pro, hybrid, enterprise]
  repair_diagnosis:  [repair, repair_pro, hybrid, enterprise]
  repair_invoicing:  [repair_pro, hybrid, enterprise]
  customer_tracking: [repair_pro, hybrid, enterprise]
  technician_assign: [repair_pro, hybrid, enterprise]

  // Hybrid-only (self-repair)
  phone_repair_link: [hybrid, enterprise]
  repair_cogs:       [hybrid, enterprise]

  // Outsourced repair tracking (trader sends phone to external shop)
  external_repair:   [pro, hybrid, enterprise]    // V1: manual OUT_FOR_REPAIR status + COGS
  trade_network:     [enterprise]                 // V2: cross-tenant IMEI auto-sync

  // Shared (all paid plans)
  credit_tracking:   [pro, repair_pro, hybrid, enterprise]
  analytics:         [pro, repair_pro, hybrid, enterprise]
  public_sharing:    [pro, repair_pro, hybrid, enterprise]
```

### 5.3 Revenue Projections (Conservative)

| Metric | Month 6 | Month 12 | Month 18 |
|--------|--------:|--------:|--------:|
| Repair tenants | 200 | 1,000 | 3,000 |
| Hybrid tenants | 50 | 300 | 1,000 |
| MRR from repair | ₹1.0L | ₹5.5L | ₹18L |
| MRR from hybrid | ₹0.45L | ₹2.7L | ₹9L |
| **Total new MRR** | **₹1.45L** | **₹8.2L** | **₹27L** |

---

## 6. Functional Requirements

### 6.1 Repair Ticket Lifecycle

```
INTAKE → DIAGNOSED → IN_PROGRESS → COMPLETED → INVOICED → DELIVERED
                                                               ↓
                                                          CANCELLED (any stage)
```

#### FR-001: Ticket Creation (Intake)
- **Input**: Customer (existing or new), device info (brand/model/storage/color), IMEI (optional scan), reported issues (multi-select from tags + freetext), priority level, estimated cost, estimated delivery date
- **Output**: New repair ticket with status INTAKE, timeline event logged
- **Validation**: Customer required, at least one device identifier (brand+model OR IMEI), at least one reported issue

#### FR-002: Diagnosis
- **Input**: Per-issue breakdown with parts cost + labor cost, technician assignment
- **Output**: Ticket moves to DIAGNOSED, estimated cost updated, customer notifiable
- **Business rule**: Total diagnosed cost can differ from initial estimate; if >20% higher, flag for customer approval

#### FR-003: Repair Execution
- **Input**: Technician marks issues as resolved, adds timeline notes, logs parts used
- **Output**: Real-time timeline updates, cost accumulates
- **Business rule**: Cannot mark COMPLETED until all diagnosed issues are resolved OR explicitly marked as "customer declined"

#### FR-004: Completion & Invoicing
- **Input**: Final review, generate invoice
- **Output**: Ticket moves to COMPLETED → INVOICED, PDF invoice generated
- **Business rule**: Final cost = sum of (parts + labor) for resolved issues only

#### FR-005: Payment & Delivery
- **Input**: Payment recorded (Cash/UPI/Bank), device handed over
- **Output**: Ticket moves to DELIVERED, payment entry in ledger, receipt generated
- **Business rule**: Cannot deliver without payment OR explicit "credit" flag

#### FR-006: Customer Status Tracking
- **Input**: Share link generated (per ticket or per customer)
- **Output**: Public page showing: device info, current status, timeline events (sanitized), estimated delivery, cost estimate
- **No login required**: Token-based access (reuses existing shareService pattern)

### 6.2 Hybrid Cross-Flow Requirements

#### FR-007: Link Phone to Repair
- **Input**: Select existing Phone from inventory → create repair ticket referencing it
- **Output**: Phone status changes to IN_REPAIR, repair ticket has deviceInfo.phoneId set
- **Business rule**: Phone must be IN_STOCK to be linked; only one active repair per phone

#### FR-008: Repair Cost → COGS
- **Input**: Repair ticket completed for a linked phone
- **Output**: Phone's effective cost = purchasePrice + repairTicket.finalCost
- **Business rule**: Margin calculation on sale uses effective cost, not raw purchase price

#### FR-009: Return to Stock
- **Input**: Repair delivered (for self-owned phone)
- **Output**: Phone status returns to IN_STOCK, now marked as "repaired" with repair history
- **Business rule**: Delivery acknowledgment is automatic (tenant is the owner)

### 6.3 External Repair (Trader Outsources to Another Shop)

> **Scenario**: A trader (Tenant A) sends an inventory phone to an external repair shop for reconditioning. The shop may or may not be on StockFlow. The phone has physically left the trader's premises.

#### FR-010: Send Phone to External Repair — V1 (Manual, `pro`+)
- **Input**: Trader opens phone detail → taps "Send to External Repair" → fills: shop name, contact number (optional), reported issues, estimated cost, expected return date, tracking URL (optional — paste StockFlow public link if shop is on platform)
- **Output**: Phone status → `OUT_FOR_REPAIR`; `ExternalRepairRecord` attached to phone; phone blocked from Sale Order creation while in this state
- **Business rule**: Phone must be `IN_STOCK`; only one active external repair per phone at a time

#### FR-011: Log Return from External Repair — V1
- **Input**: Phone returned → trader taps "Mark Returned" → enters actual repair cost, repair notes (optional), date returned
- **Output**: Phone status → `IN_STOCK`; `externalRepairCost` stored; effective COGS = purchasePrice + externalRepairCost; repair history entry added
- **Business rule**: On sale, margin calculation uses the updated effective cost automatically

#### FR-012: Track via Public Link — V1
- **Input**: Trader pastes a tracking URL (could be the repair shop's StockFlow FR-006 link or any URL) when creating the ExternalRepairRecord
- **Output**: "Track" button in phone detail opens the stored URL in-browser
- **UX**: Phone detail shows: shop name · `OUT_FOR_REPAIR` badge · expected return date · estimated cost · Track button
- **Limitation**: Status is passive in V1 — trader taps the link manually. No auto-sync.

#### FR-013: Cross-Tenant Linked Repair — V2 (Trade Network, `enterprise`)
> Both trader and repair shop are StockFlow tenants. The platform detects the connection and offers to sync automatically.
- **Discovery**: Repair shop creates a ticket and enters an IMEI → system checks if that IMEI exists in another tenant's inventory → if found: *"This device may belong to [Trader Business Name] on StockFlow — link ticket?"*
- **Consent**: Trader receives in-app notification: *"[Repair Shop] started a ticket for your iPhone 14 (IMEI ····1234) — accept link?"*
- **Once linked**: Trader's phone detail shows live status from repair shop's ticket; repair cost auto-fills into trader's effective COGS when ticket is invoiced; either party can unlink at any time
- **Privacy**: Repair shop sees trader's business name only. Trader sees ticket status + timeline + final cost only. No cross-access to other data. Both parties must consent.

### 6.4 Shared Requirements (Both Flows)

#### FR-014: Adaptive Dashboard
- Trade-only tenant → stock value, revenue, margins, recent orders
- Repair-only tenant → tickets by status, repair revenue, turnaround time, pending pickups
- Hybrid → tabbed/sectioned view combining both

#### FR-015: Adaptive Navigation
- Nav items, the "+" FAB action, and drawer sections dynamically render based on `canUse("flow_trade")` / `canUse("flow_repair")`

#### FR-016: Unified Customer Profile
- A customer's detail page shows their sale orders (if trade active), purchase orders (if trade active), repair tickets (if repair active), and payment history (always)

---

## 7. Data Model

### 7.1 New Types (Repair Module)

```typescript
type RepairStatus =
  | "INTAKE"
  | "DIAGNOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "INVOICED"
  | "DELIVERED"
  | "CANCELLED";

type RepairPriority = "LOW" | "NORMAL" | "URGENT";

type RepairEventType =
  | "CREATED"
  | "DIAGNOSED"
  | "STARTED"
  | "ISSUE_RESOLVED"
  | "PART_ADDED"
  | "NOTE_ADDED"
  | "COMPLETED"
  | "INVOICED"
  | "DELIVERED"
  | "CANCELLED"
  | "CUSTOMER_NOTIFIED";

interface RepairTicket {
  id: string;
  counterpartyId: string;          // device owner — links to shared Customer

  // Device identification
  deviceInfo: {
    brand: string;
    model: string;
    storage?: string;
    color?: string;
    imeis?: string[];
    phoneId?: string;              // optional link to inventory Phone (hybrid only)
  };

  // Issues
  reportedIssues: string[];        // from masterData.issueTags + freetext
  diagnosedIssues: RepairIssue[];  // after technician diagnosis

  // Status & assignment
  status: RepairStatus;
  priority: RepairPriority;
  technicianId?: string;           // team member assigned

  // Financial
  estimatedCost: number;           // initial quote given to customer
  finalCost: number;               // actual cost after completion
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  amountPaid: number;

  // Scheduling
  estimatedDelivery: string;       // ISO date
  deliveredAt?: string;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: RepairEvent[];         // full audit trail
}

interface RepairIssue {
  id: string;
  description: string;
  partsCost: number;
  laborCost: number;
  partName?: string;               // e.g., "iPhone 15 OLED Screen"
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;             // technician who fixed it
  customerApproved: boolean;       // for issues added during diagnosis
}

interface RepairEvent {
  id: string;
  type: RepairEventType;
  description: string;
  cost?: number;
  metadata?: Record<string, any>;  // flexible payload per event type
  createdAt: string;
  createdBy: string;               // user ID
}
```

### 7.2 New Types (External Repair — Trader Side)

```typescript
// V1: manual record stored on the Phone when sent to an external shop
interface ExternalRepairRecord {
  id: string;
  shopName: string;                // freetext name of the repair shop
  shopContact?: string;            // phone number
  reportedIssues: string[];
  estimatedCost: number;
  expectedReturnDate?: string;     // ISO date
  trackingUrl?: string;            // paste URL (FR-006 link if shop is on StockFlow)
  sentAt: string;                  // ISO datetime
  returnedAt?: string;             // set when FR-011 "Mark Returned" is actioned
  actualCost?: number;             // filled on return

  // V2: cross-tenant fields (populated when Trade Network link is accepted)
  linkedTenantId?: string;         // repair shop's tenantId
  linkedTicketId?: string;         // repair shop's ticket UUID
  networkLinkStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "UNLINKED";
}
```

### 7.3 Modified Types

```typescript
// Phone — extended status set
type PhoneStatus =
  | "PENDING"
  | "IN_STOCK"
  | "IN_REPAIR"          // self-repair: hybrid tenant, ticket in own system
  | "OUT_FOR_REPAIR"     // outsourced: phone is at an external shop
  | "SOLD";

// Phone — add external repair fields
interface Phone {
  // ...existing fields...
  externalRepair?: ExternalRepairRecord;   // present when OUT_FOR_REPAIR
  externalRepairCost?: number;             // cumulative external repair spend (for COGS)
  repairHistory: RepairHistoryEntry[];     // log of all repairs (self + external)
}

interface RepairHistoryEntry {
  type: "SELF" | "EXTERNAL";
  cost: number;
  completedAt: string;
  notes?: string;
  ticketId?: string;      // for SELF repairs
  shopName?: string;      // for EXTERNAL repairs
}

// LedgerEntry — add repair payment types
type LedgerEntryType =
  | "PURCHASE" | "SALE" | "REPAIR_INCOME" | "REPAIR_PARTS_EXPENSE"
  | "EXTERNAL_REPAIR_PAYMENT"    // trader paying the external repair shop
  | "CUSTOMER_PAYMENT" | "SUPPLIER_PAYMENT" | "REFUND" | "...existing...";
```

### 7.3 Database Schema (Supabase)

```sql
-- Core repair ticket table
CREATE TABLE repair_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  counterparty_id UUID NOT NULL REFERENCES customers(id),
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_storage TEXT,
  device_color TEXT,
  device_imeis TEXT[],
  phone_id UUID REFERENCES phones(id),
  reported_issues TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'INTAKE',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  technician_id UUID REFERENCES team_members(id),
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  final_cost NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'UNPAID',
  amount_paid NUMERIC(12,2) DEFAULT 0,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnosed issues (line items)
CREATE TABLE repair_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  parts_cost NUMERIC(12,2) DEFAULT 0,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  part_name TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  customer_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit timeline events
CREATE TABLE repair_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC(12,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- RLS policies (tenant isolation)
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON repair_tickets
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

ALTER TABLE repair_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON repair_issues
  USING (ticket_id IN (
    SELECT id FROM repair_tickets WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  ));

ALTER TABLE repair_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON repair_events
  USING (ticket_id IN (
    SELECT id FROM repair_tickets WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  ));

-- Indexes
CREATE INDEX idx_repair_tickets_tenant_status ON repair_tickets(tenant_id, status);
CREATE INDEX idx_repair_tickets_counterparty ON repair_tickets(counterparty_id);
CREATE INDEX idx_repair_tickets_technician ON repair_tickets(technician_id);
CREATE INDEX idx_repair_tickets_phone ON repair_tickets(phone_id) WHERE phone_id IS NOT NULL;
-- V2: GIN index on IMEI array for cross-tenant Trade Network lookup
CREATE INDEX idx_repair_tickets_imeis ON repair_tickets USING GIN (device_imeis);

-- External repair records (trader sends phone to external shop — V1 manual, V2 cross-tenant)
CREATE TABLE external_repair_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  phone_id UUID NOT NULL REFERENCES phones(id),
  shop_name TEXT NOT NULL,
  shop_contact TEXT,
  reported_issues TEXT[] NOT NULL,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  expected_return_date DATE,
  tracking_url TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  -- V2: cross-tenant Trade Network fields
  linked_tenant_id UUID,                      -- repair shop's tenant_id (NULL in V1)
  linked_ticket_id UUID,                      -- repair shop's repair_tickets.id (NULL in V1)
  network_link_status TEXT DEFAULT 'MANUAL',  -- MANUAL | PENDING | ACCEPTED | REJECTED | UNLINKED
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_network_link_status CHECK (
    network_link_status IN ('MANUAL', 'PENDING', 'ACCEPTED', 'REJECTED', 'UNLINKED')
  )
);

ALTER TABLE external_repair_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON external_repair_records
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX idx_external_repair_tenant_phone ON external_repair_records(tenant_id, phone_id);
CREATE INDEX idx_external_repair_returned ON external_repair_records(tenant_id, returned_at)
  WHERE returned_at IS NULL;  -- efficiently query still-out phones
```

---

## 8. User Experience — Per Segment

### 8.1 Repair-Only Tenant Experience

#### What They See

**Bottom Nav**: `[ Dashboard ]  [ + New Ticket ]  [ ☰ Menu ]`

**Dashboard**:
- Today's snapshot: tickets by status (intake / in-progress / ready for pickup)
- Revenue this week
- Average turnaround time
- Pending pickups count
- Overdue tickets alert
- Recent activity feed

**Menu Drawer**:
- OPERATIONS: Repairs, Customers
- FINANCE: Payments, Ledger, Analytics
- SETTINGS: Settings, Team

**What is Hidden** (gated behind `flow_trade`): Inventory, Purchase Orders, Sales Orders, Stock Value, Margin analytics, Phone ingestion, Bulk import.

#### Key Workflows

1. Customer walks in → Tap "+" → CreateRepairSheet → fills device info + issues → ticket created
2. Technician diagnoses → Opens ticket → adds issues with costs → marks DIAGNOSED
3. Repair in progress → Marks issues resolved one by one → timeline updates live
4. Complete + invoice → Taps "Complete" → generates invoice → records payment
5. Customer checks status → Opens shared link → sees "In Progress" with timeline

### 8.2 Hybrid Tenant Experience

#### Additional Capabilities (On Top of Both Flows)

- Inventory page shows phones with IN_REPAIR status badge
- "Send to Repair" action on any IN_STOCK phone → creates linked ticket
- Repair completion → phone returns to IN_STOCK with updated effective cost
- Sale order shows repair history + total COGS breakdown
- Analytics shows true margin including repair costs

#### Cross-Flow Workflow

```
PO (Buy) → Phone IN_STOCK → "Send to Repair" → Ticket IN_PROGRESS
    → Repair COMPLETED → Phone IN_STOCK (repaired) → SO (Sell)

    COGS = Purchase Price + Repair Cost
    Margin = Sale Price - COGS
```

### 8.3 Trader with Outsourced Repair (Pro+)

#### What Changes in Their Existing Trade UI

- Phone detail: new **"Send to External Repair"** action (gated by `external_repair`)
- Inventory list: `OUT_FOR_REPAIR` orange badge alongside existing statuses
- Inventory filter: "Out for Repair" filter option
- Dashboard widget: "X phones currently at external shops"
- Sale Order picker: `OUT_FOR_REPAIR` phones are greyed out with tooltip "At external repair shop"

#### Phone Detail Card — OUT_FOR_REPAIR State

```
┌───────────────────────────────────────────┐
│  iPhone 14 · 128GB · Black                 │
│  IMEI: ············1234                     │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ 🔧 OUT FOR REPAIR                  │  │
│  │ Rajesh Mobile Repairs            │  │
│  │ Expected return: 20 May 2026     │  │
│  │ Estimated cost: ₹4,000            │  │
│  │        [Track ↗]  [Mark Returned] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Purchase Cost:  ₹15,000                   │
│  + Repair Est.:  ₹4,000                    │
│  Eff. COGS est.: ₹19,000                   │
└───────────────────────────────────────────┘
```

#### V2 Trade Network — Trader Experience

- Same "Send to External Repair" flow, but system detects the shop is also on StockFlow (via IMEI match after shop creates their ticket)
- Trader receives push notification: *"Rajesh Mobile Repairs started a repair for your iPhone 14 — accept live tracking link?"*
- Once accepted: phone detail shows live status from shop's ticket; no manual tracking needed
- Repair cost auto-fills trader's COGS when shop invoices the ticket

### 8.4 Trade-Only Tenant (No Change)

Existing experience, unchanged. `flow_repair` is not in their plan's gate array, so repair pages/nav/routes never render.

---

## 9. Technical Architecture

### 9.1 Module Structure

```
apps/app/src/
├── features/
│   ├── repairs/                    ← NEW MODULE
│   │   ├── types.ts
│   │   ├── slice.ts
│   │   └── selectors.ts
│   ├── inventory/                  ← MODIFIED (add IN_REPAIR status)
│   ├── billing/                    (unchanged)
│   ├── purchasing/                 (unchanged)
│   ├── customers/                  (unchanged — shared)
│   ├── ledger/                     ← MODIFIED (add REPAIR_INCOME type)
│   └── masterData/                 ← MODIFIED (add repairParts)
├── pages/
│   ├── Repairs.tsx                 ← NEW
│   ├── RepairDetail.tsx            ← NEW
│   └── ...existing...
├── components/shared/
│   ├── CreateRepairSheet.tsx       ← NEW
│   ├── DiagnosisSheet.tsx          ← NEW
│   └── ...existing...
└── hooks/
    └── usePlan.ts                  ← MODIFIED (add flow gates + new plans)
```

### 9.2 State Management

```
Redux Store
├── repairs: RepairsState           ← NEW
├── inventory: InventoryState       (add IN_REPAIR status handling)
├── billing: BillingState           (unchanged)
├── purchasing: PurchasingState     (unchanged)
├── customers: CustomersState       (unchanged — shared)
├── ledger: LedgerState             (add REPAIR_INCOME/EXPENSE types)
├── masterData: MasterDataState     (add repairParts array)
├── tenant: TenantState             (unchanged — plan drives gates)
└── sync: SyncState                 (unchanged — handles repair actions too)
```

### 9.3 Sync Strategy

Repairs follow the same offline-first pattern:
1. Action dispatched → committed to local Redux store immediately
2. `supabaseMiddleware` catches `repairs/addTicket`, `repairs/updateStatus`, etc.
3. Pushes to Supabase → on failure, queues in `sync.outbox`
4. Retries on reconnection

### 9.4 Conditional Routing

```tsx
// App.tsx — repair routes gated by feature
<Route path="/repairs" element={
  <FeatureGate feature="flow_repair" redirect="/">
    <Repairs />
  </FeatureGate>
} />
<Route path="/repairs/:id" element={
  <FeatureGate feature="flow_repair" redirect="/">
    <RepairDetail />
  </FeatureGate>
} />
```

### 9.5 Adaptive "+" Button Logic

```
hasTradeFlow AND hasRepairFlow → show picker sheet ("Add Phone" / "New Repair")
hasTradeFlow only             → navigate to /add (phone ingestion)
hasRepairFlow only            → open CreateRepairSheet directly
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

| Task | Size | Dependencies |
|------|------|-------------|
| Add `flow_trade`, `flow_repair` to FEATURE_GATES | S | None |
| Add plan tier labels (repair, repair_pro, hybrid) | S | None |
| Gate existing trade nav items behind `flow_trade` | S | Above |
| Create `features/repairs/types.ts` | M | None |
| Create `features/repairs/slice.ts` | M | types |
| Create `features/repairs/selectors.ts` | S | slice |
| Register in store + persist config | S | slice |
| Add sync middleware cases for repair actions | M | slice |

### Phase 2: Core Repair UI (Week 2-4)

| Task | Size | Dependencies |
|------|------|-------------|
| `pages/Repairs.tsx` — ticket list with status filters | L | Phase 1 |
| `pages/RepairDetail.tsx` — full ticket view + timeline | L | Phase 1 |
| `CreateRepairSheet.tsx` — intake form | M | Phase 1 |
| Add routes to App.tsx | S | Pages |
| Add "Repairs" to AppDrawer (gated) | S | Phase 1 |
| Adaptive "+" button | S | CreateRepairSheet |

### Phase 3: Repair Lifecycle (Week 4-6)

| Task | Size | Dependencies |
|------|------|-------------|
| Status transition buttons in RepairDetail | M | Phase 2 |
| `DiagnosisSheet.tsx` — issue entry with costs | M | Phase 1 |
| Issue resolution UI (per-issue checkoff) | M | DiagnosisSheet |
| Timeline component (vertical, event-based) | M | Phase 2 |
| Cost summary card (estimated vs actual) | S | DiagnosisSheet |
| Priority + technician assignment | S | Phase 2 |

### Phase 4: Payments & Invoicing (Week 6-7)

| Task | Size | Dependencies |
|------|------|-------------|
| Repair invoice generation | M | Phase 3 |
| Payment recording (reuse PaymentAllocationSheet pattern) | M | Phase 3 |
| REPAIR_INCOME ledger entry type | S | Payment |
| Repair payments in customer detail | S | Payment |

### Phase 5: Customer Tracking (Week 7-8)

| Task | Size | Dependencies |
|------|------|-------------|
| Public repair status page (token-based) | M | Phase 3 |
| QR code / share link generation | S | Status page |
| Status change → push notification | S | Existing push infra |

### Phase 6: Hybrid Cross-Flow (Week 8-10)

| Task | Size | Dependencies |
|------|------|-------------|
| "Send to Repair" action on Phone detail | M | Phase 3 |
| IN_REPAIR phone status + badge | S | Above |
| Repair cost → effective COGS on phone | M | Above |
| Phone repair history visible in sale flow | S | COGS |
| Analytics: true margin with repair costs | M | COGS |

### Phase 7: External Repair Tracking — V1 (Week 10-12, parallel with Phase 6)

| Task | Size | Dependencies |
|------|------|--------------|
| Add `OUT_FOR_REPAIR` to `PhoneStatus` | S | None |
| `sendToExternalRepair` action in inventory slice | S | None |
| `markExternalRepairReturned` action + COGS update | M | Above |
| `SendToExternalRepairSheet.tsx` — shop name, issues, cost, ETA, tracking URL | M | Actions |
| `MarkRepairReturnedSheet.tsx` — actual cost, notes, date | M | Actions |
| Phone detail: external repair card + Track button | M | Sheets |
| Inventory list: `OUT_FOR_REPAIR` badge + filter | S | Status |
| Block SO creation for `OUT_FOR_REPAIR` phones | S | Status |
| Dashboard widget: "X phones out for repair" | S | Status |
| `external_repair_records` Supabase table + RLS | M | All above |

### Phase 8: Dashboard & Polish (Week 12-13)

| Task | Size | Dependencies |
|------|------|-------------|
| Repair dashboard widgets | M | Phase 3 |
| Adaptive dashboard (conditional sections by flow) | M | Widgets |
| Repair analytics page | M | Phase 4 |
| Supabase migration scripts | M | All phases |
| Razorpay plan tier setup (repair/repair_pro/hybrid) | S | Business decision |

### Phase 9: Trade Network — V2 (Future, post-launch)

| Task | Size | Dependencies |
|------|------|--------------|
| Cross-tenant IMEI lookup (Supabase Edge Function) | L | Phase 5 public pages |
| Trade network link request / consent flow (UI + DB) | L | Phase 7 |
| Push notification to trader on link offer | M | Consent flow |
| Realtime status sync (Supabase Realtime channels) | L | Consent flow |
| Auto-COGS fill on repair ticket invoiced | M | Realtime sync |
| `trade_network` feature gate + enterprise gating | S | All above |
| Privacy audit — cross-tenant data boundaries | M | All above |

**Total Estimated Duration**: 12-13 weeks for V1 (Phases 1-8). Trade Network (Phase 9) is a separate initiative.

---

## 11. Edge Cases & Risk Mitigation

### 11.1 Data Edge Cases

| Edge Case | Scenario | Mitigation |
|-----------|----------|------------|
| Orphaned ticket | Customer deleted while ticket is active | Block customer deletion if open tickets exist; show warning |
| Duplicate IMEI intake | Same phone submitted for repair twice | Warn on IMEI match with existing open ticket; allow override with confirmation |
| Hybrid unlink | Repair linked to phone, then phone deleted | Ticket survives with deviceInfo snapshot; phoneId becomes null |
| Zero-cost repair | Warranty/goodwill repair with no charge | Allow ₹0 final cost; skip invoice generation; mark directly as DELIVERED |
| Partial payment pickup | Customer pays partial, wants device | paymentStatus: PARTIAL; delivery requires full OR explicit "credit" flag from owner |
| Cancelled mid-repair | Customer says "don't fix it, return as-is" | CANCELLED from any stage; parts cost logged as loss in ledger |
| Technician leaves | Assigned tech quits mid-repair | Ticket stays open; tech field nullable; reassignment UI available to owner |
| Offline diagnosis | No internet when diagnosing | Works fully — local-first Redux; queues to outbox; syncs when reconnected |
| Plan downgrade | Hybrid → repair_only while phones in inventory | Trade UI hidden but data preserved; phones remain in DB unchanged |
| Cost overrun | Actual repair costs 2x the estimate | Flag when `finalCost > estimatedCost * 1.2`; prompt to notify customer |

### 11.2 Business Logic Edge Cases

| Edge Case | Scenario | Mitigation |
|-----------|----------|------------|
| Solo operator | Repair shop has no registered technicians | Technician field optional; owner is implicit assignee |
| Customer disputes cost | "You said ₹2000 not ₹3500" | Timeline logs every cost change with timestamp; customer page shows initial estimate |
| Phone lost at shop | Device goes missing before delivery | CANCELLED with reason "DEVICE_LOST"; triggers owner alert; no invoice generated |
| Same phone, different customer | IMEI previously seen for another customer | Allow — IMEI is device identifier, not ownership proof |
| Multi-device intake | Customer drops 3 phones at once | One ticket per device (V1); batch creation shortcut (V2) |
| Repair extends far past ETA | Still in progress 2 weeks late | Overdue tickets section on dashboard; no automatic cancellation |

### 11.3 External Repair Edge Cases

| Edge Case | Scenario | Mitigation |
|-----------|----------|------------|
| SO created while phone is out | Salesperson tries to sell `OUT_FOR_REPAIR` phone | Block SO creation; show error: "Phone is at [shop name] for repair" |
| Shop charges more than agreed | Actual cost ₹5,000 vs estimate ₹2,500 | Trader enters actual cost on return; system shows delta vs estimate; no auto-reject |
| Phone never returned | Trader forgets to follow up | Dashboard overdue widget: "X phones out for repair past expected return date" |
| External shop loses the phone | Device missing at repair shop | Trader cancels via "Report Lost" → phone removed from inventory; loss logged in ledger |
| Trader forgets to paste tracking URL | Didn't paste URL when sending | Can edit the `ExternalRepairRecord` to add URL later |
| Multiple external repairs same phone | Phone sent, returned, sent again | Each `OUT_FOR_REPAIR` cycle creates a new `ExternalRepairRecord`; history preserved |
| V2: Two traders claim same IMEI | IMEI match found in two tenants' inventories | IMEI match only triggers an *offer to link* — requires manual acceptance; no auto-assumption |
| V2: Link accepted, shop changes cost | Repair invoiced for different amount than discussed | Trader receives notification of final cost before COGS auto-update; can dispute |
| V2: Network drops mid-consent | Connection lost during link accept/reject | Link stays `PENDING`; re-notified on reconnect; no partial data applied |
| V2: Repair shop on free plan | Shop can't participate in Trade Network | V2 IMEI lookup only runs for enterprise tenants; graceful fallback to V1 manual URL |

### 11.4 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Performance with many tickets | Medium | Degraded list rendering | Virtual scrolling; status-based pagination |
| Sync conflicts on status transitions | Low | Data inconsistency | Last-write-wins; status only moves forward (no backward transitions) |
| Bundle size increase | Medium | Slower initial load | Code-split repair pages; lazy-load module |
| Feature flag latency on plan upgrade | Low | Momentary wrong UI | Optimistic gate from cached plan; refresh on plan change |
| Migration complexity | Medium | Deployment risk | Additive schema only; zero modifications to existing tables |
| V2 cross-tenant privacy breach | Low | Critical — regulatory + trust | RLS at row level; no FK across tenant boundaries; consent gates every data share |
| V2 Realtime subscription storm | Medium | Server overload at scale | Limit Realtime to enterprise plan; debounce updates; max 1 channel per linked pair |

---

## 12. Competitive Analysis

### 12.1 Feature Comparison Matrix

| Feature | StockFlow (Proposed) | RepairDesk | BytePhase | Paper/WhatsApp |
|---------|:---:|:---:|:---:|:---:|
| Mobile-first | ✅ | ❌ (desktop) | ⚠️ Partial | ✅ |
| Offline capable | ✅ | ❌ | ❌ | ✅ |
| Ticket lifecycle | ✅ | ✅ | ✅ | ❌ |
| Per-issue costing | ✅ | ✅ | ⚠️ Partial | ❌ |
| Customer tracking link | ✅ | ✅ | ❌ | ❌ |
| Buy/Sell + Repair in one | ✅ | ❌ | ❌ | N/A |
| Hybrid COGS tracking | ✅ | ❌ | ❌ | ❌ |
| **Outsourced repair tracking** | **✅** | ❌ | ❌ | ❌ |
| **Cross-tenant IMEI sync (V2)** | **✅** | ❌ | ❌ | ❌ |
| Indian payment modes (UPI/Cash) | ✅ | ❌ | ⚠️ Partial | ✅ |
| IMEI scanning | ✅ | ⚠️ Partial | ❌ | ❌ |
| Financial ledger integration | ✅ | ⚠️ Partial | ❌ | ❌ |
| Pricing (India) | ₹399-899/mo | $49-149/mo | ₹500-1500/mo | Free |

### 12.2 Our Unique Moats

1. **Only platform combining trade + repair** — no competitor does both
2. **Outsourced repair tracking** — entirely unserved need; no competitor even considers it
3. **Cross-tenant Trade Network (V2)** — the only SaaS that auto-links two businesses' workflows via IMEI match
4. **Offline-first** — critical in Tier 2/3 cities with patchy connectivity
5. **AI-powered IMEI scanning** — instant device identification, no manual entry
6. **Hybrid COGS** — automatically tracks true margin including all repair costs
7. **Indian-market native** — INR, UPI, GST-ready, India-first UX

---

## 13. Feasibility Study

### 13.1 Technical Feasibility

| Aspect | Assessment | Confidence |
|--------|-----------|:----------:|
| Feature module creation | Standard Redux slice pattern; done 5+ times in this codebase | 95% |
| Conditional UI rendering | `canUse()` system already handles this perfectly | 98% |
| New pages + sheets | Same tech stack, same Tailwind patterns | 95% |
| Supabase schema | Additive tables only; zero migration risk to existing data | 95% |
| Sync middleware | Exact same pattern as billing/purchasing | 90% |
| Public status page | Reuses existing shareService + public route infrastructure | 90% |
| Hybrid COGS link | Moderate — careful state coordination between inventory + repairs | 80% |
| Dashboard adaptation | Conditional rendering based on flow gates, moderate complexity | 85% |

**Overall Technical Feasibility: HIGH (90%+)**

### 13.2 Resource Feasibility

| Resource | Required | Available | Gap |
|----------|----------|-----------|-----|
| Frontend dev | 10-12 weeks | 1 dev (full-time) | None (timeline adjusted) |
| Backend/DB | 2-3 days (schema + RLS + indexes) | Same dev | None |
| Design | No separate designer needed | AI + existing Tailwind patterns | None |
| Testing | 1-2 weeks integrated | Same dev | None |
| DevOps | Existing Supabase + Cloudflare | Already running | None |

### 13.3 Business Feasibility

| Factor | Assessment |
|--------|-----------|
| Market demand | High — 2.5L+ repair shops, virtually no good mobile-first competitor |
| Willingness to pay | Moderate — ₹300-500/mo proven in Tier 1, validation needed in Tier 2/3 |
| Sales channel | Same organic + referral + WhatsApp community channels as trade |
| Support burden | Low — same app, same infra, just more features |
| Churn risk | Low — once tracking repairs digitally, near-impossible to go back to paper |

---

## 14. Success Metrics & KPIs

### 14.1 Product Metrics

| Metric | Target (Month 3) | Target (Month 6) | Target (Month 12) |
|--------|:-:|:-:|:-:|
| Repair tenants activated | 50 | 200 | 1,000 |
| Tickets created / tenant / week | 5+ | 8+ | 12+ |
| Full lifecycle completion rate | 60% | 75% | 85% |
| Customer tracking links shared | 30% of tickets | 50% | 70% |
| Hybrid plan conversions | 10 | 50 | 300 |
| Phones marked OUT_FOR_REPAIR / month | 20 | 100 | 500 |
| External repair avg cost logged | ₹2,000+ | ₹3,000+ | ₹4,000+ |
| V2 Trade Network cross-tenant links | 0 | 5 | 100 |

### 14.2 Business Metrics

| Metric | Target (Month 6) | Target (Month 12) |
|--------|:-:|:-:|
| MRR from repair plans | ₹1.0L | ₹5.5L |
| MRR from hybrid plans | ₹0.45L | ₹2.7L |
| Repair segment churn rate | <8%/mo | <5%/mo |
| CAC for repair segment | <₹500 | <₹400 |
| NPS (repair users) | 40+ | 50+ |

### 14.3 Engineering Metrics

| Metric | Target |
|--------|--------|
| Time to first ticket (new user, cold start) | <3 minutes |
| Repair page load time | <1.5s cold / <500ms warm |
| Offline ticket creation success rate | 100% |
| Sync failure rate | <0.1% |

---

## 15. Use Cases

### UC-001: Walk-In Repair (Happy Path)

**Actor**: Shop owner (Repair plan)

1. Customer walks in with cracked screen iPhone 15
2. Owner taps "+" → CreateRepairSheet opens
3. Selects/creates customer "Ravi Kumar" via CustomerPicker
4. Enters device: iPhone 15, 128GB, Black (CatalogAutocomplete)
5. Scans IMEI (optional)
6. Selects issue tag "Screen Crack", priority: Normal
7. Estimates cost: ₹3,500, delivery: Tomorrow 6 PM
8. Taps "Create Ticket" → ticket appears under INTAKE
9. Shares tracking link via WhatsApp with customer
10. Technician diagnoses → confirms screen replacement → ₹3,200 parts + ₹500 labor
11. Technician replaces screen → marks issue resolved
12. Owner marks COMPLETED → generates invoice (₹3,700)
13. Customer returns, pays ₹3,700 via UPI
14. Owner records payment → marks DELIVERED
15. Customer's tracking page shows "Delivered ✓"

### UC-002: Cost Overrun Handling

**Actor**: Shop owner

1. Ticket in DIAGNOSED state, customer quoted ₹2,000
2. During repair, tech discovers additional issue (motherboard IC)
3. Opens ticket → adds new issue: "IC Replacement — ₹1,500 parts + ₹800 labor"
4. System flags: "New total ₹4,300 exceeds estimate ₹2,000 by 115% — notify customer?"
5. Owner taps "Notify Customer" → tracking page updates with revised estimate
6. Customer approves via call → owner marks `customerApproved: true`
7. Repair continues to completion

### UC-003: Hybrid Buy-Repair-Sell

**Actor**: Hybrid operator

1. Creates PO → buys "dead" iPhone 14 for ₹15,000
2. Phone enters inventory as IN_STOCK
3. Opens phone detail → taps "Send to Repair"
4. System creates repair ticket linked to this phone (`phoneId` set)
5. Phone status → IN_REPAIR (visible in inventory with repair badge)
6. Technician: screen (₹4,000) + battery (₹1,500) + labor (₹1,000) = ₹6,500
7. Ticket DELIVERED (auto, tenant owns the phone)
8. Phone returns to IN_STOCK; effective cost = ₹21,500 (₹15K + ₹6.5K)
9. Creates SO → sells phone for ₹28,000
10. Analytics: Revenue ₹28K, COGS ₹21.5K, True Margin ₹6,500 (23.2%)

### UC-004: Customer Tracks Repair (No App)

**Actor**: End customer (no StockFlow account)

1. Customer receives WhatsApp message with tracking link
2. Opens in mobile browser — no login required
3. Sees: "Your iPhone 15 · Status: In Progress"
4. Timeline: Received → Diagnosed → In Progress
5. Estimated delivery: Tomorrow 6:00 PM
6. Next day page updates to "Ready for Pickup"
7. Customer visits shop, device handed over

### UC-005: Multi-Technician Assignment

**Actor**: Shop owner with 3 technicians (Repair Pro plan)

1. Morning: 5 tickets in INTAKE
2. Owner opens each → assigns to technicians
3. Each tech sees their assigned queue (filtered view)
4. Tech A completes repair → marks issue resolved
5. Timeline: "Screen replaced by Suresh (Tech A)"
6. Owner has full visibility without being physically present

### UC-006: Plan Upgrade — Repair to Hybrid

**Actor**: Repair shop owner who starts buying/selling phones

1. Owner subscribes to Hybrid plan via Razorpay
2. Supabase updates `tenant.plan` → app refreshes feature flags
3. Immediately: Inventory, POs, SOs appear in menu
4. "+" button now shows picker: "Add Phone" / "New Repair"
5. Existing repair data intact — zero migration required
6. Can now link phones to repair tickets (hybrid flow unlocked)

### UC-007: Offline Repair Logging

**Actor**: Technician in basement workshop (no signal)

1. App shows "Offline — changes will sync later" banner
2. Tech opens ticket → marks issue resolved → adds note
3. Changes saved to IndexedDB via redux-persist
4. Tech moves to ground floor (signal returns)
5. Sync engine pushes queued actions to Supabase
6. Customer tracking page updates in real-time

### UC-008: Trader Outsources Repair — V1 (Manual Tracking)

**Actor**: Suresh — bulk trader (Pro plan) who sends phones to an external shop

1. Suresh buys 5 dead iPhone 13s via PO; they enter inventory as IN_STOCK
2. Opens iPhone 13 #3 detail → taps "Send to External Repair"
3. `SendToExternalRepairSheet` opens:
   - Shop: "Rajesh Mobile Repairs"
   - Issues: Screen + Battery
   - Estimated cost: ₹4,000
   - Expected return: 20 May 2026
   - Tracking URL: *(pastes link Rajesh sent via WhatsApp)*
4. Taps "Send" → phone status → `OUT_FOR_REPAIR`
5. Inventory shows phone with orange "Out for Repair" badge
6. Dashboard shows: "1 phone at external repair shops"
7. Suresh taps "Track" in phone detail → Rajesh's public StockFlow page opens in browser
8. 3 days later: phone returned by runner
9. Suresh opens phone → taps "Mark Returned"
10. `MarkRepairReturnedSheet` opens: actual cost ₹3,800, notes "screen + battery done"
11. Taps "Confirm" → phone → IN_STOCK; effective COGS = ₹12,000 (PO) + ₹3,800 = ₹15,800
12. Creates SO → sells for ₹20,000 → margin = ₹4,200 (26.6%)

### UC-009: Trader Outsources Repair — V2 (Cross-Tenant Auto-Sync)

**Actor**: Priya — enterprise trader, and "Kiran's Tech" — also a StockFlow tenant (Repair Pro)

1. Priya sends iPhone 14 to Kiran's Tech via the same V1 flow
2. Kiran opens app → creates repair ticket → scans IMEI 355134XXXXXXXX
3. System detects IMEI exists in Priya's inventory (cross-tenant IMEI index)
4. Kiran sees: *"This device may belong to Priya's Phones on StockFlow — link ticket?"* → taps Yes
5. Priya receives push notification: *"Kiran's Tech started a repair for your iPhone 14 — accept link?"*
6. Priya taps Accept → link established
7. Priya's phone detail now shows live status:
   ```
   🔧 REPAIR IN PROGRESS @ Kiran's Tech
   Status: In Progress · Updated 2 min ago
   Diagnosed: Screen + IC repair · Est: ₹7,500
   Expected: 21 May  [View Timeline]
   ```
8. Kiran marks ticket INVOICED at ₹7,200
9. Priya receives: *"Repair completed — ₹7,200. Update your COGS?"*
10. Priya taps Accept → effective COGS: ₹15,000 + ₹7,200 = ₹22,200
11. Kiran marks DELIVERED → Priya's phone → IN_STOCK automatically
12. Priya creates SO → sells ₹28,000 → true margin: ₹5,800 (20.7%)

---

## 16. Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| Ticket | A repair job for a single device |
| Intake | Initial receipt of a device for repair |
| Diagnosis | Technical assessment of issues and cost estimation |
| COGS | Cost of Goods Sold — purchase price + repair cost (hybrid operators) |
| Counterparty | Any customer/supplier in the system (shared entity across flows) |
| Flow gate | Top-level feature flag controlling an entire business model |
| External repair | A repair outsourced to a third-party shop; phone physically leaves trader's premises |
| OUT_FOR_REPAIR | Phone status: device is at an external repair shop; blocked from Sale Orders |
| IN_REPAIR | Phone status: device is in a self-repair workflow within the same hybrid tenant |
| Trade Network | V2 cross-tenant feature: two StockFlow tenants (trader + repair shop) auto-link via IMEI match |
| Network link | A confirmed consent-based connection between a trader's phone record and a repair shop's ticket |
| Hybrid bridge | The linking layer between trade and repair flows |

### B. Supabase Edge Functions (Future)

```
POST /functions/v1/repair-ticket-notify      — send status update notification to customer
POST /functions/v1/repair-invoice-pdf        — generate styled repair invoice PDF
GET  /functions/v1/repair-public-status      — public status page data (token-authenticated)
POST /functions/v1/trade-network-imei-lookup — V2: check if IMEI belongs to another tenant's inventory
POST /functions/v1/trade-network-link-notify — V2: push notification to trader for link offer/accept/reject
```

### C. Migration Path from Paper

For onboarding repair shops currently using paper registers:

1. **Day 1**: Create customers + start logging new tickets only (no backfill required)
2. **Week 1**: All new repairs go through StockFlow; old paper for historical reference only
3. **Week 2**: Share tracking links — customers respond positively — word of mouth begins
4. **Month 1**: Full adoption; paper register deprecated; financial records now digital

### D. Future Roadmap (V2+)

- **Trade Network (V2)**: Cross-tenant IMEI auto-sync — trader outsources to StockFlow repair shop, both get live status + auto-COGS; builds a two-sided network effect
- External repair in-app payment: trader pays repair shop directly via StockFlow wallet
- Verified repair shops: "StockFlow Certified" badge with quality + turnaround metrics
- Network marketplace: traders browse nearby repair shops on-platform and outsource directly
- Parts inventory with stock levels and auto-reorder alerts
- Warranty period tracking with automatic expiry notifications
- Batch intake (multiple devices from one customer, one session)
- WhatsApp Business API integration for automated status messages
- Technician performance analytics (speed, quality, customer satisfaction score)
- Customer satisfaction rating per completed ticket
- Integration with parts suppliers (order parts directly from app)
- Multi-language support (Hindi, Tamil, Telugu)

---

*End of Document*
