-- ===================================================================
-- DIAGNOSTIC QUERIES: Why images not showing in net-billing
-- Run these on your server to diagnose the issue
-- ===================================================================

-- Query 1: Check successful generations (should have images)
SELECT 
  id,
  user_id,
  phone_model,
  case_type,
  status,
  original_image_url,
  generated_image_url,
  created_at
FROM generation_logs
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should show 11 successful generations with image URLs

-- ===================================================================

-- Query 2: Check if api_usage_logs entries exist for successful generations
SELECT 
  aul.id,
  aul.generation_log_id,
  aul.operation_type,
  aul.model_name,
  aul.cost_inr,
  gl.status,
  gl.phone_model,
  gl.generated_image_url
FROM api_usage_logs aul
LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
WHERE aul.operation_type = 'image_generation'
ORDER BY aul.created_at DESC
LIMIT 10;

-- Expected: Should show entries for each successful generation
-- If EMPTY = Problem! api_usage_logs not being created

-- ===================================================================

-- Query 3: Check what net-billing query actually returns
SELECT
  aul.id,
  aul.user_id,
  aul.generation_log_id,
  aul.cost_inr as amount_inr,
  aul.created_at,
  aul.model_name,
  u.email,
  gl.phone_model,
  gl.case_type,
  gl.original_image_url,
  gl.generated_image_url,
  CASE WHEN dbl.id IS NOT NULL THEN 1 ELSE 0 END as is_downloaded,
  dbl.created_at as download_date
FROM api_usage_logs aul
JOIN users u ON aul.user_id = u.id
LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
WHERE aul.operation_type = 'image_generation'
ORDER BY aul.created_at DESC
LIMIT 10;

-- This is the EXACT query net-billing uses
-- If EMPTY = No images will show

-- ===================================================================

-- Query 4: Check ALL generations (to see full picture)
SELECT 
  gl.id,
  gl.user_id,
  gl.phone_model,
  gl.case_type,
  gl.status,
  gl.original_image_url IS NOT NULL as has_original,
  gl.generated_image_url IS NOT NULL as has_generated,
  EXISTS(SELECT 1 FROM api_usage_logs WHERE generation_log_id = gl.id) as has_api_log,
  gl.created_at
FROM generation_logs gl
ORDER BY gl.created_at DESC
LIMIT 20;

-- Shows which generations have images and api_usage_logs entries

-- ===================================================================

-- Query 5: Find the disconnect - successful generations WITHOUT api_usage_logs
SELECT 
  gl.id,
  gl.user_id,
  gl.phone_model,
  gl.status,
  gl.generated_image_url,
  gl.created_at
FROM generation_logs gl
WHERE gl.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM api_usage_logs aul 
  WHERE aul.generation_log_id = gl.id 
  AND aul.operation_type = 'image_generation'
)
ORDER BY gl.created_at DESC;

-- If this returns rows = BUG! Successful generations not logged in api_usage_logs
-- This is why images don't show in net-billing

-- ===================================================================
-- EXPECTED RESULTS
-- ===================================================================

-- If api_usage_logs is EMPTY for completed generations:
-- CAUSE: logAPIUsage() not being called or failing silently
-- FIX: Check app/casetool/api/generate/route.ts line 449-456

-- If api_usage_logs has entries but net-billing shows nothing:
-- CAUSE: Query WHERE clause filtering them out
-- FIX: Check operation_type values match 'image_generation'

-- If generation_logs shows completed but no images:
-- CAUSE: generated_image_url is NULL despite status='completed'
-- FIX: Check image saving logic in generate route

-- ===================================================================
