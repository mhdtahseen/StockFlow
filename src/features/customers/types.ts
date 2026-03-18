export type CustomerType = "CUSTOMER" | "RETAILER" | "WHOLESALER" | "PLATFORM";
export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  platformName?: string;
  linkedTenantId?: string;
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
