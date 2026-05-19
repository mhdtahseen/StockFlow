export type LedgerEntryType =
  | "MONEY_ADDED"
  | "CAPITAL_INJECTION"
  | "CUSTOMER_PAYMENT"
  | "SUPPLIER_PAYMENT"
  | "PHONE_SALE"
  | "REPAIR_COST"
  | "WITHDRAWAL"
  | "PROFIT_WITHDRAWAL"
  | "INVENTORY_ADJUSTMENT"
  | "DEBT_PLEDGED"
  | "DEBT_SETTLEMENT"
  | "ADVANCE_RECEIVED"
  | "ADVANCE_SUPPLIER"
  | "OPERATIONAL_EXPENSE";

// Mirrors the DB CHECK constraint on ledger.payment_mode
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT";

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  referenceId?: string;
  amount: number; // positive for income, negative for expense
  paymentMode?: PaymentMode; // which channel the money moved through
  note?: string; // optional human-readable description (e.g. "Screen replacement")
  customerPaymentId?: string; // Link to FIFO settlement master record
  supplierPaymentId?: string; // Link to supplier FIFO settlement record
  saleOrderId?: string; // Link to sales order
  purchaseOrderId?: string; // Link to purchase order
  settlementCount?: number; // Count of orders involved in this payment
  recordedBy?: string; // User ID of the person who recorded this entry
  createdAt: string;
  isVoided?: boolean;
}

export interface LedgerState {
  entries: LedgerEntry[];
  pendingEntries: LedgerEntry[];
}
