import { create } from 'zustand';
import api from '../api/axios';

const useResumeStore = create((set, get) => ({
  resumes: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchResumes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/resumes');
      set({ resumes: data.resumes, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch resumes',
        isLoading: false,
      });
      throw error;
    }
  },

  uploadResume: async (formData) => {
    set({ isUploading: true, error: null });
    try {
      const { data } = await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Add new resume to the list
      const currentResumes = get().resumes;
      // If it's the first resume, it becomes primary automatically
      if (currentResumes.length === 0) {
        data.resume.isPrimary = true;
      }
      set({
        resumes: [data.resume, ...currentResumes],
        isUploading: false,
      });
      
      return data.resume;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to upload resume',
        isUploading: false,
      });
      throw error;
    }
  },

  setPrimary: async (id) => {
    try {
      await api.patch(`/resumes/${id}/primary`);
      // Optimistic update
      set((state) => ({
        resumes: state.resumes.map((r) => ({
          ...r,
          isPrimary: r._id === id,
        })),
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteResume: async (id) => {
    try {
      await api.delete(`/resumes/${id}`);
      // Refresh list to get updated primary if needed
      await get().fetchResumes();
    } catch (error) {
      throw error;
    }
  },

  embedResume: async (id) => {
    try {
      await api.post('/ai/embed', { resumeId: id });
    } catch (error) {
      throw error;
    }
  },
}));

export default useResumeStore;
