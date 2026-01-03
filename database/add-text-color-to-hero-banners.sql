-- Add text_color column to hero_banners table for customizable text colors
ALTER TABLE hero_banners 
ADD COLUMN text_color VARCHAR(20) DEFAULT '#ffffff' AFTER gradient;

-- Update existing banners to have white text color (default)
UPDATE hero_banners SET text_color = '#ffffff' WHERE text_color IS NULL;
