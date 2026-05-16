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
}

export interface SaleOrder {
  id: string;
  counterpartyId: string;
  orderType: OrderType;
  totalAmount: number;
  amountPaid: number;
  status: OrderStatus;
  paymentMode?: PayMode;
  dueDate?: string;
  notes?: string;
  paymentNote?: string;
  recordedBy?: string;
  createdAt: string;
  deletedAt?: string | null;
  items: OrderItem[];
}

export interface BillingState {
  orders: SaleOrder[];
}
