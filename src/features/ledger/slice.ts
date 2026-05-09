import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LedgerEntry, LedgerState } from "./types";
import {
  addPurchaseOrder,
  updatePOPayment,
  addSupplierSettlement,
  markPOItemRejected,
} from "../purchasing/slice";
import { addOrder, returnOrder } from "../billing/slice";
import { addCustomerSettlement, addCustomerPayment } from "../customers/slice";
import {
  addRepairLog,
  removeRepairLog,
  updatePhone,
  removePhone,
} from "../inventory/slice";

const initialState: LedgerState = {
  entries: [],
  pendingEntries: [],
};

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    setEntries: (state, action: PayloadAction<LedgerEntry[]>) => {
      state.entries = action.payload || [];
      // Remove pending entries whose order has now been confirmed in the official list.
      const officialPOIds = new Set(
        state.entries
          .filter((e) => e.purchaseOrderId || (e as any).purchase_order_id)
          .map((e) => e.purchaseOrderId || (e as any).purchase_order_id),
      );
      const officialSOIds = new Set(
        state.entries
          .filter((e) => e.saleOrderId || (e as any).sale_order_id)
          .map((e) => e.saleOrderId || (e as any).sale_order_id),
      );
      state.pendingEntries = (state.pendingEntries || []).filter((e) => {
        const poId = e.purchaseOrderId || (e as any).purchase_order_id;
        const soId = e.saleOrderId || (e as any).sale_order_id;
        if (poId && officialPOIds.has(poId)) return false;
        if (soId && officialSOIds.has(soId)) return false;
        return true;
      });
    },
    addEntry: (state, action: PayloadAction<LedgerEntry>) => {
      const entry = action.payload;
      const exists = state.entries.some((e) => e.id === entry.id);
      if (!exists) {
        state.entries.push(entry);

        // CLEANUP: If this is an order-linked payment, remove matching pending entries
        const poId = entry.purchaseOrderId || (entry as any).purchase_order_id;
        const soId = entry.saleOrderId || (entry as any).sale_order_id;
        if (poId || soId) {
          state.pendingEntries = (state.pendingEntries || []).filter(
            (pending) => {
              const pPoId =
                pending.purchaseOrderId || (pending as any).purchase_order_id;
              const pSoId =
                pending.saleOrderId || (pending as any).sale_order_id;

              // 1. Match by specific transition IDs
              if (poId && pending.id === `v-po-init-${poId}`) return false;
              if (soId && pending.id === `v-so-pay-${soId}`) return false;

              // 2. Semantic matching (Same Order + Same Amount + Proximity)
              // Audit Fix: Only prune if timestamps are within 30 mins to avoid collision with distinct payments
              const timeDiffMs = Math.abs(
                new Date(pending.createdAt).getTime() -
                  new Date(entry.createdAt).getTime(),
              );
              const isTimeMatch = timeDiffMs < 30 * 60 * 1000;

              if (
                poId &&
                pPoId === poId &&
                pending.amount === entry.amount &&
                isTimeMatch
              )
                return false;
              if (
                soId &&
                pSoId === soId &&
                pending.amount === entry.amount &&
                isTimeMatch
              )
                return false;

              return true;
            },
          );
        }
      } else {
        const idx = state.entries.findIndex((e) => e.id === entry.id);
        if (idx !== -1) state.entries[idx] = entry;
      }
    },
    removeEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload,
      );
    },
    addPendingEntry: (state, action: PayloadAction<LedgerEntry>) => {
      if (!state.pendingEntries) state.pendingEntries = [];
      state.pendingEntries.push(action.payload);
    },
    removePendingEntry: (state, action: PayloadAction<string>) => {
      state.pendingEntries = (state.pendingEntries || []).filter(
        (entry) =>
          entry.purchaseOrderId !== action.payload &&
          entry.saleOrderId !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // 1. WATCHTOWER: Purchase Orders (Creation & Initial Pay)
    builder.addCase(addPurchaseOrder, (state, action) => {
      const po = action.payload;
      if (po.amountPaid > 0) {
        state.pendingEntries.push({
          id: `v-po-init-${po.id}`,
          type: "SUPPLIER_PAYMENT",
          purchaseOrderId: po.id,
          referenceId: po.id, // Redundancy for UI filters
          amount: -po.amountPaid,
          paymentMode: po.paymentMode as any,
          note: `PURCHASE - #${po.id.slice(0, 8).toUpperCase()} : Initial Advance`,
          createdAt: new Date().toISOString(),
          recordedBy: po.recordedBy || "system",
        });
      }

      // AUDIT FIX: Log platform fee as a separate expense for clarity
      if (po.platformFee > 0) {
        state.pendingEntries.push({
          id: `v-po-fee-${po.id}`,
          type: "OPERATIONAL_EXPENSE",
          purchaseOrderId: po.id,
          referenceId: po.id,
          amount: -po.platformFee,
          paymentMode: po.paymentMode as any,
          note: `PLATFORM FEE - #${po.id.slice(0, 8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          recordedBy: po.recordedBy || "system",
        });
      }
    });

    // 1.1 WATCHTOWER: Purchase Order Mid-term Payment (Vendor Pay)
    builder.addCase(updatePOPayment, (state, action) => {
      const { id, amountPaid } = action.payload;
      state.pendingEntries.push({
        id: `v-po-pay-${id}-${Date.now()}`,
        type: "SUPPLIER_PAYMENT",
        purchaseOrderId: id,
        amount: -amountPaid, // Money going out
        note: `PURCHASE - #${id.slice(0, 8).toUpperCase()} : Mid-term Payment`,
        createdAt: new Date().toISOString(),
        recordedBy: "system",
      });
    });

    // 2. WATCHTOWER: Sale Orders (Sales & Initial Pay)
    builder.addCase(addOrder, (state, action) => {
      const so = action.payload;
      const now = new Date().toISOString();
      const ref = so.id.slice(0, 8).toUpperCase();

      if (so.amountPaid > 0) {
        state.pendingEntries.push({
          id: `v-so-pay-${so.id}`,
          type: "CUSTOMER_PAYMENT",
          saleOrderId: so.id,
          referenceId: so.id, // Redundancy for UI filters
          amount: so.amountPaid,
          paymentMode: so.paymentMode as any,
          note: `SALE - #${ref} : Cash/Digital Payment`,
          createdAt: now,
          recordedBy: so.recordedBy || "system",
        });
      }

      const remainingDebt = so.totalAmount - so.amountPaid;
      if (remainingDebt > 0) {
        state.pendingEntries.push({
          id: `v-so-debt-${so.id}`,
          type: "DEBT_PLEDGED",
          saleOrderId: so.id,
          referenceId: so.id,
          amount: 0,
          paymentMode: "CREDIT",
          note: `SALE - #${ref} : Balance Logged as Credit`,
          createdAt: now,
          recordedBy: so.recordedBy || "system",
        });
      }
    });

    // 2.1 WATCHTOWER: Direct Customer Payment to specific Order
    builder.addCase(addCustomerPayment, (state, action) => {
      const pay = action.payload;
      state.pendingEntries.push({
        id: `v-cust-pay-${pay.id}`,
        type: "CUSTOMER_PAYMENT",
        referenceId: pay.counterpartyId,
        amount: pay.totalReceived,
        paymentMode: pay.mode as any,
        note: `PAYMENT - Direct Payment received for specific order`,
        createdAt: new Date().toISOString(),
        recordedBy: pay.recordedBy || "system",
      });
    });

    // 3. WATCHTOWER: Customer Settlements (Excess & Overpayment Handling)
    builder.addCase(addCustomerSettlement, (state, action) => {
      const set = action.payload;
      const ref = set.id.slice(0, 8).toUpperCase();
      const allocationsTotal = set.allocations.reduce(
        (sum, al) => sum + al.amount,
        0,
      );
      const excess = set.amount - allocationsTotal;

      // A. The Primary Settlement (Clearing Debt)
      state.pendingEntries.push({
        id: `v-set-main-${set.id}`,
        type: "DEBT_SETTLEMENT",
        referenceId: set.counterpartyId,
        amount: allocationsTotal,
        paymentMode: set.mode as any,
        note: `SETTLEMENT - #${ref} : Bulk Payment for ${set.allocations.length} items (Orders: ${set.allocations.map((a) => a.orderId).join(", ")})`,
        createdAt: new Date().toISOString(),
        recordedBy: set.recordedBy || "system",
      });

      // B. The Excess (Advance Credit)
      if (excess > 0) {
        state.pendingEntries.push({
          id: `v-set-excess-${set.id}`,
          type: "ADVANCE_RECEIVED",
          referenceId: set.counterpartyId,
          amount: excess,
          paymentMode: set.mode as any,
          note: `ADVANCE - #${ref} : Excess Payment (Credit Holder)`,
          createdAt: new Date().toISOString(),
          recordedBy: set.recordedBy || "system",
        });
      }
    });

    // 3.1 WATCHTOWER: Supplier Settlements (Bulk Vendor Pay)
    builder.addCase(addSupplierSettlement, (state, action) => {
      const set = action.payload;
      state.pendingEntries.push({
        id: `v-sup-set-${set.id || Date.now()}`,
        type: "SUPPLIER_PAYMENT",
        referenceId: set.counterpartyId,
        amount: -set.amount,
        paymentMode: set.mode as any,
        note: `SUPPLIER - SETTLEMENT : Bulk payment to vendor`,
        createdAt: new Date().toISOString(),
        recordedBy: "system",
      });
    });

    // 4. SALE RETURN AUTOMATION
    builder.addCase(returnOrder, (state, action) => {
      const orderId = action.payload;
      state.pendingEntries.push({
        id: `v-so-return-${orderId}`,
        type: "CUSTOMER_PAYMENT",
        saleOrderId: orderId,
        referenceId: orderId,
        amount: 0, // Virtual shell; actual amount normally comes from thunk/backend
        note: `RETURN - SALE (#${orderId.slice(0, 8).toUpperCase()}) : Full Return (Refund Processing)`,
        createdAt: new Date().toISOString(),
        recordedBy: "system",
      });
    });

    // 5. PO REJECTION AUTOMATION (Refund Due)
    // When a unit is rejected during PO inspection, log a credit from the vendor
    builder.addCase(markPOItemRejected, (state, action) => {
      const { purchaseOrderId, phoneId } = action.payload;
      state.pendingEntries.push({
        id: `v-po-reject-${phoneId}`,
        type: "SUPPLIER_PAYMENT",
        purchaseOrderId,
        referenceId: purchaseOrderId,
        amount: 0, // Placeholder
        note: `REFUND DUE - VENDOR (#${purchaseOrderId.slice(0, 8).toUpperCase()}) : Item Rejected (#${phoneId.slice(0, 8).toUpperCase()})`,
        createdAt: new Date().toISOString(),
        recordedBy: "system",
      });
    });

    // 6. REPAIR AUTOMATION
    builder.addCase(addRepairLog, (state, action) => {
      const { phoneId, amount, note, recordedBy } = action.payload;
      state.pendingEntries.push({
        id: `v-repair-${phoneId}-${Date.now()}`,
        type: "REPAIR_COST",
        referenceId: phoneId,
        amount: -amount, // Negative for expense
        note: `REPAIR - #${phoneId.slice(0, 8).toUpperCase()} : ${note}`,
        createdAt: new Date().toISOString(),
        recordedBy: recordedBy || "system",
      });
    });

    // 7. INVENTORY ADJUSTMENT AUTOMATION (Asset Drift Management)
    builder.addCase(updatePhone, (state, action) => {
      const { id, phone, prevPrice } = action.payload;
      const newPrice = phone.purchasePrice;

      if (
        prevPrice !== undefined &&
        newPrice !== undefined &&
        newPrice !== prevPrice
      ) {
        const delta = newPrice - prevPrice;
        state.pendingEntries.push({
          id: `v-adj-${id}-${Date.now()}`,
          type: "INVENTORY_ADJUSTMENT",
          referenceId: id,
          amount: delta, // Positive if price increased, negative if decreased
          note: `ADJUSTMENT - #${id.slice(0, 8).toUpperCase()} : Price updated from ₹${prevPrice} to ₹${newPrice}`,
          createdAt: new Date().toISOString(),
          recordedBy: "system",
        });
      }
    });

    // 8. DELETION VOIDING
    builder.addCase(removePhone, (state, action) => {
      const phoneId = action.payload;
      // Mark all related entries as voided
      state.entries.forEach((e) => {
        if (
          e.referenceId === phoneId ||
          e.saleOrderId === phoneId ||
          e.purchaseOrderId === phoneId
        ) {
          e.isVoided = true;
        }
      });
    });
  },
});

export const {
  setEntries,
  addEntry,
  removeEntry,
  addPendingEntry,
  removePendingEntry,
} = ledgerSlice.actions;
export default ledgerSlice.reducer;
