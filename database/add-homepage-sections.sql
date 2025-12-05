-- Create homepage_sections table to manage section headings

CREATE TABLE IF NOT EXISTS homepage_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_key (section_key),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default sections
INSERT INTO homepage_sections (section_key, title, subtitle, icon, sort_order) VALUES
('custom_cases', 'Our Custom Designed Cases', 'Exclusive designs you won''t find anywhere else', '🌸', 0),
('device_categories', 'Our Categories', 'Find the perfect case for your device', '🌺', 1);

-- Add section_key to categories table to link categories to sections
ALTER TABLE categories 
ADD COLUMN section_key VARCHAR(50) DEFAULT NULL AFTER parent_id,
ADD INDEX idx_section_key (section_key);

-- Set section_key based on sort_order (0-7 = custom_cases, 8+ = device_categories)
UPDATE categories 
SET section_key = 'custom_cases' 
WHERE parent_id IS NULL AND sort_order < 8;

UPDATE categories 
SET section_key = 'device_categories' 
WHERE parent_id IS NULL AND sort_order >= 8;
