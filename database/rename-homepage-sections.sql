-- Migration: Rename homepage_sections to page_sections
-- This makes the table name more accurate since it stores sections for all pages, not just homepage

-- Step 1: Rename the table
RENAME TABLE homepage_sections TO page_sections;

-- Step 2: Verify the rename was successful
SHOW TABLES LIKE 'page_sections';

-- Step 3: Show the structure to confirm
DESCRIBE page_sections;

-- Step 4: Check constraints are intact
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'page_sections'
  AND CONSTRAINT_SCHEMA = DATABASE();
