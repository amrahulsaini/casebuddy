-- Test the EXACT query that the API uses for category pages
-- This simulates what happens when you visit /shop/silicon-cases

SELECT 
  p.id,
  p.name,
  p.slug,
  p.short_description,
  p.price,
  p.compare_price,
  p.is_featured,
  pi.image_url,
  pi.alt_text,
  c.slug AS category_slug,
  c.name AS category_name,
  pc.sort_order,
  p.sort_order as old_global_sort_order
FROM products p
INNER JOIN product_categories pc ON p.id = pc.product_id
INNER JOIN categories c ON pc.category_id = c.id AND c.slug = 'silicon-cases'
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.is_active = TRUE
ORDER BY pc.sort_order ASC, p.created_at DESC
LIMIT 20;

-- This will show you:
-- 1. The pc.sort_order (category-specific) 
-- 2. The old p.sort_order (global - should be removed)
-- Compare the two columns to see which one your products are actually using
