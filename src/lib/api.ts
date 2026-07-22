import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import {
  broadcastTokenUpdate,
  withRefreshLock,
} from './sessionSync';

const PRODUCTION_API_URL = 'https://rent-tools-back-production.up.railway.app/api';

function isLocalApiUrl(url: string | undefined): boolean {
  if (!url) return true;
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

/**
 * En producción nunca uses localhost (aunque Vercel tenga VITE_API_URL mal).
 * En desarrollo prioriza .env / proxy local.
 */
function resolveApiBaseUrl() {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (import.meta.env.PROD) {
    if (fromEnv && !isLocalApiUrl(fromEnv)) return fromEnv;
    return PRODUCTION_API_URL;
  }

  return fromEnv || 'http://localhost:3000/api';
}

function isAuthFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

function shouldForceLogout(error: unknown): boolean {
  return isAuthFailure(error);
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (reason?: unknown) => void;
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

export function redirectToLogin() {
  useAuthStore.getState().clearSession();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

async function performRefresh(): Promise<string> {
  const response = await api.post('/auth/refresh');
  const newAccessToken = response.data.data.accessToken as string;
  useAuthStore.getState().setAccessToken(newAccessToken);
  broadcastTokenUpdate(newAccessToken);
  return newAccessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh'
    ) {
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
        const refreshResult = await withRefreshLock(performRefresh);
        if (!refreshResult) {
          await new Promise((r) => setTimeout(r, 400));
          const token = useAuthStore.getState().accessToken;
          if (token) {
            processQueue(null, token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          throw error;
        }

        processQueue(null, refreshResult);
        originalRequest.headers.Authorization = `Bearer ${refreshResult}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        if (shouldForceLogout(refreshError)) {
          redirectToLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
