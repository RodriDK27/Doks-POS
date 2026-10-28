import { useCallback, useState } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { SimpleSupplier, SupplierPaymentDraft } from '../components/SupplierPayment';

/** "Llegó el proveedor": el pago sale de la caja grande y el administrador captura los productos después */
export function useSupplierPayment(enabled: boolean) {
  const { data: suppliers } = useSWR<SimpleSupplier[]>(enabled ? '/suppliers/simple' : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Devuelve null si se guardó o el mensaje de error */
  const submitPayment = useCallback(async (draft: SupplierPaymentDraft): Promise<string | null> => {
    setIsSubmitting(true);
    try {
      try {
        await api.post('/purchases', {
          supplierId: draft.supplier.id,
          total: draft.amount,
          paymentSource: 'CAJA_GRANDE',
          needsDetail: true,
          settleTicketId: draft.ticketId,
          notes: 'Pagado en modo abuela',
        });
      } catch (error) {
        return parseAxiosError(error, 'No se pudo guardar el pago.');
      }

      void mutate('/suppliers/simple');
      void mutate('/purchases/pending-detail/count');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { suppliers, isSubmitting, submitPayment };
}
