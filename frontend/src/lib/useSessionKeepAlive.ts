'use client';

import { useEffect } from 'react';
import axios from 'axios';
import api from './api';
import { useAuthStore } from '../store/useAuthStore';

/** El token dura 24 h; se renueva cuando ya pasaron ~4 h desde que se emitió */
const RENEW_WHEN_LEFT_MS = 20 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 10 * 60 * 1000;

/** Momento (ms) en que vence un JWT, leído de su payload; null si no se puede leer */
export function tokenExpiresAt(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function needsRenewal(token: string | null | undefined): boolean {
  const expiresAt = tokenExpiresAt(token);
  if (!expiresAt) return false;
  const left = expiresAt - Date.now();
  // Ya vencido: no se puede renovar, toca pedir el PIN otra vez
  return left > 0 && left < RENEW_WHEN_LEFT_MS;
}

// Con axios directo (no con `api`): el interceptor pondría el token de la sesión actual en lugar del que
// se renueva, y un 401 aquí no debe cerrar la sesión de golpe (la siguiente petición normal lo hará).
async function renew(token: string): Promise<string | null> {
  try {
    const res = await axios.post<{ token: string }>(`${api.defaults.baseURL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.token;
  } catch {
    return null;
  }
}

/**
 * Mantiene viva la sesión mientras la app esté abierta: revisa cada 10 min, al volver a la pestaña
 * y al recuperar internet. Sin esto, a las 24 h del PIN todas las peticiones fallan con 401 y la app
 * se queda como si la caja estuviera cerrada aunque siga abierta.
 */
export function useSessionKeepAlive() {
  useEffect(() => {
    let running = false;

    const check = async () => {
      if (running || !navigator.onLine) return;
      running = true;
      try {
        const { token, employeeSession } = useAuthStore.getState();
        if (needsRenewal(token)) {
          const fresh = await renew(token!);
          if (fresh) useAuthStore.getState().replaceToken(token!, fresh);
        }
        // La sesión del cajero guardada mientras se está en modo administrador también vence
        if (employeeSession && needsRenewal(employeeSession.token)) {
          const fresh = await renew(employeeSession.token!);
          if (fresh) useAuthStore.getState().replaceToken(employeeSession.token!, fresh);
        }
      } finally {
        running = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };

    void check();
    const interval = setInterval(() => void check(), CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);
}
