import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uuid?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isVerified?: boolean;
  kycStatus?: string;
  [key: string]: any;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  setAccessToken: (token: string | null) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  clearAuth: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setAccessToken: (token) => set({ accessToken: token }),
      setToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, user: null, error: null }),
      clearAuth: () => set({ accessToken: null, user: null, error: null }),

      fetchProfile: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ error: "No hay token de acceso" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          const json = await response.json();
          if (response.ok && json.success) {
            set({ user: json.data });
          } else {
            set({ error: json.message || "Error al obtener el perfil", user: null });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          set({ error: "Error de conexión al obtener el perfil", user: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);

useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ hasHydrated: true });
});
