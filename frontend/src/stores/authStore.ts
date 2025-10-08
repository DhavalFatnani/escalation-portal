import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Simple localStorage persistence
const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setStoredAuth = (state: Partial<AuthState>) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist auth state:', error);
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const stored = getStoredAuth();
  
  return {
    user: stored.user || null,
    token: stored.token || null,
    isAuthenticated: stored.isAuthenticated || false,
    login: (user, token) => {
      const newState = { user, token, isAuthenticated: true };
      set(newState);
      setStoredAuth(newState);
    },
    logout: () => {
      const newState = { user: null, token: null, isAuthenticated: false };
      set(newState);
      setStoredAuth(newState);
    },
  };
});
