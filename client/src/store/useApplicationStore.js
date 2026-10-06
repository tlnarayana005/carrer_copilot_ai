import { create } from 'zustand';
import api from '../api/axios';

const useApplicationStore = create((set, get) => ({
  applications: [],
  currentApplication: null,
  stats: null,
  recentApps: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,

  // Fetch all applications with filters
  fetchApplications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/applications', { params });
      set({
        applications: res.data.applications,
        total: res.data.total,
        page: res.data.page,
        pages: res.data.pages,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch applications',
        isLoading: false,
      });
    }
  },

  // Fetch single application
  fetchApplication: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/applications/${id}`);
      set({ currentApplication: res.data.application, isLoading: false });
      return res.data.application;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch application',
        isLoading: false,
      });
    }
  },

  // Create application
  createApplication: async (data) => {
    const res = await api.post('/applications', data);
    const { applications } = get();
    set({ applications: [res.data.application, ...applications] });
    return res.data.application;
  },

  // Update application
  updateApplication: async (id, data) => {
    const res = await api.patch(`/applications/${id}`, data);
    const { applications } = get();
    set({
      applications: applications.map((app) =>
        app._id === id ? res.data.application : app
      ),
      currentApplication: res.data.application,
    });
    return res.data.application;
  },

  // Delete application
  deleteApplication: async (id) => {
    await api.delete(`/applications/${id}`);
    const { applications } = get();
    set({
      applications: applications.filter((app) => app._id !== id),
    });
  },

  // Fetch dashboard stats
  fetchStats: async () => {
    try {
      const res = await api.get('/applications/stats');
      set({
        stats: res.data.stats,
        recentApps: res.data.recent,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },
}));

export default useApplicationStore;
