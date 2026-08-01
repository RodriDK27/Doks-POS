export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  purchasePrice: number;
  sellPrice: number;
  wholesalePrice?: number | null;
  stock: number;
  minStock: number;
  unitType?: 'PIECE' | 'WEIGHT' | string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  orderDays?: string;
  deliveryDays?: string;
  visitFrequency?: 'WEEKLY' | 'BIWEEKLY_A' | 'BIWEEKLY_B' | string;
  expectedPayment?: number;
  isActive?: boolean;
  createdAt: string;
  _count?: {
    purchases: number;
  };
}

export interface PurchaseItem {
  id: string;
  productId: string;
  product: { name: string };
  costPrice: number;
  quantity: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: { name: string };
  total: number;
  notes: string | null;
  payFromRegister: boolean;
  cashRegisterId: string | null;
  createdAt: string;
  items: PurchaseItem[];
}
