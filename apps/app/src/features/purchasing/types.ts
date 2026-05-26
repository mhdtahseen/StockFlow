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
  brand?: string;
  model?: string;
  storage?: string;
  color?: string;
  ram?: string;
  imei?: string;
  issueTags?: string[];
  // ── AddDevices phone-snapshot fields ─────────────────────────────
  // When present, the create_purchase_order RPC will atomically UPSERT
  // the phone row instead of expecting it to already exist in the DB.
  imeis?: string[];          // full IMEI list (multi-IMEI support)
  phoneStatus?: string;      // 'IN_STOCK' for AddDevices direct-ingest path
  itemStatus?: POItemStatus; // 'ACCEPTED' for AddDevices; absent for inspection path
  createdAt?: string;        // phone creation timestamp
  // ── GST (optional) ──────────────────────────────────────────────
  hsnCode?: string;
  gstRate?: number;
  taxableValue?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

export interface PurchaseOrder {
  id: string;
  counterpartyId: string;
  acquisitionChannel: AcquisitionChannel;
  linkedTransferId?: string; // UUID of originating SO on sender's side (INTER_TENANT only)
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
  paymentNote?: string;
  recordedBy?: string;
  createdAt: string;
  deletedAt?: string | null;
  items: PurchaseOrderItem[];
  // ── GST (optional) ──────────────────────────────────────────────
  gstEnabled?: boolean;
  gstInclusive?: boolean;       // true = price includes GST (default); false = pre-tax
  gstType?: "CGST_SGST" | "IGST";
  gstRate?: number;
  subtotal?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  sellerGstin?: string;  // supplier GSTIN for input tax credit
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

export interface OrderEditDiff {
  counterparty_id?:    { old: string; new: string };
  platform_fee?:       { old: number; new: number };
  notes?:              { old: string | null; new: string | null };
  due_date?:           { old: string | null; new: string | null };
  acquisition_channel?: { old: string; new: string };
  items_added?:        Array<{ brand: string; model: string; price: number }>;
  items_removed?:      Array<{ brand: string; model: string; price: number }>;
  items_changed?:      Array<{ brand: string; model: string; old_price: number; new_price: number }>;
}

export interface OrderEdit {
  id: string;
  orderId: string;
  orderType: 'PO' | 'SO';
  editedBy: string;
  editedByName?: string;
  diff: OrderEditDiff | Record<string, any>;
  createdAt: string;
}
