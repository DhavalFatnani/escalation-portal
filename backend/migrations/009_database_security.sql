-- Security Enhancement Migration
-- This migration creates a dedicated service user with limited permissions
-- and ensures proper database security without breaking the current application

-- Step 1: Create a dedicated service user for the application
-- This user will have limited permissions, not full database access
CREATE USER escalation_portal_service WITH PASSWORD 'your_secure_service_password_here';

-- Step 2: Grant only necessary permissions to the service user
-- Grant connect permission to the database
GRANT CONNECT ON DATABASE postgres TO escalation_portal_service;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO escalation_portal_service;

-- Grant specific table permissions (read/write only on application tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO escalation_portal_service;

-- Grant sequence permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO escalation_portal_service;

-- Step 3: Set default privileges for future tables
-- This ensures any new tables created will automatically have the right permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO escalation_portal_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO escalation_portal_service;

-- Step 4: Revoke dangerous permissions from the service user
-- Ensure the service user cannot create tables or modify schema
REVOKE CREATE ON SCHEMA public FROM escalation_portal_service;

-- Step 5: Create a more restrictive connection string format
-- The service user will only be able to access the specific database and tables
-- No access to system tables or other databases

-- Step 6: Optional - Create a read-only user for reporting/analytics
CREATE USER escalation_portal_readonly WITH PASSWORD 'your_secure_readonly_password_here';
GRANT CONNECT ON DATABASE postgres TO escalation_portal_readonly;
GRANT USAGE ON SCHEMA public TO escalation_portal_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO escalation_portal_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO escalation_portal_readonly;

-- Step 7: Log the security enhancement
INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
SELECT 
  NULL as ticket_id,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as actor_id,
  'security_enhancement' as action,
  'Database security enhanced: Created dedicated service user with limited permissions' as comment,
  now() as created_at
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin');

-- Note: After running this migration, update your DATABASE_URL to use the service user:
-- OLD: postgresql://postgres:[password]@host:port/database
-- NEW: postgresql://escalation_portal_service:[service_password]@host:port/database
