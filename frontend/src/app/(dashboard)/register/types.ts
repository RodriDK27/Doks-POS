export interface CashTransaction {
  id: string;
  amount: number;
  type: 'INGRESO' | 'EGRESO';
  description: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  openedBy: string;
  openedAt: string;
  closedAt: string | null;
  initialBalance: number;
  expectedBalance: number;
  actualBalance: number | null;
  status: 'ABIERTO' | 'CERRADO';
  notes: string | null;
  transactions: CashTransaction[];
}

export interface DailySupplierTemplateItem {
  id: string;
  templateId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    barcode?: string | null;
    purchasePrice: number;
    sellPrice: number;
    stock: number;
    unitType?: 'PIECE' | 'WEIGHT';
  };
  defaultQty: number;
  defaultCost?: number | null;
}

export interface DailySupplierTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  supplierId?: string | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  items: DailySupplierTemplateItem[];
}

