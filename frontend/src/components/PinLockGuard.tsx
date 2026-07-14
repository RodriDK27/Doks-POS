'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Delete, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PinLockGuardProps {
  children: React.ReactNode;
}

export default function PinLockGuard({ children }: PinLockGuardProps) {
  const { role, setRole } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar error de hidratación en NextJS debido al middleware persistido
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPinSubmit = async (pinValue: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-pin', { pin: pinValue });
      const userRole = response.data.role;
      const userToken = response.data.token;

      if (userRole === 'ADMIN') {
        setRole('ADMIN', userToken);
        toast.success('Sesión de Administrador iniciada.');
      } else {
        toast.error('Acceso denegado. Se requiere PIN de administrador para ver esta pantalla.');
        setPin('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'PIN de seguridad incorrecto.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      verifyPinSubmit(pin);
    }
  }, [pin]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si ya es Admin, dejar ver la pantalla
  if (role === 'ADMIN') {
    return <>{children}</>;
  }

  // De lo contrario, mostrar el teclado numérico de bloqueo táctil
  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-slate-100 p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] text-center space-y-8 animate-in fade-in zoom-in duration-300">
      
      {/* CABECERA BLOQUEO */}
      <div className="flex flex-col items-center gap-3">
        <div className="p-4 bg-indigo-50 text-indigo-650 rounded-2xl animate-bounce">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Pantalla Protegida</h2>
          <p className="text-xs text-slate-400 font-medium px-4">
            Introduce el PIN de Administrador para desbloquear esta sección.
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
                ? 'bg-indigo-600 border-indigo-650 scale-110 shadow-sm' 
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
            className="h-14 rounded-2xl font-black text-lg text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-slate-200 active:scale-95 transition-all shadow-sm"
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

      {/* RETORNO AL DASHBOARD */}
      <div className="pt-4 border-t border-slate-50">
        <Link href="/">
          <Button variant="link" className="text-xs font-bold text-slate-450 hover:text-indigo-650 flex items-center justify-center gap-1.5 mx-auto">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
