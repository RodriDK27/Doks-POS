'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Solo registrar el Service Worker en producción para evitar interferir con HMR y Turbopack en desarrollo
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('ServiceWorker registrado con éxito: ', registration.scope);
            })
            .catch((err) => {
              console.error('Error al registrar ServiceWorker: ', err);
            });
        });
      } else {
        // Desregistrar activamente cualquier Service Worker residual en desarrollo
        // para evitar que intercepte y sirva HTML con hashes de scripts obsoletos
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('ServiceWorker residual desregistrado en desarrollo.');
                // Limpiar caché de Service Worker
                caches.keys().then((keys) => {
                  keys.forEach((key) => caches.delete(key));
                });
                // Recargar página una única vez para limpiar el control
                window.location.reload();
              }
            });
          }
        });
      }
    }
  }, []);

  return null;
}
