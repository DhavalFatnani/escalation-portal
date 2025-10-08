-- Migration: Seed Initial Data
-- Description: Creates sample users for development

-- Note: In production, use proper password hashing
-- These passwords are bcrypt hashed: growth123, ops123, admin123
-- Hash generated with: bcrypt.hash('password', 10)

INSERT INTO users (email, name, role, password_hash) VALUES
  ('growth@example.com', 'Growth User', 'growth', '$2b$10$rQZ9vXqGXxGxGxGxGxGxGe9YqKqKqKqKqKqKqKqKqKqKqKqKqKqK'),
  ('ops@example.com', 'Ops User', 'ops', '$2b$10$rQZ9vXqGXxGxGxGxGxGxGe9YqKqKqKqKqKqKqKqKqKqKqKqKqKqK'),
  ('admin@example.com', 'Admin User', 'admin', '$2b$10$rQZ9vXqGXxGxGxGxGxGxGe9YqKqKqKqKqKqKqKqKqKqKqKqKqKqK')
ON CONFLICT (email) DO NOTHING;

-- Sample tickets for testing
DO $$
DECLARE
  growth_user_id uuid;
  ops_user_id uuid;
  ticket_id uuid;
BEGIN
  SELECT id INTO growth_user_id FROM users WHERE email = 'growth@example.com';
  SELECT id INTO ops_user_id FROM users WHERE email = 'ops@example.com';

  -- Sample ticket 1: Open urgent ticket
  INSERT INTO tickets (
    ticket_number, created_by, brand_name, description, 
    issue_type, expected_output, priority, status
  ) VALUES (
    'GROW-' || to_char(current_date, 'YYYYMMDD') || '-0001',
    growth_user_id,
    'Acme Corporation',
    'Product images showing wrong specifications. Customer reported inverter not matching scale level data.',
    'product_not_as_listed',
    'images, scale_level_with_remarks',
    'urgent',
    'open'
  ) RETURNING id INTO ticket_id;

  INSERT INTO ticket_activities (ticket_id, actor_id, action, comment) VALUES
    (ticket_id, growth_user_id, 'created', 'Initial ticket creation');

  -- Sample ticket 2: Processed ticket awaiting growth review
  INSERT INTO tickets (
    ticket_number, created_by, brand_name, description, 
    issue_type, expected_output, priority, status, current_assignee, resolution_remarks
  ) VALUES (
    'GROW-' || to_char(current_date, 'YYYYMMDD') || '-0002',
    growth_user_id,
    'TechBrand Inc',
    'Giant discrepancy in product count between physical inventory and system',
    'giant_discrepancy_brandless_inverterless',
    'subunit_machine_live, scale_level_machine_with_updated_products',
    'high',
    'processed',
    ops_user_id,
    'Root cause: Data sync issue during migration. Fixed database records and updated scale configurations.'
  ) RETURNING id INTO ticket_id;

  INSERT INTO ticket_activities (ticket_id, actor_id, action, comment) VALUES
    (ticket_id, growth_user_id, 'created', 'Initial ticket creation'),
    (ticket_id, ops_user_id, 'resolution_added', 'Root cause: Data sync issue during migration. Fixed database records and updated scale configurations.');
END $$;
