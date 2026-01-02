-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NULL,
  email_type VARCHAR(50) NOT NULL COMMENT 'order_confirmation, tracking_update, delivery_notification, etc.',
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status ENUM('sent', 'failed') DEFAULT 'sent',
  error_message TEXT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_email_type (email_type),
  INDEX idx_sent_at (sent_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
