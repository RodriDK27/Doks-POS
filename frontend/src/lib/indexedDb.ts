class IndexedDBHelper {
  private dbName = 'doks_pos_offline_db';
  private dbVersion = 1;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result;
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sales_queue')) {
          db.createObjectStore('sales_queue', { keyPath: 'tempId' });
        }
      };
    });
  }

  // --- Caché del catálogo de productos ---
  async saveProducts<T>(products: T[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('products', 'readwrite');
      const store = transaction.objectStore('products');
      
      store.clear();
      products.forEach((product) => {
        store.put(product);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProducts<T>(): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('products', 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Cola de ventas offline ---
  async queueSale<T extends Record<string, unknown>>(sale: T): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sales_queue', 'readwrite');
      const store = transaction.objectStore('sales_queue');
      store.put({
        ...sale,
        tempId: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getQueuedSales<T>(): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sales_queue', 'readonly');
      const store = transaction.objectStore('sales_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async dequeueSale(tempId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sales_queue', 'readwrite');
      const store = transaction.objectStore('sales_queue');
      store.delete(tempId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async updateQueuedSale<T extends { tempId: string }>(sale: T): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sales_queue', 'readwrite');
      const store = transaction.objectStore('sales_queue');
      store.put(sale);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbHelper = typeof window !== 'undefined' ? new IndexedDBHelper() : null;
export default dbHelper;
