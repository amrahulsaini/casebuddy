-- API Usage and Pricing Tracking

-- Create API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  generation_log_id INT DEFAULT NULL,
  model_name VARCHAR(100) NOT NULL,
  operation_type ENUM('text_analysis', 'image_generation', 'image_enhancement') NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  input_images INT DEFAULT 0,
  output_images INT DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
  cost_inr DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_generation_log (generation_log_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generation_log_id) REFERENCES generation_logs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pricing configuration table
CREATE TABLE IF NOT EXISTS pricing_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL UNIQUE,
  input_text_price_per_1m DECIMAL(10, 6) DEFAULT 0.000000,
  input_image_price DECIMAL(10, 6) DEFAULT 0.000000,
  output_text_price_per_1m DECIMAL(10, 6) DEFAULT 0.000000,
  output_image_price DECIMAL(10, 6) DEFAULT 0.000000,
  output_image_4k_price DECIMAL(10, 6) DEFAULT 0.000000,
  usd_to_inr_rate DECIMAL(10, 4) DEFAULT 83.5000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert pricing data
INSERT INTO pricing_config (
  model_name, 
  input_image_price, 
  output_text_price_per_1m, 
  output_image_price, 
  output_image_4k_price
) VALUES 
  ('gemini-2.0-flash', 0.10, 0.40, 0.039, 0.039),
  ('gemini-2.5-flash-image', 0.30, 0.00, 0.039, 0.039),
  ('gemini-3-pro-image-preview', 0.0011, 12.00, 0.134, 0.24)
ON DUPLICATE KEY UPDATE
  input_image_price = VALUES(input_image_price),
  output_text_price_per_1m = VALUES(output_text_price_per_1m),
  output_image_price = VALUES(output_image_price),
  output_image_4k_price = VALUES(output_image_4k_price);

-- Create user billing summary view
CREATE OR REPLACE VIEW user_billing_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  COUNT(DISTINCT aul.generation_log_id) AS total_generations,
  SUM(CASE WHEN aul.operation_type = 'text_analysis' THEN 1 ELSE 0 END) AS text_analysis_count,
  SUM(CASE WHEN aul.operation_type = 'image_generation' THEN 1 ELSE 0 END) AS image_generation_count,
  SUM(CASE WHEN aul.operation_type = 'image_enhancement' THEN 1 ELSE 0 END) AS image_enhancement_count,
  SUM(aul.cost_usd) AS total_cost_usd,
  SUM(aul.cost_inr) AS total_cost_inr,
  MAX(aul.created_at) AS last_usage_date
FROM users u
LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
GROUP BY u.id, u.email;
