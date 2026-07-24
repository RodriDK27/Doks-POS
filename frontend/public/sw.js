// Service Worker para DOK'S POS
// Auto-desactivación en desarrollo (localhost) para evitar conflictos con HMR y Turbopack de Next.js

if (
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.port === '3000'
) {
  // En desarrollo: Autodestruir el Service Worker y limpiar cachés de inmediato
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => {
          return Promise.all(keys.map((key) => caches.delete(key)));
        })
        .then(() => {
          return self.registration.unregister();
        })
        .then(() => {
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.navigate(client.url);
          });
        })
    );
  });
} else {
  // EN PRODUCCIÓN: Configuración de caché Network-First con fallback Offline
  const CACHE_NAME = 'doks-pos-cache-v2';

  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignorar APIs y peticiones dinámicas de Next.js
    if (
      event.request.url.includes('/api/') ||
      event.request.url.includes('/_next/') ||
      event.request.url.includes('hot-update')
    ) {
      return;
    }

    // Estrategia Network-First: intenta cargar de la red para estar al día, y guarda en caché para soporte offline
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red (offline), servir del caché local
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (event.request.mode === 'navigate') {
              return caches.match('/register') || caches.match('/');
            }
          });
        })
    );
  });
}
