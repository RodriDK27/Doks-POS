'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import api from '@/lib/api';

interface SWRProviderProps {
  children: React.ReactNode;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
