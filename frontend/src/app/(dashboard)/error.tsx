'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Registrar el error en consola para depuración
    console.error('Captured dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-8 shadow-xl text-center space-y-6">
        
        {/* Icono de Alerta Animado */}
        <div className="mx-auto h-16 w-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-500 animate-bounce">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Mensaje de Error */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Algo no salió como esperábamos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Se ha producido un error inesperado al renderizar este módulo. El resto de la aplicación sigue funcionando. Puedes intentar recargar el módulo.
          </p>
        </div>

        {/* Detalles del Error (Colapsable para evitar saturar la vista) */}
        {error.message && (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl text-left font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all max-h-24 overflow-y-auto">
            <span className="font-bold text-rose-500">Error:</span> {error.message}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar Módulo
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/pos';
            }}
            className="flex-1 text-slate-600 dark:text-slate-350 font-bold text-xs h-11 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Ir a Ventas (POS)
          </Button>
        </div>

        {/* Hash ID del Error */}
        {error.digest && (
          <p className="text-[9px] text-slate-400 dark:text-slate-500">
            ID del error: <span className="font-mono">{error.digest}</span>
          </p>
        )}

      </div>
    </div>
  );
}
