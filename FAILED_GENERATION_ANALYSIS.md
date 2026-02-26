# Failed Generation Analysis - Issue Report

## Database Analysis (Record 2403)

```sql
-- Failed Generation Example
id: 2403
session_id: '88e8cad6-150b-4594-b324-2249204554c9'
user_id: 2
phone_model: 'Oppo A15s'
case_type: 'transparent'
original_image_name: '1.JPG'
original_image_url: '/uploads/casetool/88e8cad6-150b-4594-b324-2249204554c9_1772085513975_1.JPG'
ai_prompt: NULL ❌
generated_image_url: NULL ❌
generation_time: NULL
status: 'failed' ❌
created_at: '2026-02-26 05:58:33'
updated_at: '2026-02-26 06:03:56'
```

## Problem #1: Why NULL is Happening

### Root Cause
Generation is failing at the **ANALYSIS STEP** (before image generation):

**Generation Flow:**
1. ✅ Upload image → SUCCESS (original_image_url saved)
2. ❌ Analyze case with Gemini Text Model → **FAILS HERE**
3. ⛔ Never reaches image generation
4. ⛔ ai_prompt remains NULL
5. ⛔ generated_image_url remains NULL
6. ⛔ status set to 'failed'

### Code Location
File: `app/casetool/api/generate/route.ts`

```typescript
// Line 476-479: Error handler only updates status
catch (error: any) {
  if (logId) {
    await pool.execute(
      'UPDATE generation_logs SET status = ? WHERE id = ?',
      ['failed', logId]
    );
  }
  // ⚠️ Problem: No error message saved!
  // ⚠️ Problem: ai_prompt is NULL
}
```

### Why Analysis Fails
Common reasons:
- ❌ Gemini API rate limit exceeded
- ❌ Image too large/corrupted for analysis
- ❌ Gemini safety filters triggered
- ❌ Network timeout
- ❌ Invalid API key or quota exceeded

**No error details are saved in database!**

---

## Problem #2: Why Not Showing in Net-Billing

### Root Cause
Net-billing pulls from `api_usage_logs` table, but failed generations DON'T create entries there.

### Billing Flow
```
generation_logs (always created)
    ↓
[Analysis Step with Text Model]
    ↓
api_usage_logs (text_analysis) ← Created if analysis succeeds
    ↓
[Image Generation Step]
    ↓
api_usage_logs (image_generation) ← Created if generation succeeds
    ↓
download_billing_logs (only if downloaded)
```

### Net-Billing Query Logic
File: `app/casetool/api/net-billing/route.ts` (Lines 83-105)

```typescript
// Net-billing ONLY shows entries from api_usage_logs
SELECT ...
FROM api_usage_logs aul  ← ⚠️ REQUIRES api_usage_logs entry
JOIN users u ON aul.user_id = u.id
LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
WHERE aul.operation_type = 'image_generation'
```

**Problem:** If generation fails BEFORE image generation API call:
- ❌ No `api_usage_logs` entry created
- ❌ Nothing to show in net-billing
- ❌ Failed generation is invisible

---

## Problem #3: Missing Error Information

### Current State
When generation fails, we lose critical debugging info:

**What's Saved:**
- ✅ original_image_url
- ✅ status = 'failed'

**What's MISSING:**
- ❌ Error message
- ❌ Which step failed (analysis? generation? cropping?)
- ❌ API error details
- ❌ Timestamp when failure occurred

### Impact
- **Users don't know why it failed**
- **Admin can't debug issues**
- **No way to refund/track failed attempts**
- **Appears as if nothing happened**

---

## Solutions

### Solution 1: Save Error Details
Add `error_message` column to `generation_logs`:

```sql
ALTER TABLE generation_logs 
ADD COLUMN error_message TEXT DEFAULT NULL AFTER status;
```

Update error handler:
```typescript
catch (error: any) {
  if (logId) {
    await pool.execute(
      'UPDATE generation_logs SET status = ?, error_message = ? WHERE id = ?',
      ['failed', error.message || 'Unknown error', logId]
    );
  }
}
```

