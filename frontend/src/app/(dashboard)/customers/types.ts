export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'DEUDA' | 'ABONO';
  notes: string | null;
  createdAt: string;
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
