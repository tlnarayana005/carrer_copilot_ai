import { create } from 'zustand';
import * as api from '../api/axios';

const useAiStore = create((set) => ({
  analyses: {}, // { applicationId: { match: {...}, skillGap: {...} } }
  isLoading: false,
  error: null,
  
  // Chat state for "Ask my resume"
  chatHistory: [],
  isChatLoading: false,

  fetchAnalysis: async (applicationId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.getAnalysis(applicationId);
      set((state) => ({
        analyses: {
          ...state.analyses,
          [applicationId]: data.analyses,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch analysis', isLoading: false });
    }
  },

  runAnalysis: async (type, applicationId) => {
    set({ isLoading: true, error: null });
    try {
      let response;
      switch (type) {
        case 'match':
          response = await api.analyzeMatch(applicationId);
          break;
        case 'skill-gap':
          response = await api.analyzeSkillGap(applicationId);
          break;
        case 'interview-prep':
          response = await api.getInterviewQuestions(applicationId);
          break;
        case 'resume-improvement':
          response = await api.getResumeImprovement(applicationId);
          break;
        default:
          throw new Error('Unknown analysis type');
      }

      // Update state with new analysis
      set((state) => {
        const currentAppAnalyses = state.analyses[applicationId] || {};
        return {
          analyses: {
            ...state.analyses,
            [applicationId]: {
              ...currentAppAnalyses,
              [type]: response.data.analysis,
            },
          },
          isLoading: false,
        };
      });
      
      return response.data.analysis;
    } catch (error) {
      set({ error: error.response?.data?.message || `Failed to run ${type} analysis`, isLoading: false });
      throw error;
    }
  },

  askQuestion: async (question) => {
    // Add user message to UI immediately
    const userMsg = { role: 'user', content: question };
    set((state) => ({
      chatHistory: [...state.chatHistory, userMsg],
      isChatLoading: true,
    }));

    try {
      const { data } = await api.askResumeQuestion(question);
      
      const aiMsg = { 
        role: 'ai', 
        content: data.answer,
        sources: data.sources,
        ragUsed: data.ragUsed
      };

      set((state) => ({
        chatHistory: [...state.chatHistory, aiMsg],
        isChatLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        chatHistory: [...state.chatHistory, { 
          role: 'error', 
          content: error.response?.data?.message || 'Failed to get answer' 
        }],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => set({ chatHistory: [] }),
}));

export default useAiStore;
