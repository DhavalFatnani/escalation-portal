-- Migration: Initial Schema for Escalation Portal
-- Description: Creates users, tickets, ticket_activities, and attachments tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL CHECK (role IN ('growth', 'ops', 'admin')),
  password_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  created_by uuid REFERENCES users(id) NOT NULL,
  brand_name text NOT NULL,
  description text,
  issue_type text CHECK (issue_type IN (
    'product_not_as_listed',
    'giant_discrepancy_brandless_inverterless',
    'physical_vs_scale_mismatch',
    'other'
  )),
  expected_output text,
  priority text NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'processed', 'resolved', 're-opened', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_status_change_at timestamptz DEFAULT now(),
  current_assignee uuid REFERENCES users(id),
  resolved_at timestamptz,
  resolution_remarks text,
  reopen_reason text
);

CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_brand_name ON tickets(brand_name);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_current_assignee ON tickets(current_assignee);

-- Ticket activities table (audit trail)
CREATE TABLE ticket_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  comment text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_created_at ON ticket_activities(created_at DESC);

-- Attachments table
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);

-- Ticket number sequence table (for daily sequential numbering)
CREATE TABLE ticket_sequences (
  date_key text PRIMARY KEY,
  sequence_number integer NOT NULL DEFAULT 0
);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number(prefix text)
RETURNS text AS $$
DECLARE
  v_date_key text;
  seq_num integer;
  ticket_num text;
BEGIN
  v_date_key := to_char(current_date, 'YYYYMMDD');
  
  -- Upsert sequence
  INSERT INTO ticket_sequences (date_key, sequence_number)
  VALUES (v_date_key, 1)
  ON CONFLICT (date_key)
  DO UPDATE SET sequence_number = ticket_sequences.sequence_number + 1
  RETURNING sequence_number INTO seq_num;
  
  ticket_num := prefix || '-' || v_date_key || '-' || lpad(seq_num::text, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Full-text search setup for tickets
ALTER TABLE tickets ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION tickets_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.ticket_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_search_vector_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION tickets_search_vector_update();

CREATE INDEX idx_tickets_search_vector ON tickets USING gin(search_vector);

-- Comments: Separate table for ticket comments/discussions
CREATE TABLE ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) NOT NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
