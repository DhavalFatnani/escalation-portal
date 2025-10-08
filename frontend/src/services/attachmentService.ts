import api from './api';

export const attachmentService = {
  async uploadFiles(ticketNumber: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

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

  async deleteAttachment(attachmentId: string): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`);
  },
};
