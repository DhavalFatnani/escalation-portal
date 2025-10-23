export type UserRole = 'growth' | 'ops' | 'admin';

export type TicketStatus = 'open' | 'processed' | 'resolved' | 're-opened' | 'closed';

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

export type IssueType = 
  | 'Product Not Live After Return'
  | 'GRN Discrepancy'
  | 'Physical Product vs SKU Mismatch'
  | 'Other';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  is_manager: boolean;
  is_active: boolean;
  managed_by: string | null;
  auto_assign_enabled: boolean;
  must_change_password?: boolean;
  profile_picture?: string | null;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  created_by: string;
  brand_name: string;
  description: string | null;
  issue_type: IssueType | null;
  expected_output: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  last_status_change_at: string | null;
  current_assignee: string | null;
  assigned_to: string | null;
  reviewed_by_manager: string | null;
  manager_notes: string | null;
  resolved_at: string | null;
  resolution_remarks: string | null;
  primary_resolution_remarks: string | null;
  reopen_reason: string | null;
  acceptance_remarks: string | null;
  creator_name?: string;
  creator_email?: string;
  creator_role?: UserRole;
  assignee_name?: string;
  assigned_to_name?: string;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  action: string;
  comment: string | null;
  payload: any | null;
  created_at: string;
  actor_name?: string;
  actor_email?: string;
}

export interface CreateTicketDTO {
  brand_name: string;
  description?: string;
  issue_type?: IssueType;
  expected_output?: string;
  priority: TicketPriority;
}

export interface ResolveTicketDTO {
  remarks: string;
  attachments?: string[];
}

export interface ReopenTicketDTO {
  reason: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  brand_name?: string;
  search?: string;
  limit?: number;
  offset?: number;
  // Individual user filters
  created_by?: string;
  assigned_to?: string;
  current_assignee?: string;
  // New manager-specific filters
  created_by_team?: UserRole;
  assigned_to_team?: UserRole;
  unassigned_for_team?: UserRole;
}

export interface AssignTicketDTO {
  assigned_to: string;
  notes?: string;
}

export interface TeamMember extends User {
  active_tickets: number;
}

export interface TeamMetrics {
  total_tickets: number;
  open_tickets: number;
  processed_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  reopen_rate: number;
  team_members: TeamMember[];
}
