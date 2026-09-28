import { useCallback, useState } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { RECEIPT_MAX_SIDE, uploadImage } from '@/lib/productImages';
import { SimpleSupplier, SupplierPaymentDraft } from '../components/SupplierPayment';

export interface SupplierPaymentResult {
  /** Mensaje si el pago no se guardó */
  error: string | null;
  /** El pago sí se guardó pero la foto de la nota no se subió */
  photoFailed: boolean;
}

/** "Llegó el proveedor": el pago sale de la caja grande y el administrador captura los productos después */
export function useSupplierPayment(enabled: boolean) {
  const { data: suppliers } = useSWR<SimpleSupplier[]>(enabled ? '/suppliers/simple' : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPayment = useCallback(async (draft: SupplierPaymentDraft): Promise<SupplierPaymentResult> => {
    setIsSubmitting(true);
    try {
      let purchaseId: string;
      try {
        const res = await api.post<{ id: string }>('/purchases', {
          supplierId: draft.supplier.id,
          total: draft.amount,
          paymentSource: 'CAJA_GRANDE',
          needsDetail: true,
          settleTicketId: draft.ticketId,
          notes: 'Pagado en modo abuela',
        });
        purchaseId = res.data.id;
      } catch (error) {
        return { error: parseAxiosError(error, 'No se pudo guardar el pago.'), photoFailed: false };
      }

      let photoFailed = false;
      if (draft.photo) {
        try {
          await uploadImage(`/purchases/${purchaseId}/receipt`, draft.photo, RECEIPT_MAX_SIDE);
        } catch {
          photoFailed = true;
        }
      }

      void mutate('/suppliers/simple');
      void mutate('/purchases/pending-detail/count');
      return { error: null, photoFailed };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { suppliers, isSubmitting, submitPayment };
}
