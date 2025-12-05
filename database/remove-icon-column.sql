-- Remove icon column from homepage_sections table
-- This removes the annoying emoji icons from the system

ALTER TABLE homepage_sections DROP COLUMN IF EXISTS icon;
