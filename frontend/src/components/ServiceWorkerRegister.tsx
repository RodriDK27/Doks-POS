'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Solo registrar el Service Worker en producción para evitar interferir con HMR y Turbopack en desarrollo
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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
    }
  }, []);

  return null;
}
