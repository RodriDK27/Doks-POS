import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { CashRegister } from '../types';
import { parseAxiosError } from '@/lib/errorMapper';

export function useRegister() {
  const router = useRouter();
  const { role } = useAuthStore();



  // Estados Formulario Apertura
  const [openForm, setOpenForm] = useState({
    openedBy: '',
    initialBalance: 0,
  });

  // Estados Formulario Ajuste Manual (Ingreso / Egreso)
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    type: 'EGRESO' as 'INGRESO' | 'EGRESO',
    amount: 0,
    description: '',
  });

  // Estados Cierre de Caja
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number | null>(null);
  const [closeNotes, setCloseNotes] = useState('');

  // Estados Modal PIN Apertura
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // CALCULADORA DE BILLETES Y MONEDAS (MXN)
  const [billCounts, setBillCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
    0.5: 0,
  });

  // SWR queries
  const { data: swrActiveRegister, mutate: mutateActiveRegister, isLoading: activeRegisterLoading } = useSWR<CashRegister | null>('/register/active');
  const { data: swrLastClosed, mutate: mutateLastClosed } = useSWR<CashRegister | null>('/register/last-closed');
  const { data: swrHistory, mutate: mutateHistory, isLoading: historyLoading } = useSWR<CashRegister[]>(role === 'ADMIN' ? '/register' : null);
  const { data: swrCashiers, mutate: mutateCashiers } = useSWR<{ id: string; name: string; role: string }[]>('/auth/cashiers');


  const loading = activeRegisterLoading || historyLoading;

  const activeRegister = swrActiveRegister ?? null;
  const lastClosedRegister = swrLastClosed ?? null;
  const history = swrHistory ? swrHistory.filter((c) => c.status === 'CERRADO') : [];
  const cashiers = swrCashiers || [];

  const fetchCajaData = async () => {
    mutateActiveRegister();
    mutateLastClosed();
    mutateHistory();
    mutateCashiers();
  };

  const handleDownloadPdf = async (registerId: string) => {
    try {
      toast.info('Generando reporte PDF...');
      const response = await api.get(`/reports/register/${registerId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `corte_caja_${registerId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte descargado correctamente.');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(parseAxiosError(error, 'No se pudo descargar el reporte de caja.'));
    }
  };

  const calculatedSum = Object.entries(billCounts).reduce(
    (acc, [value, qty]) => acc + parseFloat(value) * (qty || 0),
    0
  );

  const applyCalculatedToClose = () => {
    setCountedCash(calculatedSum);
  };

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.openedBy.trim()) {
      toast.error('El nombre del cajero es obligatorio.');
      return;
    }
    
    const selectedUser = cashiers.find(c => c.name === openForm.openedBy);
    if (selectedUser && selectedUser.role !== 'ADMIN' && (openForm.initialBalance === undefined || openForm.initialBalance === null || openForm.initialBalance <= 0)) {
      toast.error('El fondo inicial de caja es obligatorio para empleados (Gerentes y Cajeros).');
      return;
    }

    if (openForm.initialBalance < 0) {
      toast.error('El fondo inicial de caja no puede ser negativo.');
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmOpenBox = async () => {
    try {
      await api.post('/register/open', openForm);
      toast.success('¡Turno de caja abierto correctamente!');
      setOpenForm({ openedBy: '', initialBalance: 0 });
      setIsPinModalOpen(false);
      fetchCajaData();
      router.replace('/pos');
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al abrir caja.'));
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjForm.amount <= 0) {
      toast.error('El monto debe ser un valor positivo mayor a cero.');
      return;
    }
    if (!adjForm.description.trim()) {
      toast.error('La descripción del movimiento es obligatoria.');
      return;
    }

    try {
      await api.post('/register/transaction', adjForm);
      toast.success(
        adjForm.type === 'EGRESO' 
          ? `Egreso por $${adjForm.amount} registrado.` 
          : `Ingreso por $${adjForm.amount} registrado.`
      );
      setIsAdjOpen(false);
      setAdjForm({ type: 'EGRESO', amount: 0, description: '' });
      fetchCajaData();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al guardar movimiento.'));
    }
  };

  const [nextInitialBalance, setNextInitialBalance] = useState<number>(500);

  const handleCloseRegister = async () => {
    if (countedCash === null || countedCash < 0) {
      toast.error('Debe capturar la cantidad total contada en el cajón.');
      return;
    }

    try {
      const active = activeRegister;
      await api.post('/register/close', {
        actualBalance: countedCash,
        nextInitialBalance,
        notes: closeNotes.trim() || undefined,
      });

      if (active) {
        // Registrar salida automática en el Reloj Checador de Asistencia para el empleado del turno que está cerrando
        try {
          await api.post('/attendance/clock-out-by-name', {
            employeeName: active.openedBy,
            notes: 'Salida automática al realizar el corte de caja chica',
          });
        } catch {
          // Continuar sin interrumpir el cierre de caja si no se requiere o ya cerró
        }

        const diff = countedCash - active.expectedBalance;
        if (diff === 0) {
          toast.success('Caja cerrada con éxito. ¡Todo cuadra perfecto!');
        } else if (diff < 0) {
          toast.warning(`Caja cerrada. FALTANTE detectado: -$${Math.abs(diff).toFixed(2)}`);
        } else {
          toast.info(`Caja cerrada. SOBRANTE detectado: +$${diff.toFixed(2)}`);
        }
      }

      setIsCloseOpen(false);
      setCountedCash(null);
      setCloseNotes('');
      
      setBillCounts({
        1000: 0,
        500: 0,
        200: 0,
        100: 0,
        50: 0,
        20: 0,
        10: 0,
        5: 0,
        2: 0,
        1: 0,
        0.5: 0,
      });

      fetchCajaData();
    } catch (error) {
      toast.error(parseAxiosError(error, 'Error al cerrar caja.'));
    }
  };

  return {
    role,
    activeRegister,
    history,
    loading,
    openForm,
    setOpenForm,
    isAdjOpen,
    setIsAdjOpen,
    adjForm,
    setAdjForm,
    isCloseOpen,
    setIsCloseOpen,
    countedCash,
    setCountedCash,
    closeNotes,
    setCloseNotes,
    nextInitialBalance,
    setNextInitialBalance,
    billCounts,
    setBillCounts,
    calculatedSum,
    applyCalculatedToClose,
    handleOpenRegister,
    handleAdjustmentSubmit,
    handleCloseRegister,
    handleDownloadPdf,
    fetchCajaData,
    cashiers,
    mutateCashiers,
    isPinModalOpen,
    setIsPinModalOpen,
    handleConfirmOpenBox,
    lastClosedRegister,
  };
}
