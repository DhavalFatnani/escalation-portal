-- Migration: Add upload_context to attachments
-- Description: Add upload_context column to track which stage of the ticket lifecycle a file belongs to

ALTER TABLE attachments 
ADD COLUMN upload_context text CHECK (upload_context IN ('initial', 'resolution', 'reopen', 'additional'));

-- Set existing attachments context based on timing with activities
-- This is a one-time data migration for existing records
DO $$
DECLARE
  att RECORD;
  ticket_created_time timestamptz;
  first_resolution_time timestamptz;
  reopen_time timestamptz;
BEGIN
  FOR att IN SELECT * FROM attachments WHERE upload_context IS NULL
  LOOP
    -- Get ticket creation time
    SELECT created_at INTO ticket_created_time
    FROM tickets WHERE id = att.ticket_id;
    
    -- Check if it's an initial upload (within 2 minutes of ticket creation)
    IF ticket_created_time IS NOT NULL AND 
       ABS(EXTRACT(EPOCH FROM (att.created_at - ticket_created_time))) < 120 THEN
      UPDATE attachments SET upload_context = 'initial' WHERE id = att.id;
      CONTINUE;
    END IF;
    
    -- Check for first resolution
    SELECT ta.created_at INTO first_resolution_time
    FROM ticket_activities ta
    WHERE ta.ticket_id = att.ticket_id 
      AND ta.action IN ('resolution_added', 'status_changed_to_processed')
    ORDER BY ta.created_at ASC
    LIMIT 1;
    
    IF first_resolution_time IS NOT NULL AND
       att.created_at < first_resolution_time AND
       ABS(EXTRACT(EPOCH FROM (first_resolution_time - att.created_at))) < 120 THEN
      UPDATE attachments SET upload_context = 'resolution' WHERE id = att.id;
      CONTINUE;
    END IF;
    
    -- Check for reopen
    SELECT ta.created_at INTO reopen_time
    FROM ticket_activities ta
    WHERE ta.ticket_id = att.ticket_id 
      AND ta.action IN ('reopened', 'status_changed_to_open')
    ORDER BY ta.created_at ASC
    LIMIT 1;
    
    IF reopen_time IS NOT NULL AND
       att.created_at < reopen_time AND
       ABS(EXTRACT(EPOCH FROM (reopen_time - att.created_at))) < 120 THEN
      UPDATE attachments SET upload_context = 'reopen' WHERE id = att.id;
      CONTINUE;
    END IF;
    
    -- Default to additional
    UPDATE attachments SET upload_context = 'additional' WHERE id = att.id;
  END LOOP;
END $$;

-- Make upload_context NOT NULL with default 'additional'
ALTER TABLE attachments 
ALTER COLUMN upload_context SET DEFAULT 'additional',
ALTER COLUMN upload_context SET NOT NULL;

CREATE INDEX idx_attachments_upload_context ON attachments(upload_context);

