import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: any | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null }),
}));
