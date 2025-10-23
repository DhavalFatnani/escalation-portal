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
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
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
  created_at: Date;
  updated_at: Date;
  last_status_change_at: Date | null;
  current_assignee: string | null;
  assigned_to: string | null;
  reviewed_by_manager: string | null;
  manager_notes: string | null;
  resolved_at: Date | null;
  resolution_remarks: string | null;
  reopen_reason: string | null;
  primary_resolution_remarks: string | null;
  creator_role?: UserRole;
  creator_name?: string;
  creator_email?: string;
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
  created_at: Date;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  filename: string;
  url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: Date;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  comment: string;
  is_internal: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTicketDTO {
  brand_name: string;
  description?: string;
  issue_type?: IssueType;
  expected_output?: string;
  priority: TicketPriority;
}

export interface UpdateTicketDTO {
  brand_name?: string;
  description?: string;
  issue_type?: IssueType;
  expected_output?: string;
  priority?: TicketPriority;
  current_assignee?: string;
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
  created_by?: string;
  assigned_to?: string;
  current_assignee?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
  // New manager-specific filters
  created_by_team?: UserRole;
  assigned_to_team?: UserRole;
  unassigned_for_team?: UserRole;
}

export interface AssignTicketDTO {
  assigned_to: string; // User ID
  notes?: string;
}

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  assigned_by: string;
  assigned_to: string;
  assigned_at: Date;
  notes: string | null;
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

export interface AuthRequest extends Express.Request {
  user?: User;
}
