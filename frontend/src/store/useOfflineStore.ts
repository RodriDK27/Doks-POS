import { create } from 'zustand';
import dbHelper from '../lib/indexedDb';
import api from '../lib/api';
import { toast } from 'sonner';

interface QueuedSale {
  tempId: string;
  discount: number;
  paymentMethod: string;
  amountPaid: number;
  customerId?: string;
  items: Array<{
    productId?: string;
    quantity: number;
    genericName?: string;
    genericPrice?: number;
  }>;
  createdAt?: string;
}

interface OfflineState {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncQueueCount: number;
  updateSyncQueueCount: () => Promise<void>;
  syncOfflineSales: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      get().syncOfflineSales();
    }
  },
  syncQueueCount: 0,
  updateSyncQueueCount: async () => {
    if (!dbHelper) return;
    try {
      const sales = await dbHelper.getQueuedSales<QueuedSale>();
      set({ syncQueueCount: sales.length });
    } catch (err) {
      console.error('Error updating sync queue count:', err);
    }
  },
  syncOfflineSales: async () => {
    if (!dbHelper) return;
    try {
      const sales = await dbHelper.getQueuedSales<QueuedSale>();
      if (sales.length === 0) return;

      toast.info(`Sincronizando ${sales.length} venta(s) guardadas sin conexión...`);

      for (const sale of sales) {
        try {
          const { tempId, ...saleData } = sale;
          await api.post('/sales', saleData);
          await dbHelper.dequeueSale(tempId);
        } catch (err) {
          console.error(`Error al sincronizar venta offline ${sale.tempId}:`, err);
        }
      }

      await get().updateSyncQueueCount();
      toast.success('Sincronización de ventas completada.');
    } catch (err) {
      console.error('Error in syncOfflineSales:', err);
    }
  },
}));
