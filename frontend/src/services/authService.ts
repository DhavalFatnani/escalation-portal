import api from './api';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async signUp(data: { name: string; email: string; password: string }): Promise<{ message: string }> {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/users/me');
    return response.data;
  },
};
