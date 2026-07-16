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
