-- ===================================================================
-- SQL QUERIES TO DELETE BILLING DATA TOTALING ₹13,150
-- Run these queries ON YOUR SERVER MySQL database
-- ===================================================================

USE case_tool;

-- ===================================================================
-- STEP 1: CHECK CURRENT DATA (READ-ONLY - SAFE TO RUN)
-- ===================================================================

-- See total current download cost
SELECT 
  COUNT(*) as total_downloads,
  SUM(amount_inr) as total_cost_inr
FROM download_billing_logs;

-- See all downloads ordered by date with cumulative sum
SELECT 
  dbl.id,
  dbl.user_id,
  u.email,
  dbl.generation_log_id,
  dbl.amount_inr,
  dbl.created_at,
  @running_total := @running_total + dbl.amount_inr AS cumulative_total,
  gl.generated_image_url,
  gl.original_image_url,
  gl.phone_model
FROM download_billing_logs dbl
JOIN users u ON dbl.user_id = u.id
LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
CROSS JOIN (SELECT @running_total := 0) AS init
ORDER BY dbl.created_at ASC;

-- ===================================================================
-- STEP 2: FIND ENTRIES TO DELETE (CUMULATIVE SUM UP TO ₹13,150)
-- ===================================================================

-- This will show you exactly which entries will be deleted
SELECT 
  dbl.id,
  dbl.user_id,
  u.email,
  dbl.amount_inr,
  dbl.created_at,
  @running_total := @running_total + dbl.amount_inr AS cumulative_total,
  gl.generated_image_url,
  gl.original_image_url
FROM download_billing_logs dbl
JOIN users u ON dbl.user_id = u.id
LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
CROSS JOIN (SELECT @running_total := 0) AS init
HAVING cumulative_total <= 13150
ORDER BY dbl.created_at ASC;

-- ===================================================================
-- STEP 3: GET LIST OF IMAGE URLS TO DELETE MANUALLY
-- Copy these URLs and delete the files from your server
-- ===================================================================

SELECT DISTINCT
  CASE 
    WHEN gl.generated_image_url IS NOT NULL THEN gl.generated_image_url
    WHEN gl.original_image_url IS NOT NULL THEN gl.original_image_url
  END as image_url
FROM (
  SELECT 
    dbl.generation_log_id,
    @running_total := @running_total + dbl.amount_inr AS cumulative_total
  FROM download_billing_logs dbl
  CROSS JOIN (SELECT @running_total := 0) AS init
  HAVING cumulative_total <= 13150
  ORDER BY dbl.created_at ASC
) AS entries_to_delete
LEFT JOIN generation_logs gl ON entries_to_delete.generation_log_id = gl.id
WHERE gl.generated_image_url IS NOT NULL OR gl.original_image_url IS NOT NULL;

-- ===================================================================
-- STEP 4: DELETE THE DATA (⚠️ DANGEROUS - BACKUP FIRST!)
-- ===================================================================

-- Create a temporary table with IDs to delete
CREATE TEMPORARY TABLE temp_delete_ids AS
SELECT 
  dbl.id as billing_id,
  dbl.generation_log_id,
  @running_total := @running_total + dbl.amount_inr AS cumulative_total
FROM download_billing_logs dbl
CROSS JOIN (SELECT @running_total := 0) AS init
HAVING cumulative_total <= 13150
ORDER BY dbl.created_at ASC;

-- Show what will be deleted
SELECT 
  COUNT(*) as total_entries,
  SUM(dbl.amount_inr) as total_amount
FROM download_billing_logs dbl
WHERE dbl.id IN (SELECT billing_id FROM temp_delete_ids);

-- Delete download_billing_logs entries
DELETE FROM download_billing_logs 
WHERE id IN (SELECT billing_id FROM temp_delete_ids);

-- Delete orphaned generation_logs (those with no remaining downloads)
DELETE FROM generation_logs 
WHERE id IN (
  SELECT generation_log_id FROM temp_delete_ids
)
AND NOT EXISTS (
  SELECT 1 FROM download_billing_logs 
  WHERE generation_log_id = generation_logs.id
);

-- Clean up temp table
DROP TEMPORARY TABLE temp_delete_ids;

-- ===================================================================
-- STEP 5: VERIFY DELETION
-- ===================================================================

-- Check remaining download cost
SELECT 
  COUNT(*) as remaining_downloads,
  SUM(amount_inr) as remaining_cost_inr
FROM download_billing_logs;

-- ===================================================================
-- NOTES:
-- 1. BACKUP YOUR DATABASE BEFORE RUNNING STEP 4!
-- 2. After running these queries, you need to manually delete image files
-- 3. Image files are in: /home/your-user/casetool/public/uploads/casetool/
-- 4. Use the URLs from STEP 3 to find and delete the files
-- 5. Or use the Node.js script (cleanup-billing-on-server.js) to automate
-- ===================================================================
