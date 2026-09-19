'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
}

interface AppSidebarProps {
  role: string;
  isRegisterOpen: boolean;
  registerBalance?: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenTimeClock: () => void;
  cashierName?: string;
}

export function AppSidebar({
  role,
  isRegisterOpen,
  registerBalance,
  mobileOpen,
  onCloseMobile,
  onOpenTimeClock,
  cashierName,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('doks_sidebar_collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('doks_sidebar_collapsed', String(next));
  };

  const operationItems: NavItemConfig[] = [
    {
      name: 'Vender (POS)',
      href: '/pos',
      icon: ShoppingCart,
    },
    {
      name: 'Caja Chica',
      href: '/register',
      icon: DollarSign,
      badge: isRegisterOpen ? `$${registerBalance?.toFixed(0) || '0'}` : 'Cerrada',
      badgeVariant: isRegisterOpen ? 'success' : 'danger',
    },
  ];

  const managementItems: NavItemConfig[] = [
    {
      name: 'Inventario',
      href: '/inventory',
      icon: Package,
    },
    {
      name: 'Clientes',
      href: '/customers',
      icon: Users,
    },
    {
      name: 'Caja Grande',
      href: '/vault',
      icon: Landmark,
      adminOnly: true,
    },
    {
      name: 'Sueldos',
      href: '/payroll',
      icon: Clock,
      adminOnly: true,
    },
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      adminOnly: true,
    },
  ];

  const filterItems = (items: NavItemConfig[]) =>
    items.filter((item) => {
      if (role !== 'ADMIN' && !isRegisterOpen && item.href !== '/register') {
        return false;
      }
      if (item.adminOnly && role !== 'ADMIN') return false;
      return true;
    });

  const visibleOperation = filterItems(operationItems);
  const visibleManagement = filterItems(managementItems);

  const renderNavGroup = (title: string, items: NavItemConfig[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        {(!collapsed || mobileOpen) && (
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            {title}
          </p>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed && !mobileOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 outline-none',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:shadow-indigo-600/15 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60',
                  collapsed && !mobileOpen && 'justify-center px-0 w-11 h-11 mx-auto'
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                    collapsed && !mobileOpen ? 'h-5 w-5' : 'h-4.5 w-4.5'
                  )}
                />

                {(!collapsed || mobileOpen) && (
                  <span className="flex-1 truncate tracking-tight text-xs sm:text-[13px]">
                    {item.name}
                  </span>
                )}

                {(!collapsed || mobileOpen) && item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 tracking-wider',
                      item.badgeVariant === 'success' &&
                        (isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'),
                      item.badgeVariant === 'danger' &&
                        (isActive ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400')
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none">
      {/* BRAND & COLLAPSE HEADER */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className={cn('flex items-center gap-2.5 overflow-hidden', collapsed && !mobileOpen && 'justify-center w-full')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 shrink-0">
            <Store className="h-5 w-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate">
                {"Dok's POS"}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Pro Terminal
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {mobileOpen ? (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          /* Desktop collapse toggle */
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* NAVIGATION GROUPS */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {renderNavGroup('Operación', visibleOperation)}
        {renderNavGroup('Administración', visibleManagement)}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Quick Time Clock button */}
        <button
          onClick={onOpenTimeClock}
          title="Reloj Checador de Asistencia"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer',
            collapsed && !mobileOpen && 'justify-center px-0 w-11 h-11 mx-auto'
          )}
        >
          <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Checador Asistencia</span>}
        </button>

        {/* User Card */}
        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 shadow-xs',
            collapsed && !mobileOpen && 'justify-center p-1.5'
          )}
        >
          <div
            className={cn(
              'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs',
              role === 'ADMIN'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
            )}
          >
            {role === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </div>

          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {cashierName || (role === 'ADMIN' ? 'Administrador' : 'Cajero')}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {role === 'ADMIN' ? 'Admin Maestro' : 'Turno Activo'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-300 ease-in-out z-30 h-screen sticky top-0',
          mounted && collapsed ? 'w-18' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* MOBILE DRAWER CONTAINER */}
      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 transition-transform duration-300 ease-out shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
