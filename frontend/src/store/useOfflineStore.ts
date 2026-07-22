import { create } from 'zustand';
import dbHelper from '../lib/indexedDb';
import api from '../lib/api';
import { toast } from 'sonner';

export interface QueuedSaleItem {
  productId?: string;
  quantity: number;
  genericName?: string;
  genericPrice?: number;
}

export interface QueuedSale {
  tempId: string;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  customerId?: string;
  items: QueuedSaleItem[];
  createdAt?: string;
  status?: 'PENDING' | 'SYNCING' | 'ERROR';
  errorMessage?: string;
  attempts?: number;
}

interface OfflineState {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  isSyncing: boolean;
  syncQueueCount: number;
  syncErrorCount: number;
  queuedSales: QueuedSale[];
  fetchQueuedSales: () => Promise<void>;
  updateSyncQueueCount: () => Promise<void>;
  syncOfflineSales: () => Promise<void>;
  removeQueuedSale: (tempId: string) => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  syncQueueCount: 0,
  syncErrorCount: 0,
  queuedSales: [],

  setIsOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      get().syncOfflineSales();
    }
  },

  fetchQueuedSales: async () => {
    if (!dbHelper) return;
    try {
      const sales = await dbHelper.getQueuedSales<QueuedSale>();
      const errorCount = sales.filter((s) => s.status === 'ERROR').length;
      set({
        queuedSales: sales,
        syncQueueCount: sales.length,
        syncErrorCount: errorCount,
      });
    } catch (err) {
      console.error('Error fetching queued sales:', err);
    }
  },

  updateSyncQueueCount: async () => {
    await get().fetchQueuedSales();
  },

  removeQueuedSale: async (tempId: string) => {
    if (!dbHelper) return;
    try {
      await dbHelper.dequeueSale(tempId);
      await get().fetchQueuedSales();
      toast.success('Venta descartada de la cola offline.');
    } catch (err) {
      console.error(`Error dequeuing sale ${tempId}:`, err);
      toast.error('Error al descartar la venta.');
    }
  },

  syncOfflineSales: async () => {
    if (!dbHelper || get().isSyncing) return;
    try {
      const sales = await dbHelper.getQueuedSales<QueuedSale>();
      if (sales.length === 0) {
        set({ isSyncing: false, syncQueueCount: 0, syncErrorCount: 0, queuedSales: [] });
        return;
      }

      set({ isSyncing: true });
      toast.info(`Iniciando sincronización de ${sales.length} venta(s) guardadas sin conexión...`, { id: 'offline-sync' });

      let successCount = 0;
      let failCount = 0;

      for (const sale of sales) {
        try {
          // Marcar como en proceso
          const updatedSale: QueuedSale = {
            ...sale,
            status: 'SYNCING',
            attempts: (sale.attempts || 0) + 1,
          };
          await dbHelper.updateQueuedSale(updatedSale);

          const payload = {
            discount: sale.discount,
            paymentMethod: sale.paymentMethod,
            amountPaid: sale.amountPaid,
            customerId: sale.customerId,
            items: sale.items,
          };
          await api.post('/sales', payload);

          await dbHelper.dequeueSale(sale.tempId);
          successCount++;
        } catch (err: unknown) {
          failCount++;
          const errorObj = err as { response?: { data?: { message?: string | string[] } }; message?: string };
          const errorMsg = errorObj?.response?.data?.message || errorObj?.message || 'Error de conexión con el servidor';
          console.error(`Error al sincronizar venta offline ${sale.tempId}:`, err);

          // Actualizar estado a ERROR en IndexedDB sin bloquear la cola
          const failedSale: QueuedSale = {
            ...sale,
            status: 'ERROR',
            errorMessage: Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg),
            attempts: (sale.attempts || 0) + 1,
          };
          await dbHelper.updateQueuedSale(failedSale);
        }
      }

      await get().fetchQueuedSales();
      set({ isSyncing: false });

      if (successCount > 0 && failCount === 0) {
        toast.success(`¡Sincronizadas ${successCount} venta(s) correctamente!`, { id: 'offline-sync' });
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Sincronizadas ${successCount} venta(s). ${failCount} tuvieron error.`, { id: 'offline-sync' });
      } else if (failCount > 0) {
        toast.error(`No se pudieron sincronizar ${failCount} venta(s). Revisa la cola offline.`, { id: 'offline-sync' });
      }
    } catch (err) {
      console.error('Error general en syncOfflineSales:', err);
      set({ isSyncing: false });
    }
  },
}));
