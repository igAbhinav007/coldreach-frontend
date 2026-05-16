import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 'An error occurred';
    const code = error.response?.data?.error?.code;

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }

    const enhancedError = new Error(message);
    (enhancedError as any).code = code;
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).details = error.response?.data?.error?.details;
    throw enhancedError;
  }
);

// Auth
export const authApi = {
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  connectGmail: () => api.get('/auth/gmail/connect'),
  disconnectGmail: (id: string) => api.delete(`/auth/gmail/${id}`),
};

// Contacts
export const contactsApi = {
  list: (params?: any) => api.get('/contacts', { params }),
  get: (id: string) => api.get(`/contacts/${id}`),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  bulkImport: (contacts: any[]) => api.post('/contacts/bulk', { contacts }),
};

// Companies
export const companiesApi = {
  list: (params?: any) => api.get('/companies', { params }),
  get: (id: string) => api.get(`/companies/${id}`),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.put(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};

// Templates
export const templatesApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  preview: (id: string, variables: any) => api.post(`/templates/${id}/preview`, { variables }),
};

// Campaigns
export const campaignsApi = {
  list: (params?: any) => api.get('/campaigns', { params }),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  batchSchedule: (id: string, data: any) => api.post(`/campaigns/${id}/batch-schedule`, data),
  cancel: (id: string) => api.post(`/campaigns/${id}/cancel`),
  stats: (id: string) => api.get(`/campaigns/${id}/stats`),
};

// Delivery Logs
export const logsApi = {
  list: (params?: any) => api.get('/delivery-logs', { params }),
  summary: () => api.get('/delivery-logs/summary'),
};

// Payment
export const paymentApi = {
  plans: () => api.get('/payment/plans'),
  subscription: () => api.get('/payment/subscription'),
  checkout: (data: any) => api.post('/payment/checkout', data),
  process: (transactionId: string, data: any) => api.post(`/payment/process/${transactionId}`, data),
  history: () => api.get('/payment/history'),
  cancel: () => api.post('/payment/cancel'),
};

export default api;
