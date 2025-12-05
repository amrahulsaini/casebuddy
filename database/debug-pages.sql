-- Debug queries to check your pages and sections

-- 1. Check all pages
SELECT id, page_key, page_name, slug, is_active 
FROM pages;

-- 2. Check all sections and which page they belong to
SELECT 
  s.id,
  s.page_id,
  s.section_key,
  s.title,
  s.is_active,
  p.page_name
FROM homepage_sections s
LEFT JOIN pages p ON s.page_id = p.id
ORDER BY s.page_id, s.sort_order;

-- 3. Check sections without page_id (orphaned sections)
SELECT 
  id,
  section_key,
  title,
  is_active
FROM homepage_sections
WHERE page_id IS NULL;

-- 4. If you have orphaned sections, link them to a page:
-- UPDATE homepage_sections 
-- SET page_id = (SELECT id FROM pages WHERE page_key = 'your-page-key')
-- WHERE id = YOUR_SECTION_ID;

-- 5. Check categories and their sections
SELECT 
  c.id,
  c.name,
  c.section_key,
  s.title as section_title,
  s.page_id,
  p.page_name
FROM categories c
LEFT JOIN homepage_sections s ON c.section_key = s.section_key
LEFT JOIN pages p ON s.page_id = p.id
WHERE c.parent_id IS NULL
ORDER BY p.page_name, s.sort_order, c.sort_order;
