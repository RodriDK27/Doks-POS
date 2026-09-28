'use client';

import React, { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import axios from 'axios';
import { parseAxiosError } from '@/lib/errorMapper';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useTheme } from 'next-themes';
import { TimeClockDialog } from './components/TimeClockDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CashiersManagementDialog } from '@/components/CashiersManagementDialog';
import { TabletTopNav } from '@/components/layout/TabletTopNav';
import { BottomNavDock } from '@/components/layout/BottomNavDock';
import { useSimpleModeStore } from '@/store/useSimpleModeStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ActiveRegister {
  openedBy: string;
  expectedBalance: number;
}

// Pantallas que solo puede ver un administrador: al salir del modo admin se abandonan
const ADMIN_ONLY_PATHS = ['/', '/vault', '/payroll', '/performance', '/reports'];

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
  const { role, logout, exitAdminMode } = useAuthStore();
  const { active: isSimpleMode, enter: enterSimpleMode } = useSimpleModeStore();

  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isCashiersOpen, setIsCashiersOpen] = useState(false);
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);
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
      const activeReg = response.data;
      setActiveRegister(activeReg);
      return activeReg;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error('Error checking active register:', error);
      }
      setActiveRegister(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const { data: swrActiveRegister, mutate: mutateActiveRegister } = useSWR<ActiveRegister | null>(
    role !== 'NONE' ? '/register/active' : null
  );

  const displayRegister = swrActiveRegister !== undefined ? swrActiveRegister : activeRegister;

  const hasInitialRedirectRef = useRef(false);

  useEffect(() => {
    const handleRegisterUpdated = async () => {
      void mutateActiveRegister();
      // En modo sencillo la pantalla muestra "caja cerrada" por sí misma; no se sale de /simple
      if (useSimpleModeStore.getState().active) return;
      const activeReg = await checkActiveRegister();
      if (!activeReg) {
        if (pathname !== '/register') {
          router.replace('/register');
        }
      }
    };
    window.addEventListener('register-active-updated', handleRegisterUpdated);
    return () => {
      window.removeEventListener('register-active-updated', handleRegisterUpdated);
    };
  }, [mutateActiveRegister, pathname, router]);

  useEffect(() => {
    Promise.resolve().then(async () => {
      setMounted(true);
      // Modo sencillo: la tablet queda fija en /simple hasta que un administrador lo desactive
      if (isSimpleMode) {
        hasInitialRedirectRef.current = true;
        if (pathname !== '/simple') {
          router.replace('/simple');
        }
        return;
      }
      if (role !== 'NONE') {
        const activeReg = await checkActiveRegister();
        
        // Redirección inicial solo al cargar o reiniciar la app por primera vez
        if (!hasInitialRedirectRef.current) {
          hasInitialRedirectRef.current = true;
          if (!activeReg) {
            // Si la caja está cerrada al iniciar, dirigir a caja
            if (pathname !== '/register') {
              router.replace('/register');
            }
          } else {
            // Si la caja está abierta al iniciar/reiniciar, mandar a ventas
            router.replace('/pos');
          }
          return;
        }

        // Navegación normal una vez iniciada la app:
        if (pathname === '/') {
          router.replace(activeReg ? '/pos' : '/register');
        } else if (!activeReg && role !== 'ADMIN' && pathname !== '/register') {
          // Si la caja está cerrada y no es admin, requerir estar en caja
          router.replace('/register');
        } else if (role === 'CAJERO' && (pathname === '/reports' || pathname === '/performance' || pathname === '/vault' || pathname === '/payroll')) {
          router.replace('/pos');
        }
      } else {
        setActiveRegister(null);
        if (pathname !== '/register') {
          router.replace('/register');
        }
      }
    });
  }, [pathname, role, router, isSimpleMode]);


  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }


  // if (role === 'NONE') {
  //   return <GlobalLockScreen />;
  // }

  // Pantalla sencilla: sin barra superior ni dock, la página ocupa todo
  if (isSimpleMode || pathname === '/simple') {
    return <>{children}</>;
  }

  const adminAccount = cashiers.find((c) => c.role === 'ADMIN');
  const activeCashierName = displayRegister?.openedBy || (role === 'ADMIN' ? (adminAccount?.name || 'Administrador') : 'Cajero');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* BARRA SUPERIOR HORIZONTAL (OPTIMIZADA PARA TABLET - 100% ANCHO) */}
      <TabletTopNav
        role={role}
        displayRegister={displayRegister}
        isOnline={isOnline}
        syncQueueCount={syncQueueCount}
        theme={theme}
        setTheme={setTheme}
        isInstallable={isInstallable}
        onInstallClick={handleInstallClick}
        onOpenAdminPinModal={() => {
          const adminName = adminAccount ? adminAccount.name : 'Administrador';
          const event = new CustomEvent('openAdminPinModal', { detail: { name: adminName } });
          window.dispatchEvent(event);
        }}
        onOpenCashiers={() => setIsCashiersOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onOpenTimeClock={() => setIsTimeClockOpen(true)}
        onEnterSimpleMode={() => {
          enterSimpleMode();
          router.replace('/simple');
        }}
        onLogout={() => {
          if (role === 'ADMIN') {
            // Modo admin: solo se quita el modo, la sesión del empleado que atiende la caja sigue abierta
            if (exitAdminMode()) {
              toast.info(
                displayRegister?.openedBy
                  ? `Modo administrador desactivado. Sigue la sesión de ${displayRegister.openedBy}.`
                  : 'Modo administrador desactivado. Sigue la sesión de caja.'
              );
              if (ADMIN_ONLY_PATHS.includes(pathname)) {
                router.push(displayRegister ? '/pos' : '/register');
              }
              return;
            }
          } else {
            logout();
          }
          router.push('/register');
          toast.info('Sesión finalizada. Regresando a la pantalla de caja.');
        }}
        cashierName={activeCashierName}
      />

      {/* CONTENEDOR DE PÁGINAS A PANTALLA COMPLETA (CON ESPACIO PARA EL DOCK INFERIOR) */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 pb-24 sm:pb-28 bg-transparent relative">
        {children}
      </main>

      {/* MENÚ FLOTANTE INFERIOR COMPACTO (SOLO 3 BOTONES: VENTA, CAJA, INVENTARIO) */}
      <BottomNavDock
        isRegisterOpen={!!displayRegister}
        registerBalance={displayRegister?.expectedBalance}
      />


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

      {/* DIÁLOGO RELOJ CHECADOR DE ASISTENCIA */}
      <TimeClockDialog
        isOpen={isTimeClockOpen}
        onClose={() => setIsTimeClockOpen(false)}
      />
    </div>
  );
}
