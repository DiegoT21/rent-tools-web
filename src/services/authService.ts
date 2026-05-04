import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

// Tipos básicos para los ejemplos
export interface LoginCredentials {
  email: string;
  password?: string;
  [key: string]: any;
}

export interface RegisterData {
  email: string;
  password?: string;
  [key: string]: any;
}

export const authService = {
  /**
   * Login: Inicia sesión y almacena el token en memoria
   */
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // El backend devuelve { data: { accessToken: '...', user: {...} } }
    const { accessToken, user } = response.data.data || response.data;
    
    // Guardar el accessToken y el usuario en memoria (Zustand)
    if (accessToken) useAuthStore.getState().setAccessToken(accessToken);
    if (user) useAuthStore.getState().setUser(user);
    
    return response.data;
  },

  /**
   * Register: Registra usuario y almacena el token si el backend autologuea
   */
  register: async (userData: RegisterData) => {
    const response = await api.post('/auth/register', userData);
    
    // Si tu backend devuelve un token y usuario al registrar
    const { accessToken, user } = response.data.data || response.data;
    if (accessToken) useAuthStore.getState().setAccessToken(accessToken);
    if (user) useAuthStore.getState().setUser(user);
    
    return response.data;
  },

  /**
   * Obtener Perfil: Solicita los datos del usuario autenticado
   */
  getProfile: async () => {
    const response = await api.get('/users/profile');
    const user = response.data.data || response.data; // Depende de la estructura del backend
    useAuthStore.getState().setUser(user);
    return user;
  },

  /**
   * Logout: Limpia el estado local y redirige (sin llamar al backend temporalmente)
   */
  logout: async () => {
    // Limpiar el estado del frontend (Zustand)
    useAuthStore.getState().clearSession();
      
    // Redirigir a login
    window.location.href = '/login';
  }
};
