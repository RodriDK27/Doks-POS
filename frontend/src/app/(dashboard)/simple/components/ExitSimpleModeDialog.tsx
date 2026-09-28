'use client';

import React, { useState } from 'react';
import { Delete, Loader2, Lock } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { useAuthStore } from '@/store/useAuthStore';

interface ExitSimpleModeDialogProps {
  onClose: () => void;
  /** Se llama cuando un administrador confirmó su PIN */
  onUnlocked: () => void;
}

const PIN_LENGTH = 4;

/**
 * Salir del modo sencillo requiere el PIN de un administrador,
 * para que la pantalla no se cambie por accidente.
 */
export function ExitSimpleModeDialog({ onClose, onUnlocked }: ExitSimpleModeDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const verify = async (pinValue: string) => {
    setIsChecking(true);
    setError(null);
    try {
      // Axios directo (sin el cliente `api`): un PIN equivocado responde 401 y el interceptor
      // cerraría la sesión de la tablet, dejando a la abuela sin poder vender
      const res = await axios.post<{ role: string; token: string }>(`${api.defaults.baseURL}/auth/verify-pin`, { pin: pinValue });
      if (res.data.role !== 'ADMIN') {
        setError('Se necesita el PIN del administrador.');
        setPin('');
        return;
      }
      // Si la sesión había expirado, el administrador queda con sesión para seguir operando
      if (useAuthStore.getState().role === 'NONE') {
        useAuthStore.getState().setRole('ADMIN', res.data.token);
      }
      onUnlocked();
    } catch (err) {
      setError(parseAxiosError(err, 'PIN incorrecto.'));
      setPin('');
    } finally {
      setIsChecking(false);
    }
  };

  const press = (digit: string) => {
    if (isChecking || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) void verify(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-100">
      <div className="w-[min(92vw,420px)] rounded-3xl bg-white shadow-2xl p-6 flex flex-col gap-4 text-stone-900">
        <div className="flex items-center gap-3">
          <Lock className="h-7 w-7 text-stone-500" />
          <h2 className="text-2xl font-black">PIN de administrador</h2>
        </div>
        <p className="text-base font-semibold text-stone-500">Para salir de la pantalla sencilla.</p>

        <div className="flex justify-center gap-3 py-2">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full ${i < pin.length ? 'bg-stone-900' : 'bg-stone-200'}`}
            />
          ))}
        </div>

        {error && <p className="text-center text-base font-bold text-rose-600">{error}</p>}

        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="h-16 rounded-2xl bg-stone-100 active:bg-stone-200 text-2xl font-black cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="h-16 rounded-2xl bg-stone-100 active:bg-stone-200 text-base font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            className="h-16 rounded-2xl bg-stone-100 active:bg-stone-200 text-2xl font-black cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin((p) => p.slice(0, -1))}
            aria-label="Borrar"
            className="h-16 rounded-2xl bg-stone-100 active:bg-stone-200 flex items-center justify-center cursor-pointer"
          >
            {isChecking ? <Loader2 className="h-6 w-6 animate-spin" /> : <Delete className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
