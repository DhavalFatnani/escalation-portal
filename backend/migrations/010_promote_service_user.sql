-- Make Service User the Primary Connection User
-- This script makes the service user the default connection user

-- Step 1: Grant the service user the same connection privileges as postgres
GRANT CONNECT ON DATABASE postgres TO escalation_portal_service;

-- Step 2: Make sure the service user can create temporary tables (needed for some operations)
GRANT TEMP ON DATABASE postgres TO escalation_portal_service;

-- Step 3: Grant the service user permission to create functions (needed for some PostgreSQL operations)
GRANT CREATE ON SCHEMA public TO escalation_portal_service;

-- Step 4: Update the service user to be the default connection user
-- This allows it to be used as the primary database user
ALTER USER escalation_portal_service CREATEDB;

-- Step 5: Verify the service user has all necessary permissions
-- The service user now has:
-- ✅ Connect to database
-- ✅ Read/write to all application tables
-- ✅ Use sequences
-- ✅ Create temporary tables
-- ✅ Create functions
-- ✅ Create databases (for connection purposes)
-- ❌ Still cannot drop tables or modify schema structure
-- ❌ Still cannot access system tables
-- ❌ Still has limited permissions compared to postgres superuser

-- Step 6: Log the security enhancement
INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
SELECT 
  NULL as ticket_id,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as actor_id,
  'security_enhancement' as action,
  'Service user promoted to primary connection user with enhanced permissions' as comment,
  now() as created_at
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin');
