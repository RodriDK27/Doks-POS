'use client';

import React from 'react';
import useSWR from 'swr';
import PinLockGuard from '@/components/PinLockGuard';
import { ModulePageHeader } from '../inventory/components/ModulePageHeader';
import { AnalyticsTab } from '../inventory/components/AnalyticsTab';

interface SalesAnalyticsItem {
  id: string;
  name: string;
  stock: number;
  sellPrice: number;
  category: string | null;
  quantitySold: number;
  totalRevenue: number;
}

interface SalesAnalytics {
  topSelling: SalesAnalyticsItem[];
  slowMoving: SalesAnalyticsItem[];
}

export default function PerformancePage() {
  const { data: analytics, isLoading } = useSWR<SalesAnalytics>('/products/sales-analytics');

  return (
    <PinLockGuard>
      <div className="space-y-4 w-full pb-20 relative">
        <ModulePageHeader title="Rendimiento y Reportes" />
        <AnalyticsTab analytics={analytics} analyticsLoading={isLoading} />
      </div>
    </PinLockGuard>
  );
}
