-- Add case_type column to generation_logs table
-- This tracks which case type (transparent, black, doyers, matte) was selected

ALTER TABLE generation_logs 
ADD COLUMN case_type VARCHAR(50) DEFAULT 'transparent' AFTER phone_model;

-- Add index for faster queries
CREATE INDEX idx_case_type ON generation_logs(case_type);
