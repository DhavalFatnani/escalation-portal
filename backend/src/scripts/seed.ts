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

    // Create users
    const users = [
      { email: 'growth@example.com', name: 'Growth User', role: 'growth', password: growthPassword },
      { email: 'ops@example.com', name: 'Ops User', role: 'ops', password: opsPassword },
      { email: 'admin@example.com', name: 'Admin User', role: 'admin', password: adminPassword },
    ];

    for (const user of users) {
      await query(
        `INSERT INTO users (email, name, role, password_hash) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash`,
        [user.email, user.name, user.role, user.password]
      );
      logger.info(`User created/updated: ${user.email}`);
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
