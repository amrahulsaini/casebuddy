-- Add design addon feature to products
-- This allows admin to enable "Right Design / Left Design" addon option for specific products

ALTER TABLE products 
ADD COLUMN design_addon_enabled BOOLEAN DEFAULT FALSE COMMENT 'Enable design position addon (Right/Left)';

-- Add index for quick filtering
CREATE INDEX idx_design_addon ON products(design_addon_enabled);
