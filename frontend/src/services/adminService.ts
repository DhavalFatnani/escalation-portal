import api from './api';

export const adminService = {
  async deleteTicket(ticketNumber: string): Promise<{ message: string }> {
    const response = await api.delete(`/tickets/${ticketNumber}`);
    return response.data;
  },

  async forceStatusChange(ticketNumber: string, status: string, reason?: string): Promise<{ ticket: any }> {
    const response = await api.post(`/tickets/${ticketNumber}/force-status`, { status, reason });
    return response.data;
  },

  async generateOTP(attachmentId?: string, referenceId?: string): Promise<{ otp: any; expires_in_minutes: number }> {
    const response = await api.post('/admin/otp/generate', {
      attachment_id: attachmentId,
      reference_id: referenceId,
    });
    return response.data;
  },

  async getActiveOTPs(): Promise<{ otps: any[] }> {
    const response = await api.get('/admin/otp/active');
    return response.data;
  },

  async revokeOTP(otpId: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/otp/${otpId}`);
    return response.data;
  },
};
