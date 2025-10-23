import { query, getClient } from '../config/database';
import { TeamMember, TeamMetrics, UserRole } from '../types';
import { logger } from '../utils/logger';

/**
 * Get team members managed by a specific manager
 */
export async function getTeamMembers(managerId: string): Promise<TeamMember[]> {
  const result = await query(
    `SELECT 
      u.id, u.email, u.name, u.role, u.is_manager, u.is_active, 
      u.managed_by, u.auto_assign_enabled, u.created_at, u.updated_at, u.last_login_at,
      COUNT(t.id) FILTER (WHERE t.status IN ('open', 'processed', 're-opened')) as active_tickets
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id
    WHERE u.managed_by = $1
    GROUP BY u.id
    ORDER BY u.name`,
    [managerId]
  );

  return result.rows;
}

/**
 * Get all team members for a specific team role (for managers)
 */
export async function getTeamMembersByRole(role: UserRole): Promise<TeamMember[]> {
  const result = await query(
    `SELECT 
      u.id, u.email, u.name, u.role, u.is_manager, u.is_active, 
      u.managed_by, u.auto_assign_enabled, u.created_at, u.updated_at, u.last_login_at,
      COUNT(t.id) FILTER (WHERE t.status IN ('open', 'processed', 're-opened')) as active_tickets
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id
    WHERE u.role = $1 AND u.is_manager = FALSE
    GROUP BY u.id
    ORDER BY u.name`,
    [role]
  );

  return result.rows;
}

/**
 * Get team performance metrics for a manager
 */
