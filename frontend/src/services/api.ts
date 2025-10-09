import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Check localStorage directly as fallback
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const authData = JSON.parse(stored);
        if (authData.token) {
          config.headers.Authorization = `Bearer ${authData.token}`;
        }
      }
    } catch (error) {
      console.error('Failed to read auth token:', error);
    }
  }
  return config;
});

// Handle 401 and 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - redirecting to login');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.error === 'No token provided') {
      console.error('No authentication token - redirecting to login');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
