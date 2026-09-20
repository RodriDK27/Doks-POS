import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'ADMIN' | 'GERENTE' | 'CAJERO' | 'NONE';

interface Session {
  role: Role;
  token: string | null;
}

interface AuthState {
  role: Role;
  token: string | null;
  /**
   * Sesión del empleado (cajero/gerente) que estaba activa cuando se entró como administrador.
   * Permite salir del modo admin sin cerrar la sesión de quien atiende la caja.
   */
  employeeSession: Session | null;
  setRole: (role: Role, token?: string | null) => void;
  /** Cierra la sesión por completo (también la del empleado). */
  logout: () => void;
  /**
   * Sale del modo administrador y vuelve a la sesión del empleado que había antes.
   * Devuelve true si la restauró; si no había ninguna, la sesión queda cerrada y devuelve false.
   * Si no se está en modo administrador no hace nada y devuelve false.
   */
  exitAdminMode: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: 'NONE',
      token: null,
      employeeSession: null,
      setRole: (role, token = null) =>
        set((state) => {
          if (role === 'ADMIN') {
            // Al subir a administrador se conserva la sesión del empleado para poder volver a ella
            const wasEmployee = state.role === 'CAJERO' || state.role === 'GERENTE';
            return {
              role,
              token,
              employeeSession: wasEmployee ? { role: state.role, token: state.token } : (state.employeeSession ?? null),
            };
          }
          // Un inicio de sesión de empleado reemplaza cualquier sesión previa
          return { role, token, employeeSession: null };
        }),
      logout: () => set({ role: 'NONE', token: null, employeeSession: null }),
      exitAdminMode: () => {
        const { role, employeeSession } = get();
        if (role !== 'ADMIN') return false;
        if (employeeSession) {
          set({ role: employeeSession.role, token: employeeSession.token, employeeSession: null });
          return true;
        }
        set({ role: 'NONE', token: null, employeeSession: null });
        return false;
      },
    }),
    {
      name: 'doks-pos-auth-storage',
    }
  )
);
