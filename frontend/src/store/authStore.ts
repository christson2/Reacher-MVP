/**
 * Auth Store (Zustand)
 * Global state management for authentication
 */

import { create } from 'zustand';
import { apiClient } from '@/services/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null, token?: string) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<{ user: User; token: string }>(
        '/auth/login',
        { email, password }
      );
      apiClient.setToken(response.token);
      set({ user: response.user, token: response.token, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', loading: false });
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<{ user: User; token: string }>(
        '/auth/signup',
        { name, email, password }
      );
      apiClient.setToken(response.token);
      set({ user: response.user, token: response.token, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Signup failed', loading: false });
    }
  },

  logout: () => {
    apiClient.clearToken();
    set({ user: null, token: null });
  },

  setUser: (user, token) => {
    if (token) {
      apiClient.setToken(token);
    }
    set({ user, token });
  },

  setToken: (token) => {
    apiClient.setToken(token);
    set({ token });
  },
}));
