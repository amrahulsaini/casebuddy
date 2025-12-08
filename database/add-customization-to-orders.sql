-- Add customization_data column to orders table to store custom text, font, placement
ALTER TABLE orders ADD COLUMN customization_data TEXT NULL AFTER notes;
