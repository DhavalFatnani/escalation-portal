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

export class TicketService {
  async createTicket(userId: string, data: CreateTicketDTO): Promise<Ticket> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Generate ticket number
      const ticketNumberResult = await client.query(
        "SELECT generate_ticket_number('GROW') as ticket_number"
      );
      const ticketNumber = ticketNumberResult.rows[0].ticket_number;

      // Insert ticket
      const ticketResult = await client.query(
        `INSERT INTO tickets 
        (ticket_number, created_by, brand_name, description, issue_type, expected_output, priority, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', now(), now())
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
         VALUES ($1, $2, 'created', 'Ticket created', now())`,
        [ticket.id, userId]
      );

      await client.query('COMMIT');
      logger.info(`Ticket created: ${ticketNumber} by user ${userId}`);
      
      return ticket;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating ticket:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTickets(filters: TicketFilters, userId?: string, userRole?: string): Promise<{ tickets: Ticket[]; total: number }> {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Role-based filtering
    if (userRole === 'growth' && userId) {
      whereClause += ` AND t.created_by = $${++paramCount}`;
      params.push(userId);
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

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM tickets t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get tickets
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const ticketsResult = await query(
      `SELECT t.*, 
        u.name as creator_name, 
        u.email as creator_email,
        a.name as assignee_name
       FROM tickets t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users a ON t.current_assignee = a.id
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
    };
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const result = await query(
      `SELECT t.*, 
        u.name as creator_name, 
        u.email as creator_email,
        a.name as assignee_name
       FROM tickets t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users a ON t.current_assignee = a.id
       WHERE t.ticket_number = $1`,
      [ticketNumber]
    );

    return result.rows[0] || null;
  }

  async updateTicket(ticketNumber: string, data: UpdateTicketDTO, userId: string): Promise<Ticket> {
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

      const result = await client.query(
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

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, payload, created_at)
         VALUES ($1, $2, 'resolution_added', $3, $4, now())`,
        [ticket.id, userId, data.remarks, JSON.stringify({ attachments: data.attachments || [] })]
      );

      await client.query('COMMIT');
      logger.info(`Ticket resolved: ${ticketNumber} by user ${userId}`);
      
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

  async closeTicket(ticketNumber: string, userId: string): Promise<Ticket> {
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
             resolved_at = now(),
             last_status_change_at = now(),
             updated_at = now()
         WHERE ticket_number = $1
         RETURNING *`,
        [ticketNumber]
      );

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
         VALUES ($1, $2, 'closed', 'Ticket marked as resolved', now())`,
        [ticket.id, userId]
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
}

export const ticketService = new TicketService();
