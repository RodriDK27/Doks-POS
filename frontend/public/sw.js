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
  // Fotos de productos: caché aparte que sobrevive a cambios de versión de CACHE_NAME
  const IMAGES_CACHE = 'doks-pos-images-v1';
  const MAX_CACHED_IMAGES = 2000;

  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== IMAGES_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
    self.clients.claim();
  });

  async function serveProductImage(request) {
    const cache = await caches.open(IMAGES_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    // Solo respuestas CORS completas (<img crossOrigin="anonymous">); las opacas ocupan mucho espacio de cuota
    if (response.ok && response.type !== 'opaque') {
      await cache.put(request, response.clone());
      trimImagesCache(cache);
    }
    return response;
  }

  // Evita que el caché crezca sin límite con fotos reemplazadas: descarta las más antiguas
  async function trimImagesCache(cache) {
    const keys = await cache.keys();
    const excess = keys.length - MAX_CACHED_IMAGES;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  }

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Fotos de productos: Cache-First. Son inmutables (cada foto nueva cambia de nombre),
    // así la tablet las descarga una sola vez y se ven también sin internet.
    if (event.request.url.includes('/api/images/')) {
      event.respondWith(serveProductImage(event.request));
      return;
    }

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
