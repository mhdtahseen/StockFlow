# Phase 2: Financial Integrity & Debt Recovery - Implementation Plan

## Goal
Fix financial "leaks" using the **Watchtower** method to ensure every money movement is automatically recorded, while standardizing entry descriptions for better clarity—**without changing the existing Ledger UI.**

## Proposed Changes

### 1. The Watchtower Pattern [ledger/slice.ts](file:///Users/taaha/Desktop/Projects/Products/StockFlow/src/features/ledger/slice.ts)
Instead of manual logging on every screen, I will centralize financial recording in the Ledger slice.
- **Action**: Update `ledgerSlice.extraReducers` to automatically catch:
    - `billing/addOrder`: Log the Sale and the resulting Customer Debt.
    - `customers/addCustomerSettlement`: Log the Bulk Payment and Cash Receipt.
    - `billing/returnOrder`: Log the reversal/refund events.
- **Action**: **Semantic Note Standard**: Ensure these automatic entries carry a structured note: `[CATEGORY] - [ENTITY] (#ID) : [INFO]`.

### 2. Mandatory Metadata Audit
- **Action**: Verify that `recordedBy` (User ID) is passed to every ledger action. 
- **Action**: Fix instances like `PhoneDetail.tsx` where the `note` field was being left blank, ensuring it now says `[PURCHASE] - Confirmed Stock`.

### 3. P&L & Debt Logic (Background)
- **Action**: Implement `selectTrueProfit` and `selectCustomerBalance` selectors.
- **Benefit**: This keeps your "Today's Profit" and Customer balances accurate to the paisa, even if the UI remains exactly as it is now.

### 4. Money Recovery Logic
- **Action**: Implement **FIFO (First-In-First-Out) Auto-Settlement** in the logic layer. When a customer pays, it will automatically count against their oldest debt, keeping the backend data clean for future reporting.

## Verification Plan

### Automated Tests
- **Integrity Test**: Simulate a Sale and a Settlement; verify the Ledger automatically contains two entries with matching IDs.
- **Metadata Check**: Ensure zero entries are created with a blank `note` or `recordedBy`.

### Manual Verification
- **Audit View**: Check the existing Ledger UI to confirm that the new, structured notes are appearing correctly and explain exactly "Who, What, How" without needing extra UI components.
