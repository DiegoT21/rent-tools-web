import { api } from '../lib/api';
import { setRememberMePreference } from '../lib/authStorage';
import { useAuthStore } from '../store/authStore';
import { useAuthStore as usePersistedAuthStore } from '../store/useAuthStore';
import { uploadAvatar } from '../lib/mediaUpload';

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
  [key: string]: any;
}

export interface RegisterData {
  email: string;
  password?: string;
  acceptTerms?: true;
  [key: string]: any;
}

function syncUserToStores(user: any) {
  useAuthStore.getState().setUser(user);
  usePersistedAuthStore.getState().setUser(user);
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { rememberMe = true, email, password } = credentials;
    setRememberMePreference(rememberMe);

    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user } = response.data.data || response.data;

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      usePersistedAuthStore.getState().setToken(accessToken);
    }
    if (user) syncUserToStores(user);

    return response.data;
  },

  loginWithGoogle: async (googleData: {
    accessToken?: string;
    isMock?: boolean;
    mockEmail?: string;
    mockName?: string;
    rememberMe?: boolean;
  }) => {
    const { rememberMe = true, ...payload } = googleData;
    setRememberMePreference(rememberMe);

    const response = await api.post('/auth/google', payload);
    const { accessToken, user } = response.data.data || response.data;

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      usePersistedAuthStore.getState().setToken(accessToken);
    }
    if (user) syncUserToStores(user);

    return response.data;
  },

  register: async (userData: RegisterData) => {
    const response = await api.post('/auth/register', userData);
    const { accessToken, user } = response.data.data || response.data;

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      usePersistedAuthStore.getState().setToken(accessToken);
    }
    if (user) syncUserToStores(user);

    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    const user = response.data.data || response.data;
    syncUserToStores(user);
    return user;
  },

  updateProfileImage: async (file: File) => {
    const fileKey = await uploadAvatar(file);
    const response = await api.patch('/users/profile', {
      profileImageFileKey: fileKey,
    });
    const user = response.data.data || response.data;
    syncUserToStores(user);
    return user;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* cookie may already be cleared */
    }
    useAuthStore.getState().clearSession();
    usePersistedAuthStore.getState().clearAuth();
    window.location.href = '/login';
  },
};
