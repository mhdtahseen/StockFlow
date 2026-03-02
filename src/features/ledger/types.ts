export type LedgerEntryType =
  | "MONEY_ADDED"
  | "FUNDS_PLEDGED"
  | "FUNDS_RELEASED"
  | "FUNDS_CONSUMED"
  | "PHONE_SALE"
  | "WITHDRAWAL"
  | "PROFIT_WITHDRAWAL";

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  referenceId?: string;
  amount: number; // positive for income, negative for expense
  createdAt: string;
}

export interface LedgerState {
  entries: LedgerEntry[];
}
