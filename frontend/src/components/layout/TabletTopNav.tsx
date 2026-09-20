'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import {
  Store,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Landmark,
  Clock,
  LayoutDashboard,
  Truck,
  FileText,
  Star,
  UtensilsCrossed,
  WifiOff,
  Sun,
  Moon,
  Smartphone,
  KeyRound,
  Lock,
  Unlock,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface ActiveRegister {
  openedBy: string;
  expectedBalance: number;
}

interface DrawerItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  adminOnly?: boolean;
  /** Contador visible junto al nombre (p. ej. solicitudes pendientes) */
  badge?: number;
}

interface TabletTopNavProps {
  role: string;
  displayRegister: ActiveRegister | null;
  isOnline: boolean;
  syncQueueCount: number;
  theme?: string;
  setTheme: (theme: string) => void;
  isInstallable: boolean;
  onInstallClick: () => void;
  onOpenAdminPinModal: () => void;
  onOpenCashiers: () => void;
  onOpenChangePin: () => void;
  onOpenTimeClock: () => void;
  onLogout: () => void;
  cashierName?: string;
}

export function TabletTopNav({
  role,
  displayRegister,
  isOnline,
  syncQueueCount,
  theme,
  setTheme,
  isInstallable,
  onInstallClick,
  onOpenAdminPinModal,
  onOpenCashiers,
  onOpenChangePin,
  onOpenTimeClock,
  onLogout,
  cashierName,
}: TabletTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Solicitudes de productos por atender: se muestra como contador en el menú
  const { data: requestedProducts } = useSWR<Array<{ status: string }>>(role !== 'NONE' ? '/requested-products' : null);
  const pendingRequests = requestedProducts?.filter((p) => p.status === 'PENDIENTE').length ?? 0;

  // Rutas secundarias / administrativas (en el Drawer deslizable)
  const drawerSections: Array<{ group: string; items: DrawerItem[] }> = [
    {
      group: 'Operación Diaria',
      items: [
        { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, desc: 'Cobro y venta rápida' },
        { name: 'Corte de Caja', href: '/register', icon: DollarSign, desc: 'Apertura, egresos y arqueo' },
      ],
    },
    {
      group: 'Inventario',
      items: [
        { name: 'Catálogo & Stock', href: '/inventory', icon: Package, desc: 'Existencias, precios y categorías' },
        { name: 'Proveedores y Compras', href: '/suppliers', icon: Truck, desc: 'Compras, visitas y tickets por pagar' },
        {
          name: 'Solicitudes',
          href: '/requests',
          icon: FileText,
          desc: 'Productos que piden los clientes',
          badge: pendingRequests > 0 ? pendingRequests : undefined,
        },
        { name: 'Mermas y Consumos', href: '/waste', icon: UtensilsCrossed, desc: 'Pérdidas y consumo interno' },
        { name: 'Rendimiento y Reportes', href: '/performance', icon: Star, desc: 'Más y menos vendidos', adminOnly: true },
      ],
    },
    {
      group: 'Gestión del Negocio',
      items: [
        { name: 'Clientes & Crédito', href: '/customers', icon: Users, desc: 'Cuentas y cobros a clientes' },
        { name: 'Caja Grande / Bóveda', href: '/vault', icon: Landmark, desc: 'Control de fondo de resguardo', adminOnly: true },
        { name: 'Sueldos & Nómina', href: '/payroll', icon: Clock, desc: 'Turnos y pagos al personal', adminOnly: true },
        { name: 'Dashboard & Métricas', href: '/', icon: LayoutDashboard, desc: 'Reportes y estadísticas', adminOnly: true },
      ],
    },
  ];

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-3 sm:px-5 sticky top-0 z-40 shrink-0 select-none shadow-xs">
        {/* 1. IZQUIERDA: MENÚ DRAWER & LOGO COMPACTO */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            title="Abrir menú de módulos"
          >
            <Menu className="h-5 w-5" />
            {pendingRequests > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          <div
            onClick={() => router.push('/pos')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Store className="h-4.5 w-4.5" />
            </div>
            <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
              Dok&apos;s POS
            </span>
          </div>
        </div>

        {/* ESPACIO VACÍO CENTRAL DESPEJADO */}
        <div className="flex-1" />

        {/* 3. DERECHA: SALDO DE CAJA ÚNICO & AVATAR DE USUARIO */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Alerta de sincronización o offline sutil */}
          {syncQueueCount > 0 && (
            <div
              className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse shrink-0 border border-amber-200/50"
              title={`${syncQueueCount} pendientes`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>{syncQueueCount}</span>
            </div>
          )}

          {!isOnline && (
            <div
              className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
              title="Modo local sin conexión"
            >
              <WifiOff className="h-3.5 w-3.5" />
            </div>
          )}

          {/* Pastilla Única de Caja Chica */}
          <div
            onClick={() => router.push('/register')}
            title="Ver o gestionar caja"
            className={cn(
              'h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer select-none bg-transparent',
              displayRegister
                ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                : 'border-rose-500/50 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
            )}
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full shrink-0',
                displayRegister ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              )}
            />
            {displayRegister ? (
              <span className="font-black text-sm tracking-tight">
                ${displayRegister.expectedBalance.toFixed(0)}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider">Cerrada</span>
            )}
          </div>

          {/* Avatar / Centro de Control de Usuario (Con Nombre y Apellidos) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "h-10 flex items-center gap-2 px-3 rounded-xl border transition-all cursor-pointer select-none bg-transparent",
                isMenuOpen
                  ? "border-slate-400 dark:border-slate-600 ring-2 ring-slate-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100"
              )}
              title="Menú de cuenta y configuración"
            >
              <div className="flex flex-col text-left leading-none min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[130px] sm:max-w-[200px] truncate">
                  {cashierName || (role === 'ADMIN' ? 'Administrador' : 'Cajero')}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 mt-0.5">
                  {role === 'ADMIN' ? 'Admin Maestro' : 'Cajero en turno'}
                </span>
              </div>

              <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0", isMenuOpen && "rotate-180")} />
            </button>

            {/* Popover Menú */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">
                    {cashierName || 'Usuario'}
                  </span>
                  <span
                    className="inline-block mt-0.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {role === 'ADMIN' ? 'Administrador' : 'Cajero'}
                  </span>
                </div>

                <div className="space-y-0.5 py-1">
                  {role === 'ADMIN' ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cambiar</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
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

      {/* 4. DRAWER LATERAL SUAVE (SE ABRE AL TOCAR EL BOTÓN MENÚ DE LA ESQUINA) */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col transition-transform duration-200 ease-out select-none',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Encabezado del Drawer */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 block">
                Dok&apos;s POS
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Módulos del Sistema
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Secciones del Drawer */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {drawerSections.map((sec) => {
            const filteredItems = sec.items.filter((it) => {
              if (it.adminOnly && role !== 'ADMIN') return false;
              if (role !== 'ADMIN' && !displayRegister && it.href !== '/register') return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.group} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {sec.group}
                </p>
                <div className="space-y-1">
                  {filteredItems.map((it) => {
                    const isActive = pathname === it.href;
                    const Icon = it.icon;

                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150',
                          isActive
                            ? 'bg-indigo-600 text-white font-black shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'h-4.5 w-4.5 shrink-0',
                              isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{it.name}</span>
                            <span
                              className={cn(
                                'text-[10px]',
                                isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                              )}
                            >
                              {it.desc}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {it.badge !== undefined && (
                            <span
                              className={cn(
                                'min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center',
                                isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                              )}
                            >
                              {it.badge}
                            </span>
                          )}
                          <ChevronRight className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del Drawer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0 bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              onOpenTimeClock();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>Reloj Checador de Asistencia</span>
          </button>
        </div>
      </div>
    </>
  );
}
