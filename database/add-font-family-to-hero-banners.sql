-- Add font_family column to hero_banners table for customizable fonts
ALTER TABLE hero_banners 
ADD COLUMN font_family VARCHAR(100) DEFAULT 'Inter, sans-serif' AFTER text_color;

-- Update existing banners to have default font
UPDATE hero_banners SET font_family = 'Inter, sans-serif' WHERE font_family IS NULL;
