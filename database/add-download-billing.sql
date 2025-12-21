-- Download-based billing
-- Billing is recorded only when a user downloads a generated image.

CREATE TABLE IF NOT EXISTS download_billing_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  generation_log_id INT NOT NULL,
  amount_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_generation_log (generation_log_id),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generation_log_id) REFERENCES generation_logs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
