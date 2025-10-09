-- Migration: Add Profile Picture
-- Description: Add profile_picture column to users table for storing profile picture URL/path

-- Add profile_picture column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture text;

-- Add comment explaining the field
COMMENT ON COLUMN users.profile_picture IS 'URL or path to user profile picture';

