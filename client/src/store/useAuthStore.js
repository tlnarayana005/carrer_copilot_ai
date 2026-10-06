import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true to check auth on app load

  // Check if user is already authenticated (called on app mount)
  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Register
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  // Login
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  // Logout
  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
