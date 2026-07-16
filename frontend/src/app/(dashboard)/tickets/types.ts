export interface SaleItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: number;
  total: number;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  cashRegisterId: string;
  createdAt: string;
  customer: { name: string } | null;
  items: SaleItem[];
}
