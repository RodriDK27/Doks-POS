export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  sellPrice: number;
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
