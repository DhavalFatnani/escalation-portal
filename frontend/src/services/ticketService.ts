import api from './api';
import { Ticket, CreateTicketDTO, ResolveTicketDTO, ReopenTicketDTO, TicketFilters, TicketActivity } from '../types';

export const ticketService = {
  async createTicket(data: CreateTicketDTO): Promise<{ ticket: Ticket }> {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  async getTickets(filters?: TicketFilters): Promise<{ 
    tickets: Ticket[]; 
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.brand_name) {
      params.append('brand_name', filters.brand_name);
    }
    if (filters?.created_by) {
      params.append('created_by', filters.created_by);
    }
    if (filters?.assigned_to) {
      params.append('assigned_to', filters.assigned_to);
    }
    if (filters?.current_assignee) {
      params.append('current_assignee', filters.current_assignee);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    console.log('ticketService.getTickets - Filters:', filters);
    console.log('ticketService.getTickets - URL:', `/tickets?${params.toString()}`);

    const response = await api.get(`/tickets?${params.toString()}`);
    return response.data;
  },

  async getTicket(ticketNumber: string): Promise<{ ticket: Ticket }> {
    const response = await api.get(`/tickets/${ticketNumber}`);
    return response.data;
  },

  async resolveTicket(ticketNumber: string, data: ResolveTicketDTO): Promise<{ ticket: Ticket }> {
    const response = await api.post(`/tickets/${ticketNumber}/resolve`, data);
    return response.data;
  },

  async reopenTicket(ticketNumber: string, data: ReopenTicketDTO): Promise<{ ticket: Ticket }> {
    const response = await api.post(`/tickets/${ticketNumber}/reopen`, data);
    return response.data;
  },

  async closeTicket(ticketNumber: string, acceptanceRemarks?: string): Promise<{ ticket: Ticket }> {
    const response = await api.post(`/tickets/${ticketNumber}/close`, {
      acceptance_remarks: acceptanceRemarks,
    });
    return response.data;
  },

  async getActivities(ticketNumber: string): Promise<{ activities: TicketActivity[] }> {
    const response = await api.get(`/tickets/${ticketNumber}/activities`);
    return response.data;
  },
};
