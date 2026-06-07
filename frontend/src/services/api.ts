import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Global Axios Instance for API requests.
 *
 * Configured with:
 * 1. Base URL pointing to our Express server.
 * 2. Request interceptor to attach JWT token.
 * 3. Response interceptor to handle session expiration (401).
 */
const api = axios.create({
  baseURL: (import.meta.env['VITE_API_URL'] as string) || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: Inject the Bearer token if it exists in localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('trackra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // If backend returns 401 Unauthorized, the session has expired
    if (error.response?.status === 401) {
      localStorage.removeItem('trackra_token');
      // If we're not already on the landing page, redirect to home
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
