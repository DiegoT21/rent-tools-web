import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  kycStatus: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setToken: (token) => set({ accessToken: token }),
      
      setUser: (user) => set({ user }),

      clearAuth: () => set({ user: null, accessToken: null, error: null }),

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
              'Authorization': `Bearer ${accessToken}`,
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
        user: state.user 
      }),
    }
  )
);
