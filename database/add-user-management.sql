-- Add user management tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add user_id to generation_logs
ALTER TABLE generation_logs 
  ADD COLUMN user_id INT DEFAULT NULL AFTER session_id,
  ADD INDEX idx_user (user_id),
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update generation_stats to track per-user stats (optional)
ALTER TABLE generation_stats
  ADD COLUMN user_id INT DEFAULT NULL AFTER date,
  ADD INDEX idx_user_date (user_id, date);
