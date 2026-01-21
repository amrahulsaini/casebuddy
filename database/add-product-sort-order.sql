-- Add sort_order column to products table
-- This allows controlling the display order of products within categories

ALTER TABLE products 
ADD COLUMN sort_order INT DEFAULT 0 AFTER stock_quantity;

-- Add index for better query performance
ALTER TABLE products 
ADD INDEX idx_sort_order (sort_order);

-- Set initial sort order based on creation date (oldest = 1, newest = highest number)
SET @row_number = 0;
UPDATE products 
SET sort_order = (@row_number:=@row_number + 1)
ORDER BY created_at ASC;
