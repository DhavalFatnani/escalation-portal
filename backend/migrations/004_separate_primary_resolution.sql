-- Migration: Separate Primary and Updated Resolutions
-- Description: Add primary_resolution_remarks to preserve the first resolution when ticket is reopened

-- Add new column for primary resolution
ALTER TABLE tickets 
ADD COLUMN primary_resolution_remarks text;

-- Migrate existing data: If ticket was reopened (has reopen_reason), 
-- we need to preserve the resolution history
DO $$
DECLARE
  ticket_rec RECORD;
  first_resolution_comment text;
BEGIN
  FOR ticket_rec IN 
    SELECT t.id, t.ticket_number, t.resolution_remarks, t.reopen_reason
    FROM tickets t
    WHERE t.resolution_remarks IS NOT NULL
  LOOP
    -- If ticket has a reopen_reason, it means it was reopened
    -- Try to find the first resolution from activities
    IF ticket_rec.reopen_reason IS NOT NULL THEN
      SELECT ta.comment INTO first_resolution_comment
      FROM ticket_activities ta
      WHERE ta.ticket_id = ticket_rec.id 
        AND ta.action IN ('resolution_added', 'status_changed_to_processed')
      ORDER BY ta.created_at ASC
      LIMIT 1;
      
      -- If we found a resolution in activities, extract it
      IF first_resolution_comment IS NOT NULL THEN
        -- The comment format might be just the remarks or could include "Resolved with remarks: "
        -- Try to extract the actual remarks
        UPDATE tickets 
        SET primary_resolution_remarks = COALESCE(
          NULLIF(TRIM(REGEXP_REPLACE(first_resolution_comment, '^Resolved with remarks:\s*', '', 'i')), ''),
          first_resolution_comment
        )
        WHERE id = ticket_rec.id;
      ELSE
        -- Fallback: If no activity found, assume current resolution_remarks is the primary
        -- (This shouldn't happen in normal flow, but handles edge cases)
        UPDATE tickets 
        SET primary_resolution_remarks = resolution_remarks
        WHERE id = ticket_rec.id;
      END IF;
    ELSE
      -- No reopen, so current resolution is the primary (and only) resolution
      UPDATE tickets 
      SET primary_resolution_remarks = resolution_remarks
      WHERE id = ticket_rec.id;
    END IF;
  END LOOP;
END $$;

-- Add index for performance
CREATE INDEX idx_tickets_primary_resolution ON tickets(primary_resolution_remarks) WHERE primary_resolution_remarks IS NOT NULL;

