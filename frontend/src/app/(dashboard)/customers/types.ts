export interface SaleItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: number;
  uuid: string;
  total: number;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  createdAt: string;
  items: SaleItem[];
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'DEUDA' | 'ABONO';
  notes: string | null;
  createdAt: string;
  sale?: Sale | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  currentDebt: number;
  createdAt: string;
  creditTransactions: CreditTransaction[];
}
