import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SimpleModeState {
  /** La tablet está bloqueada en la pantalla sencilla (/simple) hasta que un administrador la libere */
  active: boolean;
  enter: () => void;
  exit: () => void;
}

// Persistido: si la tablet se reinicia o recarga, vuelve directo a la pantalla sencilla
export const useSimpleModeStore = create<SimpleModeState>()(
  persist(
    (set) => ({
      active: false,
      enter: () => set({ active: true }),
      exit: () => set({ active: false }),
    }),
    {
      name: 'doks-pos-simple-mode',
    }
  )
);
