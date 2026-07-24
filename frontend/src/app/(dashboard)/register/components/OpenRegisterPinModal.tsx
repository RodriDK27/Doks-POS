'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { parseAxiosError } from '@/lib/errorMapper';
import { useAuthStore } from '@/store/useAuthStore';

interface OpenRegisterPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  onPinVerified: () => void;
}

export function OpenRegisterPinModal({ isOpen, onClose, employeeName, onPinVerified }: OpenRegisterPinModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setPin('');
        setError(null);
      });
    }
  }, [isOpen]);

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((prev) => prev + val);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verifyRes = await api.post('/auth/verify-pin', { pin });
      
      // Si el modal requiere verificar a un empleado específico (apertura de caja), validar que coincida el nombre
      if (employeeName && verifyRes.data?.name) {
        const expectedName = employeeName.trim().toLowerCase();
        const actualName = verifyRes.data.name.trim().toLowerCase();
        
        if (expectedName !== actualName && verifyRes.data.role !== 'ADMIN') {
          setError('PIN incorrecto o no pertenece a este usuario.');
          setLoading(false);
          return;
        }
      }

      if (verifyRes.data?.role && verifyRes.data?.token) {
        useAuthStore.getState().setRole(verifyRes.data.role, verifyRes.data.token);
      }

      // Si el rol es empleado (GERENTE o CAJERO), registrar entrada en el reloj checador
      if (verifyRes.data?.role !== 'ADMIN') {
        try {
          await api.post('/attendance/clock-in', { pin, notes: 'Entrada automática al abrir turno de caja chica' });
        } catch {
          // Si ya tenía entrada abierta previa o falló la marcación secundaria, continuar sin interrumpir la apertura
        }
      }

      onPinVerified();
      onClose();
    } catch (err: unknown) {
      setError(parseAxiosError(err, 'PIN incorrecto o invalido.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100">
            Confirmar PIN de Acceso
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Ingresa tu PIN de 4 dígitos para abrir turno como <strong className="text-indigo-600 dark:text-indigo-400">{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200/60">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DISPLAY PIN */}
          <div className="flex justify-center my-2">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                    pin.length > idx
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  {pin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* TECLADO NUMÉRICO TÁCTIL */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((val) => (
              <Button
                key={val}
                type="button"
                variant="outline"
                className={`h-11 font-black text-sm rounded-xl cursor-pointer active:scale-95 transition-all ${
                  val === 'CLEAR'
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/20 text-xs'
                    : val === 'BACK'
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/20 text-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                }`}
                onClick={() => handleKeypadPress(val)}
              >
                {val === 'CLEAR' ? 'C' : val === 'BACK' ? '⌫' : val}
              </Button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl cursor-pointer active:scale-95 transition-all"
          >
            {loading ? 'Validando PIN...' : 'Confirmar e Iniciar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
