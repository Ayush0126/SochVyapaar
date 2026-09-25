import axios from 'axios';

const apiInstance = axios.create({
  baseURL: '/api',
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  auth: {
    login: (email, password) => apiInstance.post('/auth/login', { email, password }),
    register: (name, email, password) => apiInstance.post('/auth/register', { name, email, password }),
    getMe: () => apiInstance.get('/auth/me'),
  },
  shop: {
    getShop: () => apiInstance.get('/shop'),
    createShop: (data) => apiInstance.post('/shop', data),
    updateShop: (data) => apiInstance.put('/shop', data),
  },
  metrics: {
    addMetrics: (data) => apiInstance.post('/metrics', data),
    getMetrics: () => apiInstance.get('/metrics'),
    getMetricsSummary: () => apiInstance.get('/metrics/summary'),
    deleteMetrics: (id) => apiInstance.delete(`/metrics/${id}`),
    parseVoice: (text, language) => apiInstance.post('/metrics/parse-voice', { text, language }),
  },
  analytics: {
    getAnalytics: (days) => apiInstance.get(`/analytics?days=${days}`),
  },
  insights: {
    getInsights: () => apiInstance.get('/insights'),
    generateInsight: (language = 'en') => apiInstance.post('/insights/generate', { language }),
  },
  actions: {
    createAction: (data) => apiInstance.post('/actions', data),
    getActions: () => apiInstance.get('/actions'),
    updateAction: (id, data) => apiInstance.put(`/actions/${id}`, data),
    getActionImpact: (id) => apiInstance.get(`/actions/${id}/impact`),
  }
};

export default api;
