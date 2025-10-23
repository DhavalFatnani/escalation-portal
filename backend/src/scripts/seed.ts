import bcrypt from 'bcrypt';
import { query, getClient } from '../config/database';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Starting database seed...');

  try {
    // Hash passwords for each role
    const growthPassword = await bcrypt.hash('growth123', 10);
    const opsPassword = await bcrypt.hash('ops123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create users with manager hierarchy
    const users = [
      // Admin
      { email: 'admin@example.com', name: 'Admin User', role: 'admin', password: adminPassword, is_manager: false, is_active: true, managed_by: null },
      
      // Growth Team
      { email: 'growth-manager@example.com', name: 'Growth Manager', role: 'growth', password: growthPassword, is_manager: true, is_active: true, managed_by: null },
      { email: 'growth-member1@example.com', name: 'Sarah Johnson', role: 'growth', password: growthPassword, is_manager: false, is_active: true, managed_by: null }, // Will be set after manager is created
      { email: 'growth-member2@example.com', name: 'Mike Chen', role: 'growth', password: growthPassword, is_manager: false, is_active: true, managed_by: null },
      
      // Ops Team
      { email: 'ops-manager@example.com', name: 'Ops Manager', role: 'ops', password: opsPassword, is_manager: true, is_active: true, managed_by: null },
      { email: 'ops-member1@example.com', name: 'John Smith', role: 'ops', password: opsPassword, is_manager: false, is_active: true, managed_by: null },
      { email: 'ops-member2@example.com', name: 'Lisa Wong', role: 'ops', password: opsPassword, is_manager: false, is_active: true, managed_by: null },
      
      // Legacy users (for backward compatibility)
      { email: 'growth@example.com', name: 'Growth User', role: 'growth', password: growthPassword, is_manager: false, is_active: true, managed_by: null },
      { email: 'ops@example.com', name: 'Ops User', role: 'ops', password: opsPassword, is_manager: false, is_active: true, managed_by: null },
    ];

    // First pass: Create all users
    for (const user of users) {
      await query(
        `INSERT INTO users (email, name, role, password_hash, is_manager, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, is_manager = EXCLUDED.is_manager, is_active = EXCLUDED.is_active`,
        [user.email, user.name, user.role, user.password, user.is_manager, user.is_active]
      );
      logger.info(`User created/updated: ${user.email}`);
    }

    // Get manager IDs
    const growthManagerResult = await query('SELECT id FROM users WHERE email = $1', ['growth-manager@example.com']);
    const opsManagerResult = await query('SELECT id FROM users WHERE email = $1', ['ops-manager@example.com']);
    
    const growthManagerId = growthManagerResult.rows[0]?.id;
    const opsManagerId = opsManagerResult.rows[0]?.id;

    // Second pass: Set managed_by relationships
    if (growthManagerId) {
      await query(
        `UPDATE users SET managed_by = $1 WHERE email IN ($2, $3, $4)`,
        [growthManagerId, 'growth-member1@example.com', 'growth-member2@example.com', 'growth@example.com']
      );
      logger.info('Growth team members linked to Growth Manager');
    }

    if (opsManagerId) {
      await query(
        `UPDATE users SET managed_by = $1 WHERE email IN ($2, $3, $4)`,
        [opsManagerId, 'ops-member1@example.com', 'ops-member2@example.com', 'ops@example.com']
      );
      logger.info('Ops team members linked to Ops Manager');
    }

    // Get growth and ops user IDs
    const growthUser = await query('SELECT id FROM users WHERE email = $1', ['growth@example.com']);
    const opsUser = await query('SELECT id FROM users WHERE email = $1', ['ops@example.com']);

    if (growthUser.rows.length === 0 || opsUser.rows.length === 0) {
      throw new Error('Failed to find users');
    }

    const growthUserId = growthUser.rows[0].id;
    const opsUserId = opsUser.rows[0].id;

    // Create sample tickets
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Ticket 1: Open urgent ticket
      const ticket1Number = await client.query("SELECT generate_ticket_number('GROW') as ticket_number");
      const ticket1 = await client.query(
        `INSERT INTO tickets (ticket_number, created_by, brand_name, description, issue_type, expected_output, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          ticket1Number.rows[0].ticket_number,
          growthUserId,
          'Acme Corporation',
          'Product images showing wrong specifications. Customer reported inverter not matching scale level data.',
          'Product Not Live After Return',
          'images, scale_level_with_remarks',
          'urgent',
          'open',
        ]
      );

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment)
         VALUES ($1, $2, 'created', 'Initial ticket creation')`,
        [ticket1.rows[0].id, growthUserId]
      );

      logger.info(`Sample ticket created: ${ticket1Number.rows[0].ticket_number}`);

      // Ticket 2: Processed ticket
      const ticket2Number = await client.query("SELECT generate_ticket_number('GROW') as ticket_number");
      const ticket2 = await client.query(
        `INSERT INTO tickets (ticket_number, created_by, brand_name, description, issue_type, expected_output, priority, status, current_assignee, resolution_remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          ticket2Number.rows[0].ticket_number,
          growthUserId,
          'TechBrand Inc',
          'Giant discrepancy in product count between physical inventory and system',
          'GRN Discrepancy',
          'subunit_machine_live, scale_level_machine_with_updated_products',
          'high',
          'processed',
          opsUserId,
          'Root cause: Data sync issue during migration. Fixed database records and updated scale configurations.',
        ]
      );

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment)
         VALUES ($1, $2, 'created', 'Initial ticket creation')`,
        [ticket2.rows[0].id, growthUserId]
      );

      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment)
         VALUES ($1, $2, 'resolution_added', 'Root cause: Data sync issue during migration.')`,
        [ticket2.rows[0].id, opsUserId]
      );

      logger.info(`Sample ticket created: ${ticket2Number.rows[0].ticket_number}`);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    logger.info('✅ Database seeded successfully!');
    logger.info('\nDemo credentials:');
    logger.info('=== Managers ===');
    logger.info('Growth Manager: growth-manager@example.com / growth123');
    logger.info('Ops Manager: ops-manager@example.com / ops123');
    logger.info('=== Team Members ===');
    logger.info('Growth Member 1: growth-member1@example.com / growth123');
    logger.info('Growth Member 2: growth-member2@example.com / growth123');
    logger.info('Ops Member 1: ops-member1@example.com / ops123');
    logger.info('Ops Member 2: ops-member2@example.com / ops123');
    logger.info('=== Legacy / Admin ===');
    logger.info('Growth: growth@example.com / growth123');
    logger.info('Ops: ops@example.com / ops123');
    logger.info('Admin: admin@example.com / admin123');
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
