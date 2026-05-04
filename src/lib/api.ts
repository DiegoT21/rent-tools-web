import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// Instancia base de Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // URL base del Backend
  withCredentials: true, // CRÍTICO: Permite enviar/recibir cookies HTTP-only (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables para el control de peticiones concurrentes y estado de refresco
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ==========================================
// 1. Interceptor de Peticiones (Request)
// ==========================================
// Inyecta el Access Token en cada petición protegida si existe en memoria
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 2. Interceptor de Respuestas (Response)
// ==========================================
// Maneja la expiración del token (401) y ejecuta el refresco silencioso
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Validar si el error es 401 y no viene de las rutas de auth (para evitar bucle infinito)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh'
    ) {
      // Si ya hay un refresco en curso, encolamos las peticiones fallidas
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Llamar endpoint de refresh (las cookies viajan automáticamente gracias a withCredentials: true)
        const response = await api.post('/auth/refresh');
        
        // El backend responde con { success: true, data: { accessToken: '...' } }
        const newAccessToken = response.data.data.accessToken;

        // Actualizar el token en el estado global (Zustand)
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Procesar la cola de peticiones retenidas pasándoles el nuevo token
        processQueue(null, newAccessToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresco falla (el refreshToken expiró o fue revocado)
        processQueue(refreshError as AxiosError, null);
        
        // Limpiar el estado de sesión en el frontend
        useAuthStore.getState().clearSession();
        
        // Redirigir al usuario al Login forzosamente (usando window.location o el enrutador)
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
