-- Migration: Add OTP system for file deletion verification
-- Description: Create table to store OTPs that admins generate for file deletion approval

-- Create deletion_otps table
CREATE TABLE deletion_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  otp_code text NOT NULL,
  attachment_id uuid REFERENCES attachments(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('attachment_deletion', 'ticket_deletion')),
  reference_id text, -- Can store ticket_number or attachment_id as string for flexible use
  generated_by uuid REFERENCES users(id) NOT NULL,
  used boolean DEFAULT false,
  used_by uuid REFERENCES users(id),
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deletion_otps_otp_code ON deletion_otps(otp_code);
CREATE INDEX idx_deletion_otps_expires_at ON deletion_otps(expires_at);
CREATE INDEX idx_deletion_otps_used ON deletion_otps(used);

-- Function to generate random 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS text AS $$
BEGIN
  RETURN lpad(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired OTPs (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM deletion_otps 
  WHERE expires_at < now() 
    OR (used = true AND used_at < now() - interval '1 day');
END;
$$ LANGUAGE plpgsql;

