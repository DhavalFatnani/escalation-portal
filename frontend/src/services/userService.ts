import api from './api';

export const userService = {
  async getAllUsers(): Promise<{ users: any[] }> {
    const response = await api.get('/users');
    return response.data;
  },

  async createUser(data: { name: string; email: string; role: string }): Promise<{ user: any; temporaryPassword: string }> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.post('/users/change-password', data);
    return response.data;
  },

  async updateProfilePicture(profilePicture: string): Promise<{ user: any; message: string }> {
    const response = await api.patch('/users/profile/picture', { profile_picture: profilePicture });
    return response.data;
  },

  async updateName(name: string): Promise<{ user: any; message: string }> {
    const response = await api.patch('/users/profile/name', { name });
    return response.data;
  },
};
