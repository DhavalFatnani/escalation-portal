import { PoolClient } from 'pg';
import { query, getClient } from '../config/database';
import {
  Ticket,
  CreateTicketDTO,
  UpdateTicketDTO,
  ResolveTicketDTO,
  ReopenTicketDTO,
  TicketFilters,
  User,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
// No longer need mapping since we use labels directly

export class TicketService {
  async createTicket(userId: string, data: CreateTicketDTO): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Get user role to determine ticket prefix
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      const userRole = userResult.rows[0]?.role;

      // Generate ticket number based on creator's role
      // GROW prefix for Growth team tickets, OPS prefix for Ops team tickets
      const prefix = userRole === 'growth' ? 'GROW' : 'OPS';
      const ticketNumberResult = await client.query(
        `SELECT generate_ticket_number($1) as ticket_number`,
        [prefix]
      );
      const ticketNumber = ticketNumberResult.rows[0].ticket_number;

      // Insert ticket (issue_type is now already a label, assigned_to is null pending manager assignment)
      const ticketResult = await client.query(
        `INSERT INTO tickets 
        (ticket_number, created_by, brand_name, description, issue_type, expected_output, priority, status, assigned_to, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NULL, now(), now())
        RETURNING *`,
        [
          ticketNumber,
          userId,
          data.brand_name,
          data.description || null,
          data.issue_type || null,
          data.expected_output || null,
          data.priority,
        ]
      );

      const ticket = ticketResult.rows[0];

      // Log activity
      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
         VALUES ($1, $2, 'created', $3, now())`,
        [ticket.id, userId, `Ticket created by ${userRole} team - Pending manager assignment`]
      );

      await client.query('COMMIT');
      logger.info(`Ticket created: ${ticketNumber} by ${userRole} user ${userId}`);
      
      return ticket;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating ticket:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTickets(filters: TicketFilters, userId?: string, userRole?: string): Promise<{ 
    tickets: Ticket[]; 
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Role-based filtering for manager workflow:
    // Team members see tickets assigned to them OR created by them (unless specific filter is provided)
    // Managers see tickets assigned to their team members
    // Admin sees all tickets
    if (userRole === 'growth' || userRole === 'ops') {
      // Get user info to check if they're a manager
      const userResult = await query(
        'SELECT is_manager FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        const isManager = userResult.rows[0].is_manager;
        
        if (isManager) {
          // Manager: see tickets assigned to their team members OR created by the manager themselves
          if (!filters.created_by && !filters.assigned_to) {
            whereClause += ` AND (
              EXISTS (
                SELECT 1 FROM users u2 
                WHERE u2.id = t.assigned_to 
                AND u2.role = $${++paramCount}
                AND u2.managed_by = $${++paramCount}
              )
              OR t.created_by = $${++paramCount}
            )`;
            params.push(userRole, userId, userId);
          }
          // If there's a specific filter, let it through (handled later in the function)
        } else {
          // Team member: see tickets assigned to them OR created by them (if no specific created_by filter)
          if (!filters.created_by && !filters.assigned_to) {
            whereClause += ` AND (t.assigned_to = $${++paramCount} OR t.created_by = $${++paramCount})`;
            params.push(userId, userId);
          }
          // If there's a specific filter, let it through (handled later in the function)
        }
      }
    }

    if (filters.status && filters.status.length > 0) {
      whereClause += ` AND t.status = ANY($${++paramCount})`;
      params.push(filters.status);
    }

    if (filters.priority && filters.priority.length > 0) {
      whereClause += ` AND t.priority = ANY($${++paramCount})`;
      params.push(filters.priority);
    }

    if (filters.brand_name) {
      whereClause += ` AND t.brand_name ILIKE $${++paramCount}`;
      params.push(`%${filters.brand_name}%`);
    }

    if (filters.created_by) {
      whereClause += ` AND t.created_by = $${++paramCount}`;
      params.push(filters.created_by);
    }

    if (filters.assigned_to) {
      whereClause += ` AND t.assigned_to = $${++paramCount}`;
      params.push(filters.assigned_to);
    }

    if (filters.current_assignee) {
      whereClause += ` AND t.current_assignee = $${++paramCount}`;
      params.push(filters.current_assignee);
    }

    if (filters.date_from) {
      whereClause += ` AND t.created_at >= $${++paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereClause += ` AND t.created_at <= $${++paramCount}`;
      params.push(filters.date_to);
    }

    if (filters.search) {
      whereClause += ` AND t.search_vector @@ plainto_tsquery('english', $${++paramCount})`;
      params.push(filters.search);
    }

    // New manager-specific filters
    if (filters.created_by_team) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = t.created_by 
        AND u.role = $${++paramCount}
        AND u.managed_by = $${++paramCount}
      )`;
      params.push(filters.created_by_team, userId);
    }

    if (filters.assigned_to_team) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = t.assigned_to 
        AND u.role = $${++paramCount}
        AND u.managed_by = $${++paramCount}
      )`;
      params.push(filters.assigned_to_team, userId);
    }

    if (filters.unassigned_for_team) {
      whereClause += ` AND t.assigned_to IS NULL AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = t.created_by 
        AND u.role = $${++paramCount}
      )`;
      params.push(filters.unassigned_for_team);
    }

    // Debug logging for troubleshooting
    logger.info(`getTickets query - User: ${userId}, Role: ${userRole}, Filters: ${JSON.stringify(filters)}`);
    logger.info(`getTickets WHERE clause: ${whereClause}`);
    logger.info(`getTickets params: ${JSON.stringify(params)}`);

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM tickets t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Pagination (default to 25 per page for free tier optimization)
    const limit = filters.limit || 25;
    const offset = filters.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;

    const ticketsResult = await query(
      `SELECT t.*, 
        u.name as creator_name, 
        u.email as creator_email,
        u.role as creator_role,
        a.name as assignee_name,
        at.name as assigned_to_name
       FROM tickets t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users a ON t.current_assignee = a.id
       LEFT JOIN users at ON t.assigned_to = at.id
       WHERE ${whereClause}
       ORDER BY 
         CASE t.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END,
         t.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset]
    );

    return {
      tickets: ticketsResult.rows,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const result = await query(
      `SELECT t.*, 
        u.name as creator_name, 
        u.email as creator_email,
        u.role as creator_role,
        a.name as assignee_name,
        at.name as assigned_to_name
       FROM tickets t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users a ON t.current_assignee = a.id
       LEFT JOIN users at ON t.assigned_to = at.id
       WHERE t.ticket_number = $1`,
      [ticketNumber]
    );

    return result.rows[0] || null;
  }

  async updateTicket(ticketNumber: string, data: UpdateTicketDTO, userId: string, userRole?: string): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const ticket = await this.getTicketByNumber(ticketNumber);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      // Admins can update any field
      if (data.brand_name !== undefined) {
        updates.push(`brand_name = $${++paramCount}`);
        params.push(data.brand_name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${++paramCount}`);
        params.push(data.description);
      }
      if (data.issue_type !== undefined) {
        updates.push(`issue_type = $${++paramCount}`);
        // Issue type is now already a label
        params.push(data.issue_type);
      }
      if (data.expected_output !== undefined) {
        updates.push(`expected_output = $${++paramCount}`);
        params.push(data.expected_output);
      }
      if (data.priority !== undefined) {
        updates.push(`priority = $${++paramCount}`);
        params.push(data.priority);
      }
      if (data.current_assignee !== undefined) {
        updates.push(`current_assignee = $${++paramCount}`);
        params.push(data.current_assignee);
      }

      if (updates.length === 0) {
        await client.query('COMMIT');
        return ticket;
      }

      updates.push(`updated_at = now()`);
      params.push(ticketNumber);

      const result = await client.query(
        `UPDATE tickets SET ${updates.join(', ')} WHERE ticket_number = $${++paramCount} RETURNING *`,
        params
      );

      // Log activity
      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, payload, created_at)
         VALUES ($1, $2, 'updated', 'Ticket updated', $3, now())`,
        [ticket.id, userId, JSON.stringify(data)]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resolveTicket(ticketNumber: string, data: ResolveTicketDTO, userId: string): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const ticket = await this.getTicketByNumber(ticketNumber);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      if (ticket.status !== 'open' && ticket.status !== 're-opened') {
        throw new AppError('Can only resolve tickets with status "open" or "re-opened"', 400);
      }

      // Determine if this is the first resolution or an updated resolution after reopen
      const isFirstResolution = ticket.status === 'open';
      
      let result;
      if (isFirstResolution) {
        // First resolution: set both primary_resolution_remarks and resolution_remarks
        result = await client.query(
          `UPDATE tickets 
           SET status = 'processed', 
               primary_resolution_remarks = $1,
               resolution_remarks = $1, 
               current_assignee = $2,
               last_status_change_at = now(),
               updated_at = now()
           WHERE ticket_number = $3
           RETURNING *`,
          [data.remarks, userId, ticketNumber]
        );
      } else {
        // Updated resolution after reopen: only update resolution_remarks, keep primary_resolution_remarks
        result = await client.query(
          `UPDATE tickets 
           SET status = 'processed', 
               resolution_remarks = $1, 
               current_assignee = $2,
               last_status_change_at = now(),
               updated_at = now()
           WHERE ticket_number = $3
           RETURNING *`,
          [data.remarks, userId, ticketNumber]
        );
      }

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, payload, created_at)
         VALUES ($1, $2, 'resolution_added', $3, $4, now())`,
        [ticket.id, userId, data.remarks, JSON.stringify({ attachments: data.attachments || [] })]
      );

      await client.query('COMMIT');
      logger.info(`Ticket ${isFirstResolution ? 'resolved' : 'updated resolution'}: ${ticketNumber} by user ${userId}`);
      
      // TODO: Send notification to ticket creator
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reopenTicket(ticketNumber: string, data: ReopenTicketDTO, userId: string): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const ticket = await this.getTicketByNumber(ticketNumber);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      if (ticket.status !== 'processed') {
        throw new AppError('Can only reopen tickets with status "processed"', 400);
      }

      const result = await client.query(
        `UPDATE tickets 
         SET status = 're-opened', 
             reopen_reason = $1,
             last_status_change_at = now(),
             updated_at = now()
         WHERE ticket_number = $2
         RETURNING *`,
        [data.reason, ticketNumber]
      );

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
         VALUES ($1, $2, 'reopened', $3, now())`,
        [ticket.id, userId, data.reason]
      );

      await client.query('COMMIT');
      logger.info(`Ticket reopened: ${ticketNumber} by user ${userId}`);
      
      // TODO: Send notification to assignee
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async closeTicket(ticketNumber: string, userId: string, acceptanceRemarks?: string): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const ticket = await this.getTicketByNumber(ticketNumber);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      if (ticket.status !== 'processed') {
        throw new AppError('Can only close tickets with status "processed"', 400);
      }

      const result = await client.query(
        `UPDATE tickets 
         SET status = 'resolved',
             acceptance_remarks = $2,
             resolved_at = now(),
             last_status_change_at = now(),
             updated_at = now()
         WHERE ticket_number = $1
         RETURNING *`,
        [ticketNumber, acceptanceRemarks || null]
      );

      const activityComment = acceptanceRemarks 
        ? `Ticket accepted and closed. Remarks: ${acceptanceRemarks}`
        : 'Ticket accepted and closed';

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
         VALUES ($1, $2, 'closed', $3, now())`,
        [ticket.id, userId, activityComment]
      );

      await client.query('COMMIT');
      logger.info(`Ticket closed: ${ticketNumber} by user ${userId}`);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTicketActivities(ticketNumber: string) {
    const ticket = await this.getTicketByNumber(ticketNumber);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    const result = await query(
      `SELECT ta.*, u.name as actor_name, u.email as actor_email
       FROM ticket_activities ta
       LEFT JOIN users u ON ta.actor_id = u.id
       WHERE ta.ticket_id = $1
       ORDER BY ta.created_at ASC`,
      [ticket.id]
    );

    return result.rows;
  }

  async assignTicket(ticketNumber: string, assignedTo: string, assignedBy: string, notes?: string): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const ticket = await this.getTicketByNumber(ticketNumber);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Check if this is a reassignment (ticket already has someone assigned)
      const isReassignment = ticket.assigned_to !== null;
      const previousAssignee = ticket.assigned_to;

      // Get previous assignee name if reassigning
      let previousAssigneeName = 'Unassigned';
      if (isReassignment && previousAssignee) {
        const prevUserResult = await client.query(
          'SELECT name, email FROM users WHERE id = $1',
          [previousAssignee]
        );
        if (prevUserResult.rows.length > 0) {
          previousAssigneeName = `${prevUserResult.rows[0].name} (${prevUserResult.rows[0].email})`;
        }
      }

      // Verify assigned user exists and is active
      const userResult = await client.query(
        'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
        [assignedTo]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('Assigned user not found', 404);
      }

      const assignedUser = userResult.rows[0];

      if (!assignedUser.is_active) {
        throw new AppError('Cannot assign to inactive user', 400);
      }

      // Update ticket
      const result = await client.query(
        `UPDATE tickets 
         SET assigned_to = $1, 
             updated_at = now()
         WHERE ticket_number = $2
         RETURNING *`,
        [assignedTo, ticketNumber]
      );

      // Log assignment in ticket_assignments table
      await client.query(
        `INSERT INTO ticket_assignments (ticket_id, assigned_by, assigned_to, notes, assigned_at)
         VALUES ($1, $2, $3, $4, now())`,
        [ticket.id, assignedBy, assignedTo, notes || null]
      );

      // Log activity with appropriate action and comment
      const action = isReassignment ? 'reassigned' : 'assigned';
      const activityComment = isReassignment
        ? (notes 
            ? `Reassigned from ${previousAssigneeName} to ${assignedUser.name} (${assignedUser.email}). Notes: ${notes}`
            : `Reassigned from ${previousAssigneeName} to ${assignedUser.name} (${assignedUser.email})`)
        : (notes 
            ? `Assigned to ${assignedUser.name} (${assignedUser.email}). Notes: ${notes}`
            : `Assigned to ${assignedUser.name} (${assignedUser.email})`);

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [ticket.id, assignedBy, action, activityComment]
      );

      await client.query('COMMIT');
      logger.info(`Ticket ${ticketNumber} ${isReassignment ? 'reassigned' : 'assigned'} to ${assignedUser.email} by ${assignedBy}`);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const ticketService = new TicketService();
