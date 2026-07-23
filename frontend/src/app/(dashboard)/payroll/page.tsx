'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Clock, DollarSign, Users, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PinLockGuard from '@/components/PinLockGuard';

interface AttendanceLog {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  payAmount: number | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    role: string;
    hourlyRate?: number;
    dailySalary?: number;
  };
}

interface AttendanceSummaryData {
  period: { start: string; end: string };
  byUser: Array<{
    userId: string;
    userName: string;
    totalHours: number;
    totalPay: number;
    shiftsCount: number;
  }>;
  totalHours: number;
  totalPayroll: number;
  logs: AttendanceLog[];
}

export default function PayrollPage() {
  const { data, isLoading } = useSWR<AttendanceSummaryData>('/attendance/summary');

  return (
    <PinLockGuard>
      <div className="space-y-6 w-full pb-20 animate-in fade-in duration-300">
        {/* HEADER DE LA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></span>
              Gestión de Personal
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Sueldos y Asistencias Semanales
            </h1>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Horas Trabajadas</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {data?.totalHours || 0} hrs
              </span>
            </div>
            <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Nómina A Pagar</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ${(data?.totalPayroll || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Empleados Activos</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {data?.byUser.length || 0}
              </span>
            </div>
            <div className="h-11 w-11 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* RESUMEN POR EMPLEADO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-500" /> Desglose de Sueldos por Empleado
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.byUser.map((userSummary) => (
              <div
                key={userSummary.userId}
                className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-800 dark:text-slate-100">{userSummary.userName}</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {userSummary.shiftsCount} turnos
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Horas Acumuladas:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{userSummary.totalHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {userSummary.totalPay > 0 ? 'Total a Pagar:' : 'Estatus:'}
                  </span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {userSummary.totalPay > 0
                      ? `$${userSummary.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : 'Asistencia Registrada'}
                  </span>
                </div>
              </div>
            ))}

            {(!data?.byUser || data.byUser.length === 0) && (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold">
                No hay registros de asistencias en la semana actual.
              </div>
            )}
          </div>
        </div>

        {/* BITÁCORA DE TURNOS REGISTRADOS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" /> Bitácora Reciente de Asistencias
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Empleado</th>
                  <th className="p-3">Entrada</th>
                  <th className="p-3">Salida</th>
                  <th className="p-3">Horas</th>
                  <th className="p-3">Pago Generado</th>
                  <th className="p-3 rounded-r-xl">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{log.user.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {new Date(log.clockIn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {log.clockOut
                        ? new Date(log.clockOut).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                      {log.hoursWorked ? `${log.hoursWorked} hrs` : 'En curso...'}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      {log.payAmount ? `$${log.payAmount.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="p-3">
                      {log.clockOut ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Completado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full animate-pulse">
                          Turno Activo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PinLockGuard>
  );
}
