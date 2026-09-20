'use client';

import React from 'react';
import { ModulePageHeader } from '../inventory/components/ModulePageHeader';
import { WasteReportTab } from '../inventory/components/WasteReportTab';

export default function WastePage() {
  return (
    <div className="space-y-4 w-full pb-20 relative">
      <ModulePageHeader title="Mermas y Consumos" />
      <WasteReportTab />
    </div>
  );
}
