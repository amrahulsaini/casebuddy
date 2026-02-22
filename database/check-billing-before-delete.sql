-- Script to check current download billing data before deletion
-- This will help us see what data exists before we delete

USE case_tool;

-- Show total download cost
SELECT 
  COUNT(*) as total_downloads,
  SUM(amount_inr) as total_cost_inr
FROM download_billing_logs;

-- Show download logs ordered by date (oldest first)
SELECT 
  dbl.id,
  dbl.user_id,
  u.email,
  dbl.generation_log_id,
  dbl.amount_inr,
  dbl.created_at,
  gl.generated_image_url,
  gl.phone_model
FROM download_billing_logs dbl
JOIN users u ON dbl.user_id = u.id
LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
ORDER BY dbl.created_at ASC;

-- Calculate cumulative sum to find entries that sum up to 13150
SELECT 
  dbl.id,
  dbl.amount_inr,
  dbl.created_at,
  gl.generated_image_url,
  @running_total := @running_total + dbl.amount_inr AS cumulative_total
FROM download_billing_logs dbl
LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
CROSS JOIN (SELECT @running_total := 0) AS init
ORDER BY dbl.created_at ASC;