export async function getTeamMetrics(managerId: string, role: UserRole): Promise<TeamMetrics> {
  // Get team members
  const teamMembers = await getTeamMembersByRole(role);

  // Get ticket counts - Count tickets created by team members (their work output)
  const ticketStats = await query(
    `SELECT 
      COUNT(*) as total_tickets,
      COUNT(*) FILTER (WHERE t.status = 'open') as open_tickets,
      COUNT(*) FILTER (WHERE t.status = 'processed') as processed_tickets,
      COUNT(*) FILTER (WHERE t.status = 'resolved') as resolved_tickets,
      COUNT(*) FILTER (WHERE t.status = 're-opened') as reopened_tickets
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    WHERE u.role = $1 AND u.managed_by = $2`,
    [role, managerId]
  );

  // Calculate average resolution time - Use tickets created by team
  const avgResolutionResult = await query(
    `SELECT 
      AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600) as avg_hours
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    WHERE u.role = $1 AND u.managed_by = $2 AND t.resolved_at IS NOT NULL AND t.created_at >= NOW() - INTERVAL '30 days'`,
    [role, managerId]
  );

  // Calculate reopen rate - Use tickets created by team
  const reopenRateResult = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE t.status = 're-opened') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE t.status IN ('resolved', 're-opened')), 0) as reopen_rate
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    WHERE u.role = $1 AND u.managed_by = $2 AND t.created_at >= NOW() - INTERVAL '30 days'`,
    [role, managerId]
  );

  const stats = ticketStats.rows[0];

  return {
    total_tickets: parseInt(stats.total_tickets) || 0,
    open_tickets: parseInt(stats.open_tickets) || 0,
    processed_tickets: parseInt(stats.processed_tickets) || 0,
    resolved_tickets: parseInt(stats.resolved_tickets) || 0,
    avg_resolution_time_hours: parseFloat(avgResolutionResult.rows[0]?.avg_hours) || 0,
    reopen_rate: parseFloat(reopenRateResult.rows[0]?.reopen_rate) || 0,
    team_members: teamMembers,
  };
}

/**
 * Toggle user active/inactive status
 */
export async function toggleUserActive(userId: string, managerId: string): Promise<boolean> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify the manager has permission to modify this user
    const userCheck = await client.query(
      'SELECT id, is_active, managed_by, email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userCheck.rows[0];

    // Check if manager has permission (either manages this user or is admin)
    const managerResult = await client.query(
      'SELECT role, is_manager FROM users WHERE id = $1',
      [managerId]
    );

    if (managerResult.rows.length === 0) {
      throw new Error('Manager not found');
    }

    const manager = managerResult.rows[0];

    if (manager.role !== 'admin' && user.managed_by !== managerId) {
      throw new Error('Permission denied: You can only manage your own team members');
    }

    // Toggle active status
    const newStatus = !user.is_active;
    await client.query(
      'UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2',
      [newStatus, userId]
    );

    await client.query('COMMIT');

    logger.info(`User ${user.email} (${user.name}) ${newStatus ? 'activated' : 'deactivated'} by manager ${managerId}`);

    return newStatus;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Auto-assign ticket using round-robin algorithm
 */
export async function autoAssignTicket(ticketId: string, managerRole: UserRole): Promise<string> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get active team members sorted by current workload
    const teamMembers = await client.query(
      `SELECT 
        u.id,
        COUNT(t.id) FILTER (WHERE t.status IN ('open', 'processed', 're-opened')) as active_tickets
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id
      WHERE u.role = $1 AND u.is_manager = FALSE AND u.is_active = TRUE
      GROUP BY u.id
      ORDER BY active_tickets ASC, u.created_at ASC
      LIMIT 1`,
      [managerRole]
    );

    if (teamMembers.rows.length === 0) {
      throw new Error('No active team members available for assignment');
    }

    const assignedTo = teamMembers.rows[0].id;

    // Update ticket
    await client.query(
      'UPDATE tickets SET assigned_to = $1, updated_at = now() WHERE id = $2',
      [assignedTo, ticketId]
    );

    await client.query('COMMIT');

    logger.info(`Ticket ${ticketId} auto-assigned to user ${assignedTo}`);

    return assignedTo;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get unassigned tickets for a team
 */
export async function getUnassignedTickets(role: UserRole) {
  const oppositeRole = role === 'growth' ? 'ops' : 'growth';

  const result = await query(
    `SELECT 
      t.*,
      u.name as creator_name,
      u.email as creator_email,
      u.role as creator_role
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    WHERE u.role = $1 AND t.assigned_to IS NULL AND t.status != 'closed'
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC`,
    [oppositeRole]
  );

  return result.rows;
}

/**
 * Get incoming tickets for a manager (tickets needing assignment to their team)
 */
export async function getIncomingTickets(managerId: string, role: UserRole) {
  const oppositeRole = role === 'growth' ? 'ops' : 'growth';

  const result = await query(
    `SELECT 
      t.*,
      u.name as creator_name,
      u.email as creator_email,
      u.role as creator_role,
      u2.name as assigned_to_name
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE u.role = $1 AND t.status != 'closed'
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC`,
    [oppositeRole]
  );

  return result.rows;
}

/**
 * Get outgoing tickets for a manager (tickets created by their team)
 */
export async function getOutgoingTickets(managerId: string, role: UserRole) {
  const result = await query(
    `SELECT 
      t.*,
      u.name as creator_name,
      u.email as creator_email,
      u.role as creator_role,
      u2.name as assigned_to_name
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE u.role = $1 AND u.managed_by = $2 AND t.status != 'closed'
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC`,
    [role, managerId]
  );

  return result.rows;
}

/**
 * Get team workload summary for a manager
 */
export async function getTeamWorkloadSummary(managerId: string, role: UserRole) {
  const result = await query(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.is_active,
      COUNT(t.id) FILTER (WHERE t.status IN ('open', 'processed', 're-opened')) as active_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'open') as open_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'processed') as processed_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'resolved') as resolved_tickets
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id
    WHERE u.role = $1 AND u.managed_by = $2
    GROUP BY u.id, u.name, u.email, u.is_active
    ORDER BY active_tickets DESC, u.name`,
    [role, managerId]
  );

  return result.rows;
}

