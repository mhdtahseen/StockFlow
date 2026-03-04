export type LedgerEntryType =
  | "MONEY_ADDED"
  | "FUNDS_PLEDGED"
  | "FUNDS_RELEASED"
  | "FUNDS_CONSUMED"
  | "PHONE_SALE"
  | "REPAIR_COST"
  | "WITHDRAWAL"
  | "PROFIT_WITHDRAWAL";

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  referenceId?: string;
  amount: number; // positive for income, negative for expense
  note?: string; // optional human-readable description (e.g. "Screen replacement")
  createdAt: string;
}

export interface LedgerState {
  entries: LedgerEntry[];
}
