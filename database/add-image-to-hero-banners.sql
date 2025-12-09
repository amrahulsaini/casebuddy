-- Add image_url column to hero_banners table
ALTER TABLE hero_banners 
ADD COLUMN image_url VARCHAR(255) NULL AFTER gradient;

-- Update existing banners to make gradient optional (can use image instead)
ALTER TABLE hero_banners 
MODIFY COLUMN gradient VARCHAR(255) NULL;
