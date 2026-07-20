export interface RequestedProduct {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  status: 'PENDIENTE' | 'COMPRADO' | 'CANCELADO';
  createdAt: string;
  updatedAt: string;
}
