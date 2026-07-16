import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { CashRegister } from '../types';

export function useRegister() {
  const { role } = useAuthStore();
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchCajaData = async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes] = await Promise.all([
        api.get('/register/active'),
        api.get('/register'),
      ]);
      setActiveRegister(activeRes.data);
      
      const cleanHistory = historyRes.data.filter((c: any) => c.status === 'CERRADO');
      setHistory(cleanHistory);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Error loading register data:', error);
        toast.error('No se pudo cargar la información de caja.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'NONE') {
      fetchCajaData();
    }
  }, [role]);

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
      toast.error('No se pudo descargar el reporte de caja.');
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
    if (openForm.initialBalance < 0) {
      toast.error('El fondo inicial de caja no puede ser negativo.');
      return;
    }

    try {
      await api.post('/register/open', openForm);
      toast.success('¡Turno de caja abierto correctamente!');
      setOpenForm({ openedBy: '', initialBalance: 0 });
      fetchCajaData();
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al abrir caja.');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar movimiento.');
    }
  };

  const handleCloseRegister = async () => {
    if (countedCash === null || countedCash < 0) {
      toast.error('Debe capturar la cantidad total contada en el cajón.');
      return;
    }

    try {
      const active = activeRegister;
      await api.post('/register/close', {
        actualBalance: countedCash,
        notes: closeNotes.trim() || undefined,
      });

      if (active) {
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
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cerrar la caja.');
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
    billCounts,
    setBillCounts,
    calculatedSum,
    applyCalculatedToClose,
    handleOpenRegister,
    handleAdjustmentSubmit,
    handleCloseRegister,
    handleDownloadPdf,
    fetchCajaData
  };
}
