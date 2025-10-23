import api from './api';
import { TeamMember, TeamMetrics, Ticket, AssignTicketDTO } from '../types';

export const managerService = {
  /**
   * Get manager's team members
   */
  async getTeamMembers(): Promise<{ team_members: TeamMember[] }> {
    const response = await api.get('/managers/team');
    return response.data;
  },

  /**
   * Get pending tickets needing assignment
   */
  async getPendingTickets(): Promise<{ tickets: Ticket[] }> {
    const response = await api.get('/managers/tickets/pending');
    return response.data;
  },

  /**
   * Get team performance metrics
   */
  async getTeamMetrics(): Promise<TeamMetrics> {
    const response = await api.get('/managers/metrics');
    return response.data;
  },

  /**
   * Toggle user active/inactive status
   */
  async toggleUserActive(userId: string): Promise<{ message: string; is_active: boolean }> {
    const response = await api.patch(`/managers/users/${userId}/toggle-active`);
    return response.data;
  },

  /**
   * Toggle auto-assign setting
   */
  async toggleAutoAssign(enabled: boolean): Promise<{ message: string; auto_assign_enabled: boolean }> {
    const response = await api.patch('/managers/auto-assign', { enabled });
    return response.data;
  },

  /**
   * Assign ticket to teammate
   */
  async assignTicket(ticketNumber: string, data: AssignTicketDTO): Promise<{ ticket: Ticket; message: string }> {
    const response = await api.post(`/tickets/${ticketNumber}/assign`, data);
    return response.data;
  },

  /**
   * Get incoming tickets (tickets needing assignment to team)
   */
  async getIncomingTickets(): Promise<{ tickets: Ticket[] }> {
    const response = await api.get('/managers/incoming');
    return response.data;
  },

  /**
   * Get outgoing tickets (tickets created by team)
   */
  async getOutgoingTickets(): Promise<{ tickets: Ticket[] }> {
    const response = await api.get('/managers/outgoing');
    return response.data;
  },

  /**
   * Get team workload summary
   */
  async getTeamWorkload(): Promise<{ workload: any[] }> {
    const response = await api.get('/managers/workload');
    return response.data;
  },
};

