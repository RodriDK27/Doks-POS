const CACHE_NAME = 'doks-pos-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/pos',
  '/register',
  '/inventory',
  '/customers',
  '/reports',
  '/tickets',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
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
  // Solo interceptar peticiones GET para assets y navegación
  if (event.request.method !== 'GET') return;

  // Ignorar peticiones de la API REST y archivos de desarrollo de Next.js/Turbopack (HMR)
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('/_next/') || 
    event.request.url.includes('hot-update')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // Si falla la red y es navegación, devolver el fallback de inicio
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
