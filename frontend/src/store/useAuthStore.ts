import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'ADMIN' | 'CAJERO' | 'NONE';

interface AuthState {
  role: Role;
  token: string | null;
  setRole: (role: Role, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'NONE',
      token: null,
      setRole: (role, token = null) => set({ role, token }),
      logout: () => set({ role: 'NONE', token: null }),
    }),
    {
      name: 'doks-pos-auth-storage',
    }
  )
);
