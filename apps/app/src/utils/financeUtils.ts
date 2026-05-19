import { format, parseISO } from "date-fns";

export type FinanceTransactionType = 
  | "ADVANCE" 
  | "MID_PAYMENT" 
  | "SUPPLIER_PAYMENT" 
  | "REPAIR" 
  | "SETTLEMENT"
  | "CAPITAL_TOPUP"
  | "WITHDRAWAL"
  | "PROFIT_TAKE"
  | "STOCK_SALE"
  | "OPERATIONAL_EXPENSE";

export interface StructuredTransaction {
  type: FinanceTransactionType;
  label: string;
  ref: string;
  mode: string;
  timestamp: string;
  amount: number;
  fullDisplay: string;
  color: string;
}

export const mapLedgerType = (rawType: string, isAdvance: boolean = false): FinanceTransactionType => {
  if (isAdvance) return "ADVANCE";
  
  switch (rawType) {
    case "CAPITAL_INJECTION": return "CAPITAL_TOPUP";
    case "CUSTOMER_PAYMENT": return "SETTLEMENT";
    case "SUPPLIER_PAYMENT": return "SUPPLIER_PAYMENT";
    case "WITHDRAWAL": return "WITHDRAWAL";
    case "PROFIT_WITHDRAWAL": return "PROFIT_TAKE";
    case "REPAIR_COST": return "REPAIR";
    case "PHONE_SALE": return "STOCK_SALE";
    case "OPERATIONAL_EXPENSE": return "OPERATIONAL_EXPENSE";
    default: return "SETTLEMENT";
  }
};

export const getTransactionLabel = (type: FinanceTransactionType): string => {
  switch (type) {
    case "ADVANCE": return "Advance Payment";
    case "MID_PAYMENT": return "Mid Payment";
    case "SUPPLIER_PAYMENT": return "Supplier Payment";
    case "REPAIR": return "Repair Payout";
    case "SETTLEMENT": return "Bill Settlement";
    case "CAPITAL_TOPUP": return "Owner Injection";
    case "WITHDRAWAL": return "Owner Takeout";
    case "PROFIT_TAKE": return "Profit Takeout";
    case "STOCK_SALE": return "Stock Sale";
    case "OPERATIONAL_EXPENSE": return "Op. Expense";
    default: return type;
  }
};

export const formatTransactionRef = (orderId?: string, paymentId?: string): string => {
  if (orderId) return `#${orderId.slice(0, 8).toUpperCase()}`;
  if (paymentId) return `PAY#${paymentId.slice(0, 6).toUpperCase()}`;
  return "GENERAL";
};

export interface ParsedNote {
  type: string;
  ref: string;
  mode: string;
  time: string;
  amount: string;
}

export const structuredNoteRegex = /^\[(.*?)\] \[(.*?)\] \[(.*?)\]\[(.*?)\] \[(.*?)\]$/;

export const parseStructuredNote = (note: string): ParsedNote | null => {
  if (!note) return null;
  const match = note.match(structuredNoteRegex);
  if (!match) return null;

  return {
    type: match[1],
    ref: match[2],
    mode: match[3],
    time: match[4],
    amount: match[5],
  };
};

export const getTransactionColor = (type: FinanceTransactionType): string => {
  switch (type) {
    case "CAPITAL_TOPUP":
      return "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400";
    case "SETTLEMENT":
    case "STOCK_SALE":
    case "ADVANCE":
    case "MID_PAYMENT":
      return "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400";
    case "SUPPLIER_PAYMENT":
    case "WITHDRAWAL":
    case "OPERATIONAL_EXPENSE":
      return "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400";
    case "REPAIR":
      return "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400";
    case "PROFIT_TAKE":
      return "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
  }
};
