-- Add section field to categories table
-- This allows categories to be organized into different homepage sections

ALTER TABLE categories 
ADD COLUMN section ENUM('custom_cases', 'device_categories') DEFAULT 'device_categories' AFTER parent_id;

-- Add index for faster filtering
ALTER TABLE categories 
ADD INDEX idx_section (section);

-- Update existing categories
-- First 8 categories (by sort_order) will be marked as custom_cases
UPDATE categories 
SET section = 'custom_cases' 
WHERE sort_order < 8;

UPDATE categories 
SET section = 'device_categories' 
WHERE sort_order >= 8;
