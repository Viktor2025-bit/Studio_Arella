import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  credits: number;
  avatar?: string;
  language?: string;
  business_name?: string;
  phone?: string;
  logo_url?: string;
  email_verified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (first_name: string, last_name: string, email: string, password: string, business_name?: string, phone?: string) => Promise<User>;
  logout: () => void;
  loadFromStorage: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
      return data.user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  register: async (first_name, last_name, email, password, business_name, phone) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { first_name, last_name, email, password, business_name, phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
      return data.user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    window.location.href = '/auth/login';
  },

  updateUser: (data) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...data } : null;
      if (updated) localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    });
  },
}));
