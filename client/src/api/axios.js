import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, user is not authenticated — redirect to login
    if (error.response?.status === 401) {
      // Only redirect if not already on login/register page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Applications API
export const getApplications = (params) => api.get('/applications', { params });
export const getApplication = (id) => api.get(`/applications/${id}`);
export const createApplication = (data) => api.post('/applications', data);
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getApplicationStats = () => api.get('/applications/stats/dashboard');

// Resumes API
export const getResumes = () => api.get('/resumes');
export const uploadResume = (formData) => api.post('/resumes', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const setPrimaryResume = (id) => api.patch(`/resumes/${id}/primary`);
export const deleteResume = (id) => api.delete(`/resumes/${id}`);

// AI API
export const getAnalysis = (applicationId) => api.get(`/ai/analysis/${applicationId}`);
export const analyzeMatch = (applicationId) => api.post('/ai/analyze-match', { applicationId });
export const analyzeSkillGap = (applicationId) => api.post('/ai/skill-gap', { applicationId });
export const getInterviewQuestions = (applicationId) => api.post('/ai/interview-questions', { applicationId });
export const getResumeImprovement = (applicationId) => api.post('/ai/resume-improvement', { applicationId });
export const askResumeQuestion = (question) => api.post('/ai/ask-resume', { question });
export const embedResume = (resumeId) => api.post('/ai/embed', { resumeId });

export default api;
