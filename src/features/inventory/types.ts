export type PhoneStatus = "PENDING" | "IN_STOCK" | "SOLD";

export interface Phone {
  id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  purchasePrice: number;
  salePrice?: number;
  status: PhoneStatus;
  issueTags: string[];
  createdAt: string;
}

export interface InventoryState {
  phones: Phone[];
}
