import { useCallback } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { Product } from '../types';

export const FAVORITES_KEY_PREFIX = '/products/favorites';

const setInCatalog = (id: string, isFavorite: boolean) =>
  mutate<Product[]>('/products', (list) => list?.map((p) => (p.id === id ? { ...p, isFavorite } : p)), { revalidate: false });

/** Marca o quita el corazón al instante; si el servidor falla, se regresa como estaba */
export function useFavoriteToggle() {
  return useCallback(async (product: Product) => {
    const next = !product.isFavorite;
    void setInCatalog(product.id, next);
    try {
      await api.patch(`/products/${product.id}/favorite`, { isFavorite: next });
      void mutate((key) => typeof key === 'string' && key.startsWith(FAVORITES_KEY_PREFIX));
    } catch (error) {
      void setInCatalog(product.id, !next);
      toast.error(parseAxiosError(error, 'No se pudo actualizar el favorito.'));
    }
  }, []);
}
