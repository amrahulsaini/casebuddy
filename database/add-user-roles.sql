-- Add role column to users table for casetool access control

-- Add role column to users table
ALTER TABLE users 
  ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER email,
  ADD INDEX idx_role (role);

-- Update existing users to have user role (default)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Show all users with their emails (so you can identify which user to make admin)
SELECT id, email, role, created_at, last_login FROM users ORDER BY id;

-- To make a specific user admin, uncomment and run one of these:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
-- UPDATE users SET role = 'admin' WHERE id = 1;

-- Or make ALL users admin (only for testing!):
-- UPDATE users SET role = 'admin';
