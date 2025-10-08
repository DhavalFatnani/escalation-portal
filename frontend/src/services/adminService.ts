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
};
