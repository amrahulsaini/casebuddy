-- Migration to remove feedback system
-- Run this on your production database

-- Step 1: Drop the user_feedback table (if exists)
DROP TABLE IF EXISTS user_feedback;

-- Step 2: Remove feedback columns from generation_logs
ALTER TABLE generation_logs 
  DROP COLUMN IF EXISTS user_feedback,
  DROP COLUMN IF EXISTS feedback_note;

-- Step 3: Remove feedback columns from generation_stats
ALTER TABLE generation_stats
  DROP COLUMN IF EXISTS approved_count,
  DROP COLUMN IF EXISTS rejected_count;

-- Verify the changes
DESCRIBE generation_logs;
DESCRIBE generation_stats;
