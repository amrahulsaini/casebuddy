-- Add mobile column to admin_users table for OTP-based 2FA login
-- Sends OTP only to this registered mobile via 2factor.in

ALTER TABLE admin_users
  ADD COLUMN mobile VARCHAR(15) NULL AFTER email;

-- Set admin mobile number (the only number that will receive login OTPs)
UPDATE admin_users
SET mobile = '9351608911'
WHERE role = 'admin';
