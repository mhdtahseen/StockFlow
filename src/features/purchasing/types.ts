export type PurchaseOrderStatus =
  | "AWAITING_RECEIPT"
  | "RECEIVED"
  | "PARTIAL"
  | "SETTLED"
  | "CANCELLED";
export type AcquisitionChannel = "DIRECT" | "PLATFORM" | "INTER_TENANT";
export type PayMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT" | "SPLIT";
export type POItemStatus = "PENDING_INSPECTION" | "ACCEPTED" | "REJECTED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  phoneId: string | null;
  purchasePrice: number;
  status: POItemStatus;
  rejectionReason?: string;
}

export interface PurchaseOrder {
  id: string;
  counterpartyId: string;
  acquisitionChannel: AcquisitionChannel;
  platformName?: string;
  platformFee: number;
  phonesOrdered: number;
  phonesReceived: number;
  totalAmount: number;
  amountPaid: number;
  status: PurchaseOrderStatus;
  paymentMode?: PayMode;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface POAllocation {
  purchaseOrderId: string;
  amountAllocated: number;
  note?: string;
}

export interface SupplierPayment {
  id: string;
  counterpartyId: string;
  totalPaid: number;
  mode: "CASH" | "UPI" | "BANK_TRANSFER" | "SPLIT";
  paidAt: string;
  note?: string;
  recordedBy: string;
  allocations: POAllocation[];
}

export interface PurchasingState {
  orders: PurchaseOrder[];
  payments: SupplierPayment[];
}
