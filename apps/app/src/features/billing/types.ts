export type OrderType = "RETAIL" | "BULK" | "TRANSFER";
export type OrderStatus = "OPEN" | "PARTIAL" | "SETTLED" | "RETURNED";
export type PayMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT";

export interface OrderItem {
  id: string;
  saleOrderId: string;
  phoneId: string | null;
  salePrice: number;
  discountAmount: number;
  effectivePrice: number; // salePrice - discountAmount
  imeiSnapshot: string[];
  brandSnapshot: string;
  modelSnapshot: string;
  storageSnapshot: string;
  colorSnapshot: string;
  // ── GST (optional) ──────────────────────────────────────────────
  hsnCode?: string;
  gstRate?: number;
  taxableValue?: number;  // effectivePrice / (1 + rate/100) when inclusive
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

export type TransferStatus = "PENDING" | "ACCEPTED" | "PARTIAL" | "REJECTED";

export interface SaleOrder {
  id: string;
  counterpartyId: string;
  orderType: OrderType;
  totalAmount: number;
  amountPaid: number;
  status: OrderStatus;
  transferStatus?: TransferStatus;
  linkedTransferId?: string; // UUID of mirror PO on receiver's side
  paymentMode?: PayMode;
  dueDate?: string;
  notes?: string;
  paymentNote?: string;
  recordedBy?: string;
  createdAt: string;
  deletedAt?: string | null;
  items: OrderItem[];
  // ── GST (optional — populated when gstEnabled is true) ──────────
  gstEnabled?: boolean;
  gstType?: "CGST_SGST" | "IGST";  // intra-state vs inter-state
  gstRate?: number;                // e.g. 18
  subtotal?: number;               // taxable value (pre-tax sum)
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  buyerGstin?: string;             // customer GSTIN for B2B invoices
}

export interface BillingState {
  orders: SaleOrder[];
}
