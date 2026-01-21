-- CRITICAL: Remove sort_order from products table
-- This will force the system to ONLY use category-specific sort orders

-- Step 1: Verify product_categories has sort_order (safety check)
SELECT COUNT(*) as has_sort_order_column
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'product_categories' 
  AND COLUMN_NAME = 'sort_order';
-- This should return 1. If it returns 0, DO NOT proceed!

-- Step 2: Remove sort_order from products table
ALTER TABLE products DROP COLUMN sort_order;

-- Step 3: Remove the index if it exists
ALTER TABLE products DROP INDEX IF EXISTS idx_sort_order;

-- Step 4: Verify it's gone
DESCRIBE products;

-- Done! Now the system MUST use product_categories.sort_order
