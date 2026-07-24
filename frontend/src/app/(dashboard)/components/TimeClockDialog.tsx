'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

interface TimeClockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onClockSuccess?: (data: { user: { id: string; name: string }; hoursWorked?: number }) => void;
  defaultMode?: 'IN' | 'OUT';
}

export function TimeClockDialog({ isOpen, onClose, onSuccess, onClockSuccess, defaultMode = 'IN' }: TimeClockDialogProps) {
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'IN' | 'OUT'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setPin('');
        setError(null);
        setSuccessMsg(null);
        setMode(defaultMode);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultMode]);

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('Por favor ingresa tu PIN de empleado.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const endpoint = mode === 'IN' ? `${apiBase}/attendance/clock-in` : `${apiBase}/attendance/clock-out`;

    try {
      const res = await axios.post(endpoint, { pin, notes });
      const user = res.data?.user;

      // Autenticar la sesión en Zustand utilizando la respuesta o verify-pin
      try {
        const verifyRes = await axios.post(`${apiBase}/auth/verify-pin`, { pin });
        if (verifyRes.data?.role === 'ADMIN') {
          setError('El rol Administrador no registra asistencia en el reloj checador.');
          setLoading(false);
          return;
        }
        if (verifyRes.data?.role && verifyRes.data?.token) {
          useAuthStore.getState().setRole(verifyRes.data.role, verifyRes.data.token);
        }
      } catch {
        if (user?.role === 'ADMIN') {
          setError('El rol Administrador no registra asistencia en el reloj checador.');
          setLoading(false);
          return;
        }
        if (user?.role) {
          useAuthStore.getState().setRole(user.role, null);
        }
      }

      setSuccessMsg(
        mode === 'IN'
          ? `¡Entrada registrada para ${user?.name || 'Empleado'}!`
          : `¡Salida registrada para ${user?.name || 'Empleado'}! Horas: ${res.data?.hoursWorked || 0}h`
      );
      setPin('');
      setNotes('');
      if (onClockSuccess) onClockSuccess({ user, hoursWorked: res.data?.hoursWorked });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al registrar la asistencia.');
      } else {
        setError('Error desconocido al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100">
            Reloj Checador de Asistencia
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Registra tu Entrada o Salida de turno ingresando tu PIN personal.
          </DialogDescription>
        </DialogHeader>

        {/* SELECTOR MODO ENTRADA / SALIDA */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl my-2">
          <Button
            type="button"
            variant={mode === 'IN' ? 'default' : 'ghost'}
            className={`flex-1 h-10 font-black text-xs rounded-xl transition-all ${
              mode === 'IN'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50'
            }`}
            onClick={() => {
              setMode('IN');
              setError(null);
            }}
          >
            <LogIn className="h-4 w-4 mr-1.5" /> Registrar Entrada
          </Button>

          <Button
            type="button"
            variant={mode === 'OUT' ? 'default' : 'ghost'}
            className={`flex-1 h-10 font-black text-xs rounded-xl transition-all ${
              mode === 'OUT'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50'
            }`}
            onClick={() => {
              setMode('OUT');
              setError(null);
            }}
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Registrar Salida
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200/60">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-200/60 animate-in zoom-in-95">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
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
            disabled={loading || pin.length === 0}
            className={`w-full h-11 font-black text-sm rounded-xl cursor-pointer active:scale-95 transition-all ${
              mode === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {loading ? 'Procesando...' : mode === 'IN' ? 'Confirmar Entrada' : 'Confirmar Salida'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
