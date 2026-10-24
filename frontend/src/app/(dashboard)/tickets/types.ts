export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'FIADO';

export interface SaleItem {
  id: string;
  productId: string | null;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  /** Cantidad que el cliente ya regresó (devolución o cambio) */
  returnedQuantity: number;
}

export interface SaleReturn {
  id: string;
  amount: number;
  refundMethod: string;
  restocked: boolean;
  reason: string | null;
  replacementSaleId: number | null;
  items: { saleItemId: string; productName: string; quantity: number; amount: number }[];
  createdAt: string;
}

export interface Sale {
  id: number;
  total: number;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  /** Dinero ya devuelto al cliente por devoluciones/cambios */
  refundedAmount: number;
  cashRegisterId: string;
  createdAt: string;
  customer: { id: string; name: string } | null;
  items: SaleItem[];
  returns: SaleReturn[];
}

export interface SaleReturnResult {
  refund: number;
  replacementTotal: number;
  replacementSaleId: number | null;
  /** Positivo: el cliente paga la diferencia. Negativo: se le devuelve dinero */
  difference: number;
}
