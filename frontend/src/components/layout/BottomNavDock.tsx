'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ShoppingCart, DollarSign, Package } from 'lucide-react';

interface BottomNavDockProps {
  isRegisterOpen?: boolean;
  registerBalance?: number;
}

export function BottomNavDock({ isRegisterOpen, registerBalance }: BottomNavDockProps) {
  const pathname = usePathname();

  const dockItems = [
    {
      name: 'Venta',
      href: '/pos',
      icon: ShoppingCart,
    },
    {
      name: 'Caja',
      href: '/register',
      icon: DollarSign,
      badge: isRegisterOpen ? `$${registerBalance?.toFixed(0) || '0'}` : undefined,
      isOpen: isRegisterOpen,
    },
    {
      name: 'Inventario',
      href: '/inventory',
      icon: Package,
    },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800 z-50 flex items-center justify-around p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-full select-none touch-manipulation">
      {dockItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full text-xs font-black transition-all duration-200 active:scale-95 touch-manipulation',
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span className="text-[11px] sm:text-xs tracking-tight">{item.name}</span>

            {item.badge && !isActive && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
