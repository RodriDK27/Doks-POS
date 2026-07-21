'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Delete, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseAxiosError } from '@/lib/errorMapper';

import { useRouter } from 'next/navigation';

export default function GlobalLockScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPinSubmit = useCallback(async (pinValue: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-pin', { pin: pinValue });
      const { role, token } = response.data;

      setRole(role, token);
      toast.success(`Bienvenido al sistema. Rol: ${role}`);

      if (role === 'ADMIN') {
        router.replace('/');
      } else if (role === 'CAJERO') {
        router.replace('/pos');
      }
    } catch (error) {
      toast.error(parseAxiosError(error, 'PIN de acceso incorrecto.'));
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [setRole, router]);

  useEffect(() => {
    if (pin.length === 4) {
      Promise.resolve().then(() => {
        verifyPinSubmit(pin);
      });
    }
  }, [pin, verifyPinSubmit]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] text-center space-y-8 animate-in fade-in zoom-in duration-300">
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl animate-bounce">
            <Store className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{"Dok's POS"}</h1>
            <p className="text-xs text-slate-400 font-medium px-4">
              Introduce tu PIN personal de acceso para ingresar al sistema
            </p>
          </div>
        </div>

        {/* VISUALIZADOR DE PUNTOS PIN */}
        <div className="flex justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-4.5 w-4.5 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm'
                  : 'border-slate-200 bg-slate-50'
              }`}
            />
          ))}
        </div>

        {/* TECLADO NUMÉRICO TÁCTIL */}
        <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              disabled={loading}
              className="h-14 rounded-2xl font-black text-lg text-slate-700 hover:bg-slate-55 border-slate-100 hover:border-slate-200 active:scale-95 transition-all shadow-sm"
              onClick={() => handleKeyPress(num)}
            >
              {num}
            </Button>
          ))}

          <Button
            type="button"
            variant="ghost"
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl font-extrabold text-[10px] text-slate-400 hover:bg-slate-50"
            onClick={handleClear}
          >
            Limpiar
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-14 rounded-2xl font-black text-lg text-slate-700 hover:bg-slate-55 border-slate-100 hover:border-slate-200 active:scale-95 transition-all shadow-sm"
            onClick={() => handleKeyPress('0')}
          >
            0
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 flex items-center justify-center"
            onClick={handleBackspace}
          >
            <Delete className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