### Solution 2: Show Failed Generations in Net-Billing
Change query to pull from `generation_logs` instead of `api_usage_logs`:

```typescript
// Show ALL generations (including failed)
SELECT
  gl.id,
  gl.user_id,
  gl.phone_model,
  gl.case_type,
  gl.status,
  gl.error_message,
  gl.created_at,
  u.email,
  COALESCE(aul.cost_inr, 0) as cost,
  CASE WHEN dbl.id IS NOT NULL THEN 1 ELSE 0 END as is_downloaded
FROM generation_logs gl
JOIN users u ON gl.user_id = u.id
LEFT JOIN api_usage_logs aul ON aul.generation_log_id = gl.id
LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
ORDER BY gl.created_at DESC
```

### Solution 3: Track Failed Attempts
Create separate failed attempts counter:

```typescript
// Add to summary
const summaryQuery = `
  SELECT 
    COUNT(DISTINCT gl.id) as total_attempts,
    COUNT(DISTINCT CASE WHEN gl.status = 'completed' THEN gl.id END) as successful_generations,
    COUNT(DISTINCT CASE WHEN gl.status = 'failed' THEN gl.id END) as failed_generations,
    ...
  FROM generation_logs gl
  ...
`;
```

---

## Immediate Actions Required

### 1. Check Why Generations Are Failing
Run this query to see error patterns:

```sql
-- Check all failed generations
SELECT 
  id,
  phone_model,
  case_type,
  created_at,
  updated_at,
  CASE 
    WHEN ai_prompt IS NULL THEN 'Failed during analysis'
    WHEN generated_image_url IS NULL THEN 'Failed during image generation'
    ELSE 'Unknown failure'
  END as failure_point
FROM generation_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Check Gemini API Logs
- Check server logs for Gemini API errors
- Verify API key is valid
- Check quota/rate limits

### 3. Test with Same Image
Try generating with the same image (1.JPG) to reproduce error:
- User ID: 2
- Phone: Oppo A15s
- Case Type: transparent

---

## Current Statistics from Database

```
Total Generations: 19 records (2385-2403)
Failed: 8 records (42% failure rate! ⚠️)
Successful: 11 records (58%)

Failed Records:
- 2389: Redmi Note 13 5G (transparent) - analysis failed
- 2391: Redmi Note 13 5G (transparent) - analysis failed
- 2392: Samsung Galaxy A32 (transparent) - analysis failed
- 2393: OnePlus 10 Pro 5G (transparent) - analysis failed
- 2394: OnePlus 10 Pro 5G (transparent) - analysis failed
- 2395: Oppo Realme 11X 5G (transparent) - analysis failed
- 2397: Oppo A15s (transparent) - analysis failed
- 2398: Oppo A15s (matte) - analysis failed
- 2399: Oppo A15s (transparent) - analysis failed (user 14)
- 2400: Oppo A15s (transparent) - analysis failed (user 14)
- 2403: Oppo A15s (transparent) - analysis failed (5min timeout)
```

**Pattern:** All failures are during analysis step (ai_prompt is NULL)

---

## Recommended Fix Priority

### HIGH PRIORITY
1. ✅ Add error_message column
2. ✅ Update error handler to save error details
3. ✅ Show failed generations in net-billing with status indicator

### MEDIUM PRIORITY
4. Add retry logic for failed analysis
5. Increase timeout for analysis step
6. Add better error messages to user

### LOW PRIORITY
7. Add email notifications for failed generations
8. Create admin dashboard for failed attempts

---

## Expected Behavior After Fix

### User Experience
- ✅ User sees "Generation failed: [reason]"
- ✅ User can retry without confusion
- ✅ Failed attempts appear in billing with ₹0 cost

### Admin Experience
- ✅ See all attempts (success + failed) in net-billing
- ✅ Filter by status (completed/failed)
- ✅ View error messages for debugging
- ✅ Track failure rate and patterns

### Database
- ✅ All generations logged (success + failure)
- ✅ Error messages saved for debugging
- ✅ Clear status tracking
- ✅ Complete audit trail
