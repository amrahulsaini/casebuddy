-- Migrate sort_order from products table to product_categories table (category-specific)

-- Step 1: Add sort_order to product_categories junction table
ALTER TABLE product_categories 
ADD COLUMN sort_order INT DEFAULT 0 AFTER category_id;

-- Step 2: Add index for better query performance
ALTER TABLE product_categories 
ADD INDEX idx_sort_order (sort_order);

-- Step 3: Migrate existing sort_order values from products to product_categories
-- Copy the sort_order from products to all their category relationships
UPDATE product_categories pc
INNER JOIN products p ON pc.product_id = p.id
SET pc.sort_order = p.sort_order;

-- Step 4: Remove sort_order column from products table (optional - only if you want to clean up)
-- ALTER TABLE products DROP COLUMN sort_order;
-- ALTER TABLE products DROP INDEX idx_sort_order;
