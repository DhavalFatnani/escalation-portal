-- Migration: Add Manager and Assignment System
-- Description: Adds manager flags, active status, and ticket assignment capabilities

-- Add manager flag and active status to users
ALTER TABLE users ADD COLUMN is_manager BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN managed_by UUID REFERENCES users(id); -- Manager who oversees this user
ALTER TABLE users ADD COLUMN auto_assign_enabled BOOLEAN DEFAULT FALSE; -- For managers

-- Add assignment fields to tickets
ALTER TABLE tickets ADD COLUMN assigned_to UUID REFERENCES users(id); -- Teammate assigned
ALTER TABLE tickets ADD COLUMN reviewed_by_manager UUID REFERENCES users(id); -- Manager who reviewed
ALTER TABLE tickets ADD COLUMN manager_notes TEXT; -- Internal manager notes

-- Create ticket assignments history table
CREATE TABLE ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES users(id) NOT NULL,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_ticket_assignments_ticket_id ON ticket_assignments(ticket_id);
CREATE INDEX idx_ticket_assignments_assigned_to ON ticket_assignments(assigned_to);
CREATE INDEX idx_users_is_manager ON users(is_manager);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_managed_by ON users(managed_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_reviewed_by_manager ON tickets(reviewed_by_manager);

