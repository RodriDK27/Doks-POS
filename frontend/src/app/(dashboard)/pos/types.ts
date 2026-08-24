export interface ProductBarcode {
  id?: string;
  barcode: string;
  label?: string | null;
}

export interface Product {
  id: string;
  barcode: string | null;
  barcodes?: ProductBarcode[];
  name: string;
  sellPrice: number;
  costPrice?: number;
  stock: number;
  category: string | null;
  unitType?: 'PIECE' | 'WEIGHT' | string;
}

export interface Customer {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
}
