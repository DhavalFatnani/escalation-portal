-- Migration: Add Acceptance Remarks
-- Description: Add acceptance_remarks field to store remarks when Growth/Ops accepts and closes a ticket

-- Add acceptance_remarks column to tickets table
ALTER TABLE tickets 
ADD COLUMN acceptance_remarks text;

-- Add comment explaining the field
COMMENT ON COLUMN tickets.acceptance_remarks IS 'Remarks added by the ticket creator when accepting and closing the ticket (resolved status)';

