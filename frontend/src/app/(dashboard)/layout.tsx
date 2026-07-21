'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import axios from 'axios';
import { parseAxiosError } from '@/lib/errorMapper';
import { cn } from '@/lib/utils';
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Lock,
  Unlock,
  KeyRound,
  Sun,
  Moon,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import GlobalLockScreen from '@/components/GlobalLockScreen';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { CashiersManagementDialog } from '@/components/CashiersManagementDialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ActiveRegister {
  openedBy: string;
  expectedBalance: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeRegister, setActiveRegister] = useState<ActiveRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { role, logout } = useAuthStore();

  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isCashiersOpen, setIsCashiersOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const { data: swrCashiers, mutate: mutateCashiers } = useSWR<{ id: string; name: string; role: string }[]>('/auth/cashiers');
  const cashiers = swrCashiers || [];

  const { theme, setTheme } = useTheme();

  const { setIsOnline, updateSyncQueueCount, syncQueueCount, isOnline } = useOfflineStore();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión a internet restablecida.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión a internet. Operando en modo local.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === 'ChunkLoadError' ||
        event.reason?.message?.includes('hmr-client') ||
        event.reason?.message?.includes('Turbopack')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.message?.includes('Router action dispatched before initialization') ||
        event.message?.includes('hmr-client') ||
        event.error?.message?.includes('Router action dispatched before initialization')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      Promise.resolve().then(() => {
        setIsInstallable(false);
      });
    }

    updateSyncQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setIsOnline, updateSyncQueueCount]);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || currentPin.length !== 4) {
      toast.error('Los PINs deben tener exactamente 4 dígitos.');
      return;
    }
    if (newPin !== confirmNewPin) {
      toast.error('El nuevo PIN y su confirmación no coinciden.');
      return;
    }

    try {
      setPinLoading(true);
      await api.patch('/auth/change-pin', { currentPin, newPin });
      toast.success('PIN modificado con éxito. Inicia sesión de nuevo.');
      setIsChangePinOpen(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      logout();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al cambiar el PIN.'));
    } finally {
      setPinLoading(false);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice for PWA installation: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const checkActiveRegister = async () => {
    try {
      const response = await api.get('/register/active');
      setActiveRegister(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error('Error checking active register:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      if (role !== 'NONE') {
        checkActiveRegister();
        // Si no es ADMIN e intenta estar en la raíz '/', redirigir a Ventas (/pos)
        if (role !== 'ADMIN' && (pathname === '/' || pathname === '/inventory' || pathname === '/reports')) {
          router.replace('/pos');
        }
      } else {
        setActiveRegister(null);
      }
    });
  }, [pathname, role, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (role === 'NONE') {
    return <GlobalLockScreen />;
  }

  const navItems = [
    { name: 'Inicio', href: '/', icon: LayoutDashboard, adminOnly: true },
    { name: 'Vender', href: '/pos', icon: ShoppingCart },
    { name: 'Inventario', href: '/inventory', icon: Package, adminOnly: true },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Caja', href: '/register', icon: DollarSign },
  ].filter(item => !item.adminOnly || role === 'ADMIN');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans pb-0 md:pt-0">

      {/* HEADER SUPERIOR MÓVIL / TABLET */}
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 sticky top-0 z-50 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-indigo-600" />
          <span className="font-black text-sm tracking-tight text-slate-800">{"Dok's POS"}</span>
        </div>

        {/* Estatus Caja chica y Rol de seguridad */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              title="Instalar Aplicación (PWA)"
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider transition-all animate-pulse shadow-sm shadow-indigo-600/10 cursor-pointer"
            >
              <Smartphone className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}
          {isOnline ? (
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Wifi className="h-3 w-3 text-emerald-500" />
              <span className="hidden sm:inline">En línea</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
              <WifiOff className="h-3 w-3 text-rose-500" />
              <span>Offline</span>
            </div>
          )}
          {syncQueueCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Pendientes: {syncQueueCount}
            </div>
          )}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Cambiar Tema (Claro / Oscuro)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors inline-flex items-center"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-slate-650" />}
          </button>
          {role === 'ADMIN' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCashiersOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Gestionar Plantilla de Cajeros"
              >
                <Users className="h-3 w-3 text-slate-600" /> Cajeros
              </button>
              <button
                onClick={() => setIsChangePinOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Cambiar PIN de seguridad"
              >
                <KeyRound className="h-3 w-3 text-slate-600" /> PIN
              </button>
              <button
                onClick={() => {
                  logout();
                  toast.info('Acceso de Administrador bloqueado (Modo Cajero).');
                }}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Bloquear a Modo Cajero"
              >
                <Lock className="h-3 w-3" /> Bloquear Admin
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                logout();
                toast.info('Introduce el PIN de Administrador.');
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              title="Ingresar PIN de Administrador"
            >
              <Unlock className="h-3 w-3" /> Modo Admin
            </button>
          )}

          {!loading && (
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1 rounded-full text-[10px] font-bold">
              {activeRegister ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-600">Caja: <strong className="text-slate-800">${activeRegister.expectedBalance.toFixed(0)}</strong></span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  <span className="text-rose-600 uppercase">Cerrada</span>
                  <button
                    className="text-indigo-600 hover:text-indigo-800 ml-1 underline"
                    onClick={() => router.push('/register')}
                  >
                    Abrir
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CONTENEDOR DE PÁGINAS (OCUPA TODO EL ANCHO SIN SIDEBAR) */}
      <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-28 bg-transparent relative">
        {children}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR FLOTANTE (ESTILO FLOATING DOCK GIGANTE) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg h-16 bg-white border border-slate-200 z-50 flex items-center justify-around px-4 shadow-[0_15px_45px_rgba(0,0,0,0.08)] rounded-full shrink-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center transition-all duration-300 rounded-full py-2 px-4 text-xs font-extrabold tracking-wide active:scale-95 gap-2",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-2.5"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isActive && (
                <span className="text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* DIÁLOGO CAMBIO DE PIN */}
      <Dialog open={isChangePinOpen} onOpenChange={setIsChangePinOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-800 text-lg">Cambiar PIN de Acceso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIN Actual (4 dígitos)</label>
              <Input
                type="password"
                maxLength={4}
                required
                disabled={pinLoading}
                className="focus-visible:ring-indigo-500 font-bold text-center text-lg h-11"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nuevo PIN (4 dígitos)</label>
              <Input
                type="password"
                maxLength={4}
                required
                disabled={pinLoading}
                className="focus-visible:ring-indigo-500 font-bold text-center text-lg h-11"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmar Nuevo PIN</label>
              <Input
                type="password"
                maxLength={4}
                required
                disabled={pinLoading}
                className="focus-visible:ring-indigo-500 font-bold text-center text-lg h-11"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="text-xs" disabled={pinLoading} onClick={() => setIsChangePinOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                disabled={pinLoading || currentPin.length !== 4 || newPin.length !== 4 || confirmNewPin.length !== 4}
              >
                Guardar PIN
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO GESTIÓN DE CAJEROS */}
      <CashiersManagementDialog
        open={isCashiersOpen}
        onOpenChange={setIsCashiersOpen}
        cashiers={cashiers}
        onCashiersUpdated={mutateCashiers}
      />
    </div>
  );
}
