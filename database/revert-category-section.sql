-- Revert the section field changes
-- We'll use parent_id hierarchy instead

ALTER TABLE categories 
DROP INDEX idx_section;

ALTER TABLE categories 
DROP COLUMN section;
