export type PhoneStatus = "PENDING" | "IN_STOCK" | "SOLD";

export interface Phone {
  id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  imeis?: string[];
  purchasePrice: number;
  salePrice?: number;
  status: PhoneStatus;
  issueTags: string[];
  createdAt: string;
  purchaseOrderId?: string; // FK to purchase order that brought this phone in
  saleOrderId?: string; // FK to trade order that sold this phone
}

export interface InventoryState {
  phones: Phone[];
}
