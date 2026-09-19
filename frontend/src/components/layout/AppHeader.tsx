'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  WifiOff,
  Sun,
  Moon,
  Smartphone,
  Users,
  KeyRound,
  Lock,
  Unlock,
  ChevronDown,
} from 'lucide-react';

interface ActiveRegister {
  openedBy: string;
  expectedBalance: number;
}

interface AppHeaderProps {
  onOpenMobileNav: () => void;
  displayRegister: ActiveRegister | null;
  role: string;
  isOnline: boolean;
  syncQueueCount: number;
  theme?: string;
  setTheme: (theme: string) => void;
  isInstallable: boolean;
  onInstallClick: () => void;
  onOpenAdminPinModal: () => void;
  onOpenCashiers: () => void;
  onOpenChangePin: () => void;
  onLogout: () => void;
  cashierName?: string;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/pos': { title: 'Punto de Venta', subtitle: 'Terminal de Cobro Rápido' },
  '/inventory': { title: 'Inventario & Catálogo', subtitle: 'Existencias, Precios y Proveedores' },
  '/register': { title: 'Caja Chica', subtitle: 'Turno, Movimientos y Cortes' },
  '/customers': { title: 'Clientes & Crédito', subtitle: 'Cuentas y Saldos Pendientes' },
  '/vault': { title: 'Caja Grande / Bóveda', subtitle: 'Control de Fondos y Resguardo' },
  '/payroll': { title: 'Sueldos & Asistencias', subtitle: 'Nómina y Registro de Turnos' },
  '/': { title: 'Dashboard General', subtitle: 'Métricas de Venta y Rendimiento' },
};

export function AppHeader({
  onOpenMobileNav,
  displayRegister,
  role,
  isOnline,
  syncQueueCount,
  theme,
  setTheme,
  isInstallable,
  onInstallClick,
  onOpenAdminPinModal,
  onOpenCashiers,
  onOpenChangePin,
  onLogout,
  cashierName,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentRouteInfo = routeTitles[pathname] || {
    title: 'Dok\'s POS',
    subtitle: 'Terminal de Gestión',
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40 shrink-0 select-none">
      {/* LEFT: MOBILE MENU TRIGGER & PAGE TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
            {currentRouteInfo.title}
          </h1>
          <span className="hidden sm:block text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
            {currentRouteInfo.subtitle}
          </span>
        </div>
      </div>

      {/* RIGHT: REGISTER STATUS & CONTROL CENTER */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sync queue indicator */}
        {syncQueueCount > 0 && (
          <div
            className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse"
            title={`${syncQueueCount} transacciones pendientes por sincronizar`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            <span className="hidden sm:inline">Por sincronizar:</span>
            <span>{syncQueueCount}</span>
          </div>
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <div
            className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
            title="Sin conexión. Operando en modo local seguro."
          >
            <WifiOff className="h-3 w-3 text-rose-500" />
            <span className="hidden sm:inline">Modo Local</span>
          </div>
        )}

        {/* REGISTER STATUS PILL */}
        <div
          onClick={() => router.push('/register')}
          title="Ver estado de caja y movimientos"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs',
            displayRegister
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 hover:border-emerald-300'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 hover:border-rose-300'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              displayRegister ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            )}
          />
          {displayRegister ? (
            <div className="flex items-center gap-1">
              <span className="hidden md:inline font-semibold text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
                Caja:
              </span>
              <span className="font-black text-emerald-900 dark:text-emerald-100">
                ${displayRegister.expectedBalance.toFixed(0)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Caja Cerrada
            </span>
          )}
        </div>

        {/* UNIFIED USER / CONTROL CENTER DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'flex items-center gap-1.5 p-1 sm:pl-2.5 sm:pr-2 py-1 rounded-xl border transition-all cursor-pointer select-none',
              isMenuOpen
                ? 'bg-indigo-50 dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700/80'
            )}
            title="Centro de Control & Perfil"
          >
            <div
              className={cn(
                'h-6 w-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 text-white',
                role === 'ADMIN' ? 'bg-amber-600' : 'bg-indigo-600'
              )}
            >
              {role === 'ADMIN' ? 'A' : 'C'}
            </div>

            <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[90px] truncate">
              {cashierName || (role === 'ADMIN' ? 'Admin' : 'Cajero')}
            </span>

            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                isMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Info */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {cashierName || 'Usuario'}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider',
                      role === 'ADMIN'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                    )}
                  >
                    {role === 'ADMIN' ? 'Administrador' : 'Cajero'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                    )}
                  />
                  <span>{isOnline ? 'Conectado al servidor' : 'Modo Offline Local'}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-0.5 py-1">
                {/* Admin Mode switch */}
                {role === 'ADMIN' ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                      router.push('/register');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Salir de Modo Administrador</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAdminPinModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    <Unlock className="h-4 w-4 shrink-0" />
                    <span>Ingresar como Administrador</span>
                  </button>
                )}

                {/* Admin-only options */}
                {role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenCashiers();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Users className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>Gestionar Cajeros</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenChangePin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>Cambiar PIN de Acceso</span>
                    </button>
                  </>
                )}

                {/* PWA Install */}
                {isInstallable && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onInstallClick();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span>Instalar Aplicación (PWA)</span>
                  </button>
                )}

                {/* Theme toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <Moon className="h-4 w-4 text-slate-600 shrink-0" />
                    )}
                    <span>Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Cambiar
                  </span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                    router.push('/register');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
