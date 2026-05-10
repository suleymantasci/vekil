import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vekil.tasci.cloud/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vekil_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('vekil_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('vekil_access_token', data.accessToken);
          localStorage.setItem('vekil_refresh_token', data.refreshToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(error.config);
        } catch {
          // Refresh failed, clear tokens
          localStorage.removeItem('vekil_access_token');
          localStorage.removeItem('vekil_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Buildings API
export const buildingsApi = {
  list: (page = 1, limit = 20) =>
    api.get(`/buildings?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get(`/buildings/${id}`),
  create: (data: any) =>
    api.post('/buildings', data),
  update: (id: string, data: any) =>
    api.put(`/buildings/${id}`, data),
  delete: (id: string) =>
    api.delete(`/buildings/${id}`),
};

// Apartments API
export const apartmentsApi = {
  list: (buildingId: string, page = 1, limit = 20) =>
    api.get(`/apartments?buildingId=${buildingId}&page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get(`/apartments/${id}`),
  create: (data: any) =>
    api.post('/apartments', data),
  createBatch: (buildingId: string, apartments: any[]) =>
    api.post('/apartments/batch', { buildingId, apartments }),
  update: (id: string, data: any) =>
    api.put(`/apartments/${id}`, data),
  delete: (id: string) =>
    api.delete(`/apartments/${id}`),
};

// Users API
export const usersApi = {
  list: (page = 1, limit = 20) =>
    api.get(`/users?page=${page}&limit=${limit}`),
  get: (id: string) =>
    api.get(`/users/${id}`),
  create: (data: any) =>
    api.post('/users', data),
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data),
  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

// Tahakkuk (Charge) API
export const tahakkukApi = {
  // Rules
  getRules: (organizationId: string, buildingId?: string) =>
    api.get(`/tahakkuk/rules?organizationId=${organizationId}${buildingId ? `&buildingId=${buildingId}` : ''}`),
  createRule: (organizationId: string, data: any) =>
    api.post(`/tahakkuk/rules?organizationId=${organizationId}`, data),
  updateRule: (organizationId: string, ruleId: string, data: any) =>
    api.put(`/tahakkuk/rules/${ruleId}?organizationId=${organizationId}`, data),
  deleteRule: (organizationId: string, ruleId: string) =>
    api.delete(`/tahakkuk/rules/${ruleId}?organizationId=${organizationId}`),

  // Charges
  generateCharges: (data: { organizationId: string; buildingId?: string; period: string; rules: any[] }) =>
    api.post('/tahakkuk/generate', data),
  getCharges: (organizationId: string, period: string, buildingId?: string) =>
    api.get(`/tahakkuk/charges?organizationId=${organizationId}&period=${period}${buildingId ? `&buildingId=${buildingId}` : ''}`),
  getApartmentBalance: (apartmentId: string) =>
    api.get(`/tahakkuk/apartment/${apartmentId}/balance`),

  // Late Fees
  calculateLateFees: (organizationId: string, period?: string) =>
    api.post('/tahakkuk/calculate-late-fees', { organizationId, period }),
  getLateFees: (organizationId: string, period?: string) =>
    api.get(`/tahakkuk/late-fees?organizationId=${organizationId}${period ? `&period=${period}` : ''}`),
};

// Payments API
export const paymentsApi = {
  list: (organizationId: string, period?: string, page = 1, limit = 50) =>
    api.get(`/payments?organizationId=${organizationId}${period ? `&period=${period}` : ''}&page=${page}&limit=${limit}`),
  getByApartment: (apartmentId: string, page = 1, limit = 20) =>
    api.get(`/payments/apartment/${apartmentId}?page=${page}&limit=${limit}`),
  create: (data: { organizationId: string; apartmentId: string; userId?: string; chargeId?: string; amount: number; paymentMethod?: string; reference?: string }) =>
    api.post('/payments', data),
  getSummary: (organizationId: string, period: string) =>
    api.get(`/payments/summary?organizationId=${organizationId}&period=${period}`),
};