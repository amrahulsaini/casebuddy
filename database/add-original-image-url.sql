-- Add original image URL to generation logs
-- This stores the public URL for the user-uploaded image so the gallery can show it.

ALTER TABLE generation_logs
  ADD COLUMN original_image_url VARCHAR(500) NULL AFTER original_image_name;
