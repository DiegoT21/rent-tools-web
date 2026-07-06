import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useAuthStore as usePersistedAuthStore } from '../store/useAuthStore';
import { uploadAvatar } from '../lib/mediaUpload';

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

function syncUserToStores(user: any) {
  useAuthStore.getState().setUser(user);
  usePersistedAuthStore.getState().setUser(user);
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data.data || response.data;

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      usePersistedAuthStore.getState().setToken(accessToken);
    }
    if (user) syncUserToStores(user);

    return response.data;
  },

  loginWithGoogle: async (googleData: { accessToken?: string; isMock?: boolean; mockEmail?: string; mockName?: string }) => {
    const response = await api.post('/auth/google', googleData);
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

  logout: async () => {
    useAuthStore.getState().clearSession();
    usePersistedAuthStore.getState().clearAuth();
    window.location.href = '/login';
  },
};
