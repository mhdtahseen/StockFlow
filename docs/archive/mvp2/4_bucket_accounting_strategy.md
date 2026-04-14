# 4-Bucket Financial Accounting Strategy

## Overview
As part of the **MVP-2 Transformation**, the financial engine of **StockFlow** has been upgraded from a generic "Money Added/Withdrawn" model to a professional, high-precision **4-Bucket Accounting Strategy**.

This strategy ensures that every single rupee moving through the application is explicitly categorized by its economic purpose. This prevents "financial drift" and enables accurate Profit & Loss (P&L) reporting, even with complex credit sales and purchase returns.

---

## 🏗️ The 4-Bucket Architecture

The system categorizes every `ledger` entry into one of four distinct buckets:

### 1. **Equity & Capital Bucket**
*   **Purpose**: Tracks the owner's investment and drawings.
*   **Types**: `CAPITAL_INJECTION`, `WITHDRAWAL`, `PROFIT_WITHDRAWAL`.
*   **Role**: Distinguishes between "Business Profit" and "Owner's Money."

### 2. **Settlement & Debt Bucket (AR/AP)**
*   **Purpose**: Tracks the realization of cash from previous credit obligations.
*   **Types**: `CUSTOMER_PAYMENT` (Accounts Receivable), `SUPPLIER_PAYMENT` (Accounts Payable).
*   **Role**: Ensures that paying off a supplier or collecting from a customer doesn't inflate your "Revenue"—it simply shifts debt into cash.

### 3. **Revenue & P&L Bucket (Operational)**
*   **Purpose**: Tracks the actual business performance (Accrual).
*   **Types**: `PHONE_SALE` (Revenue), `FUNDS_CONSUMED` (Stock Consumption/COGS), `REPAIR_COST` (Expense).
*   **Role**: This bucket tells you how much money the business *earned* or *spent* on stock, regardless of when the cash was actually collected.

### 4. **Internal Liquidity Bucket (Escrow/Lien)**
*   **Purpose**: Tracks money held for specific pending actions.
*   **Types**: `FUNDS_PLEDGED`, `FUNDS_RELEASED`.
*   **Role**: When you negotiate a phone purchase, the money is moved from the **Wallet** to the **Lien** (Escrow). It’s still yours, but it’s "Pledged."

---

## 📊 Comparison: Legacy vs. 4-Bucket

| Feature | Legacy (v1) | 4-Bucket (MVP2) |
| :--- | :--- | :--- |
| **Sales Tracking** | Only tracks the "Cash portion" at the counter. | Logs the **Full Total Value** immediately (Accrual). |
| **Credit Sales** | Hidden in the orders table; manual math needed. | Explicitly balanced in the ledger via negative `CUSTOMER_PAYMENT` offsets. |
| **Repairs** | Often lost in general "Withdrawals." | Explicitly typed `REPAIR_COST` tied to specific devices. |
| **Escrow** | Abstract concepts. | Real-time `Pledged` vs `Available` wallet balance. |
| **Accounting Standard** | Cash-Basis (Incomplete). | Accrual-Basis (Professional). |

---

## 🔍 Audit Findings (The Remediation)

During the implementation of the 4-Bucket strategy, a comprehensive audit revealed several "outliers" that were corrected:

1.  **Sign Inconsistencies**:
    *   *Finding*: Repair costs and purchase returns were using positive numbers in some components, which incorrectly inflated the wallet balance.
    *   *Fix*: Standardized a **Sign-Aware Ledger**. All outflows (Payments, Repairs, Consumption) are now strictly negative (-), and all inflows (Sales, Refunds, Capital) are positive (+).

2.  **Missing Rev/Exp Balance**:
    *   *Finding*: Buying a phone for 50k and paying 10k only logged a 10k entry. The 40k liability was invisible to the ledger.
    *   *Fix*: Every transaction is now "Total Value Aware." A 50k purchase logs a -50k `FUNDS_CONSUMED` entry and a +40k `SUPPLIER_PAYMENT` (Credit Offset) if unpaid.

3.  **FIFO Settlement Clarity**:
    *   *Finding*: Lump-sum payments to suppliers/customers were generically logged as "Withdrawals."
    *   *Fix*: These now use explicit `SUPPLIER_PAYMENT` types, enabling the system to automatically link payoffs to specific historical orders via FIFO (First-In-First-Out).

---

## 🏆 Benefits of This Strategy

1.  **High-Precision P&L**: You can now see *exactly* how much profit is tied up in "Credit" vs. "Cash in Hand."
2.  **Auditor-Ready**: Every entry has a clear `Source` (Customer/Supplier) and `Destination` (Wallet/Lien/Expense).
3.  **No More "Ghost Money"**: By tracking Total Value + Credit Offsets, the wallet balance always matches the reality of your physical cash/bank totals.
4.  **Transparent COGS**: Stock consumption is finalized only when a device is "Confirmed," giving you a realistic Cost of Goods Sold metric.

---

## 🛠️ Technical Reference
*   **Primary Selector**: `src/features/wallet/selectors.ts` (`selectWalletBuckets`)
*   **Key Hook**: `src/hooks/useFinancialMetrics.ts`
*   **Key Files Updated**: `PhoneDetail.tsx`, `AddPhoneUpdate.tsx`, `CreateOrderSheet.tsx`, `SupplierAllocationSheet.tsx`.
*   **Sign Philosophy**:
    *   `+` = Total Liquidity/Benefit Increase.
    *   `-` = Total Liquidity/Benefit Decrease.
