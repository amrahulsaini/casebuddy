-- Check if sort_order column exists in product_categories table
SHOW COLUMNS FROM product_categories;

-- If the column doesn't exist, you'll see an error or it won't be in the list
-- Then run the migration file: migrate-sort-order-to-category-specific.sql

-- To test if sort_order is working correctly, run this query:
SELECT 
  p.name as product_name,
  c.name as category_name,
  pc.sort_order
FROM product_categories pc
INNER JOIN products p ON pc.product_id = p.id
INNER JOIN categories c ON pc.category_id = c.id
ORDER BY c.name, pc.sort_order;

-- This will show you all products with their category-specific sort orders
