export type LedgerEntryType =
  | "MONEY_ADDED"
  | "FUNDS_PLEDGED"
  | "FUNDS_RELEASED"
  | "FUNDS_CONSUMED"
  | "PHONE_SALE"
  | "REPAIR_COST"
  | "WITHDRAWAL"
  | "PROFIT_WITHDRAWAL";

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
  createdAt: string;
}

export interface LedgerState {
  entries: LedgerEntry[];
}
