-- Migration: Update OTP system to approval workflow
-- Description: Change OTP system from admin-generated to peer-approval workflow

-- Drop old OTP management approach
DROP TABLE IF EXISTS deletion_otps CASCADE;

-- Create new deletion_requests table for approval workflow
CREATE TABLE deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id uuid REFERENCES attachments(id) ON DELETE CASCADE NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES users(id) NOT NULL,
  requester_reason text NOT NULL,
  requester_role text NOT NULL CHECK (requester_role IN ('growth', 'ops', 'admin')),
  approver_role text NOT NULL CHECK (approver_role IN ('growth', 'ops', 'admin')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  otp_code text,
  otp_expires_at timestamptz,
  rejection_reason text,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX idx_deletion_requests_approver_role ON deletion_requests(approver_role);
CREATE INDEX idx_deletion_requests_requester_id ON deletion_requests(requester_id);
CREATE INDEX idx_deletion_requests_attachment_id ON deletion_requests(attachment_id);
CREATE INDEX idx_deletion_requests_otp_code ON deletion_requests(otp_code);

-- Keep the OTP generation function
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS text AS $$
BEGIN
  RETURN lpad(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_deletion_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deletion_requests_updated_at
  BEFORE UPDATE ON deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_deletion_request_timestamp();

-- Function to determine approver role based on requester role and ticket
CREATE OR REPLACE FUNCTION get_approver_role(p_requester_role text, p_ticket_created_by uuid)
RETURNS text AS $$
DECLARE
  creator_role text;
BEGIN
  -- Get the role of ticket creator
  SELECT role INTO creator_role FROM users WHERE id = p_ticket_created_by;
  
  -- If requester is growth, approver should be ops (unless ticket creator is growth, then ops approves)
  -- If requester is ops, approver should be growth (ticket creator)
  -- Admin can be approved by either
  
  IF p_requester_role = 'growth' THEN
    RETURN 'ops';
  ELSIF p_requester_role = 'ops' THEN
    RETURN 'growth';
  ELSE
    -- Admin requests can be approved by growth or ops
    IF creator_role = 'growth' THEN
      RETURN 'growth';
    ELSE
      RETURN 'ops';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

