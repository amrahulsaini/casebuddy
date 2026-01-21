-- Reset all product sort orders to sequential numbers within each category
-- This will make products numbered 1, 2, 3, 4... within each category

-- Step 1: Create a temporary table with proper sort orders
CREATE TEMPORARY TABLE temp_sort_orders AS
SELECT 
  pc.product_id,
  pc.category_id,
  (@row_num := IF(@current_cat = pc.category_id, @row_num + 1, 1)) as new_sort_order,
  @current_cat := pc.category_id as dummy
FROM product_categories pc
CROSS JOIN (SELECT @row_num := 0, @current_cat := NULL) vars
ORDER BY pc.category_id, pc.product_id;

-- Step 2: Update product_categories with the new sort orders
UPDATE product_categories pc
INNER JOIN temp_sort_orders tso 
  ON pc.product_id = tso.product_id 
  AND pc.category_id = tso.category_id
SET pc.sort_order = tso.new_sort_order;

-- Step 3: Clean up
DROP TEMPORARY TABLE temp_sort_orders;

-- Verify the results
SELECT 
  c.name as category_name,
  p.name as product_name,
  pc.sort_order
FROM product_categories pc
INNER JOIN products p ON pc.product_id = p.id
INNER JOIN categories c ON pc.category_id = c.id
ORDER BY c.name, pc.sort_order
LIMIT 50;
