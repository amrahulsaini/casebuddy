-- CaseTool Database Schema
-- Run these queries in your MySQL/MariaDB database

-- Create logs table for tracking image generation
CREATE TABLE IF NOT EXISTS generation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  phone_model VARCHAR(255) NOT NULL,
  original_image_name VARCHAR(255) NOT NULL,
  ai_prompt TEXT,
  generated_image_url VARCHAR(500),
  generation_time DECIMAL(10,2),
  status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create stats table for analytics
CREATE TABLE IF NOT EXISTS generation_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_generations INT DEFAULT 0,
  successful_generations INT DEFAULT 0,
  failed_generations INT DEFAULT 0,
  avg_generation_time DECIMAL(10,2),
  UNIQUE KEY unique_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
