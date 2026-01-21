-- Check what columns exist in products table
DESCRIBE products;

-- Check what columns exist in product_categories table  
DESCRIBE product_categories;

-- Show some sample data to see if products table still has sort_order
SELECT id, name, sort_order FROM products LIMIT 10;

-- Show category-specific sort orders
SELECT 
    p.id,
    p.name as product_name,
    c.name as category_name,
    pc.sort_order as category_sort_order
FROM product_categories pc
JOIN products p ON pc.product_id = p.id
JOIN categories c ON pc.category_id = c.id
WHERE c.name = 'Silicon Cases'
ORDER BY pc.sort_order
LIMIT 20;
