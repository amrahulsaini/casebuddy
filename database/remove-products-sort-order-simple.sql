-- Remove global sort_order from products table
-- Run this directly in your database

ALTER TABLE products DROP COLUMN sort_order;

-- If the above gives an error about the index, run this first:
-- ALTER TABLE products DROP INDEX idx_sort_order;
-- Then run the DROP COLUMN command again
