import api from './api';

export const attachmentService = {
  async uploadFiles(
    ticketNumber: string, 
    files: File[], 
    uploadContext?: 'initial' | 'resolution' | 'reopen' | 'additional'
  ): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add upload_context if provided
    if (uploadContext) {
      formData.append('upload_context', uploadContext);
    }

    const response = await api.post(
      `/tickets/${ticketNumber}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getAttachments(ticketNumber: string): Promise<{ attachments: any[] }> {
    const response = await api.get(`/tickets/${ticketNumber}/attachments`);
    return response.data;
  },

  async requestDeletion(attachmentId: string, reason: string): Promise<{ message: string; request: any }> {
    const response = await api.post(`/attachments/${attachmentId}/request-deletion`, { reason });
    return response.data;
  },

  async getPendingRequests(): Promise<{ requests: any[] }> {
    const response = await api.get('/deletion-requests/pending');
    return response.data;
  },

  async getMyRequests(): Promise<{ requests: any[] }> {
    const response = await api.get('/deletion-requests/my-requests');
    return response.data;
  },

  async approveRequest(requestId: string): Promise<{ message: string; request: any; otp_code: string }> {
    const response = await api.post(`/deletion-requests/${requestId}/approve`);
    return response.data;
  },

  async rejectRequest(requestId: string, reason?: string): Promise<{ message: string }> {
    const response = await api.post(`/deletion-requests/${requestId}/reject`, { reason });
    return response.data;
  },

  async deleteAttachment(attachmentId: string, otpCode: string): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`, {
      data: { otp_code: otpCode }
    });
  },
};
