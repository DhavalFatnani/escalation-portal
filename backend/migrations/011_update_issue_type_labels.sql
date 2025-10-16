-- Update issue_type column to store user-friendly labels instead of enum values
-- This migration changes the database constraint to allow the corrected labels

-- Step 1: Remove the old enum constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_issue_type_check;

-- Step 2: Add new constraint that allows the user-friendly labels
ALTER TABLE tickets ADD CONSTRAINT tickets_issue_type_check 
CHECK (issue_type IS NULL OR issue_type IN (
  'Product Not Live After Return',
  'GRN Discrepancy', 
  'Physical Product vs SKU Mismatch',
  'Other'
));

-- Step 3: Update existing records to use the new labels
UPDATE tickets SET issue_type = 'Product Not Live After Return' 
WHERE issue_type = 'product_not_as_listed';

UPDATE tickets SET issue_type = 'GRN Discrepancy' 
WHERE issue_type = 'giant_discrepancy_brandless_inverterless';

UPDATE tickets SET issue_type = 'Physical Product vs SKU Mismatch' 
WHERE issue_type = 'physical_vs_scale_mismatch';

UPDATE tickets SET issue_type = 'Other' 
WHERE issue_type = 'other';

-- Step 4: Log the migration
INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
SELECT 
  NULL as ticket_id,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as actor_id,
  'schema_migration' as action,
  'Updated issue_type column to store user-friendly labels instead of enum values' as comment,
  now() as created_at
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin');
