import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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