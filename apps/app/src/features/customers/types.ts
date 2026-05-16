export type CustomerType = "CUSTOMER" | "RETAILER" | "WHOLESALER" | "PLATFORM";
export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  aadhaarEncrypted?: string; // AES-GCM encrypted full Aadhaar (Web Crypto), base64-encoded
  aadhaarLast4?: string;     // Last 4 digits only — safe to display without decryption
  address?: string;
  platformName?: string;
  linkedTenantId?: string;
  linkedTenantName?: string; // denormalised display name of the linked StockFlow business
  notes?: string;
  createdAt: string;
}
export interface CustomerPayment {
  id: string;
  counterpartyId: string;
  totalReceived: number;
  mode: "CASH" | "UPI" | "BANK_TRANSFER";
  receivedAt: string;
  note?: string;
  recordedBy: string;
  allocations: {
    saleOrderId: string;
    amountAllocated: number;
    note?: string;
  }[];
}
export interface CustomersState {
  customers: Customer[];
  payments: CustomerPayment[];
}
