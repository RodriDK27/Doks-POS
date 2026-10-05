/** Valor centinela de `selectedCategory` para productos sin categoría asignada. */
export const UNCATEGORIZED = '__NONE__';

export interface ProductBarcode {
  id: string;
  barcode: string;
  label?: string | null;
  productId?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  barcode: string | null;
  barcodes?: ProductBarcode[];
  name: string;
  purchasePrice: number;
  sellPrice: number;
  wholesalePrice?: number | null;
  stock: number;
  minStock: number;
  unitType?: 'PIECE' | 'WEIGHT' | string;
  category: string | null;
  family?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  /** Imagen que ve el modo abuela en el cuadro de la categoría */
  imageUrl?: string | null;
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
  /** Logo que ve el modo abuela en "Llegó el proveedor" */
  logoUrl?: string | null;
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
