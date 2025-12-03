# API Usage Tracking & Billing System Implementation

## Overview
Implemented a comprehensive API usage tracking and billing system that logs every API call made to Gemini AI models and calculates costs in both USD and INR based on official Gemini API pricing.

## Database Changes

### 1. New Tables Created

#### `api_usage_logs`
Tracks every API operation with detailed cost information:
- `user_id` - Links to users table
- `generation_log_id` - Links to generation_logs (NULL for editor enhancements)
- `model_name` - Which Gemini model was used
- `operation_type` - ENUM: 'text_analysis', 'image_generation', 'image_enhancement'
- `input_images`, `output_images` - Image counts
- `input_tokens`, `output_tokens` - Token counts (for text operations)
- `cost_usd`, `cost_inr` - Calculated costs
- `created_at` - Timestamp

#### `pricing_config`
Stores current pricing rates for each model:
- Gemini 2.0 Flash: $0.10/input image, $0.40/1M output tokens
- Gemini 2.5 Flash Image: $0.30/input image, $0.039/output image
- Gemini 3 Pro Image: $0.0011/input image, $0.24/4K output image
- USD to INR conversion rate: 83.5

#### `user_billing_summary` (VIEW)
Aggregated view showing per-user totals:
- Total generations, operation counts by type
- Total costs in USD and INR
- Last usage date

### 2. Migration Files
- `database/add-pricing-tracking.sql` - Creates all tables and inserts pricing data

## Code Changes

### 1. Pricing Utility (`lib/pricing.ts`)
Created comprehensive pricing calculation system:

**Key Functions:**
- `PRICING` - Constant object with all model pricing structures
- `calculateCost(usage)` - Calculates USD and INR costs based on input/output counts
- `logAPIUsage(userId, generationLogId, usage)` - Logs usage to database with calculated costs

**Pricing Logic:**
- Text analysis: Input image cost + (output tokens / 1,000,000) * output token rate
- Image generation: Input image cost + output image cost
- 4K enhancement: Input image cost + 4K output image cost

### 2. Generate Route Updates (`app/casetool/api/generate/route.ts`)
Added usage logging for both API calls:

**After Text Analysis (Line ~120):**
```typescript
await logAPIUsage(userId, logId, {
  modelName: TEXT_MODEL,
  operationType: 'text_analysis',
  inputImages: 1,
  outputImages: 0,
  outputTokens: rawText.length / 4, // Estimate: 1 token ≈ 4 chars
});
```

**After Image Generation (Line ~220):**
```typescript
await logAPIUsage(userId, logId, {
  modelName: IMAGE_MODEL,
  operationType: 'image_generation',
  inputImages: 1,
  outputImages: 1,
});
```

### 3. Enhancement Route Updates (`app/editor/api/enhance/route.ts`)
Added usage logging for 4K enhancement:

**After Sharp Processing (Line ~95):**
```typescript
const userId = cookieStore.get('casetool_user_id')?.value;
if (userId) {
  await logAPIUsage(parseInt(userId), null, {
    modelName: 'gemini-3-pro-image-preview',
    operationType: 'image_enhancement',
    inputImages: 1,
    outputImages: 1,
  });
}
```

### 4. Billing Dashboard (`app/casetool/billing/`)
Created complete billing UI with:

**Page Features (`page.tsx`):**
- Summary cards showing total operations, USD cost, INR cost
- Detailed usage history table with all API calls
- Formatted dates, operation labels, model names
- Real-time cost display with color-coded amounts

**Styling (`billing.module.css`):**
- Modern dark theme matching app design
- Gradient orange accents
- Responsive table layout
- Hover effects and transitions
- Mobile-friendly design with horizontal scroll

### 5. Billing API Route (`app/casetool/api/billing/route.ts`)
GET endpoint that returns:
- Last 100 usage log entries for the user
- Aggregated summary (total operations, total costs)
- Authenticated via `casetool_user_id` cookie

### 6. Navigation Update (`app/casetool/page.tsx`)
Added "Usage & Billing" link to sidebar navigation:
- New "Account" section
- Zap icon for billing link
- Routes to `/casetool/billing`

## Cost Tracking Flow

### Generation Flow (2 API calls)
1. **Text Analysis Call:**
   - Model: gemini-2.0-flash
   - Input: 1 image ($0.10)
   - Output: ~500 tokens ($0.0002)
   - Total: ~$0.1002 (~₹8.37)

2. **Image Generation Call:**
   - Model: gemini-2.5-flash-image
   - Input: 1 image ($0.30)
   - Output: 1 image ($0.039)
   - Total: $0.339 (₹28.31)

**Per Generation Total: ~$0.44 (₹36.74)**

### Enhancement Flow (1 API call)
1. **4K Upscaling:**
   - Model: gemini-3-pro-image-preview
   - Input: 1 image ($0.0011)
   - Output: 1 4K image ($0.24)
   - Total: $0.2411 (₹20.13)

## User Workflow

1. **Login** → Enter password
2. **Email Capture** → Enter email (first time)
3. **Generate Cases** → Each generation logs 2 API calls
4. **Enhance Images** → Each enhancement logs 1 API call
5. **View Billing** → Click "Usage & Billing" in sidebar
6. **See Costs** → Summary cards + detailed history table

## Testing Steps

### 1. Deploy Database Schema
```bash
mysql -u root -p < database/add-pricing-tracking.sql
```

### 2. Test Generation Flow
1. Navigate to `/casetool`
2. Upload case image and phone model
3. Generate mockup
4. Check database:
   ```sql
   SELECT * FROM api_usage_logs ORDER BY id DESC LIMIT 2;
   ```
   Should see 2 entries: text_analysis + image_generation

### 3. Test Enhancement Flow
1. Navigate to `/editor`
2. Upload an image
3. Click "Enhance to 4K"
4. Check database:
   ```sql
   SELECT * FROM api_usage_logs WHERE operation_type = 'image_enhancement' ORDER BY id DESC LIMIT 1;
   ```
   Should see 1 entry with model_name 'gemini-3-pro-image-preview'

### 4. Test Billing Dashboard
1. Navigate to `/casetool/billing`
2. Verify summary cards show correct totals
3. Verify usage history table shows all operations
4. Check USD and INR amounts are calculated correctly

### 5. Verify Multi-User Separation
1. Login as User A, generate 2 mockups
2. Logout, login as User B, generate 1 mockup
3. Check User A's billing: should show only 2 generations
4. Check User B's billing: should show only 1 generation

## Cost Estimates (Per User)

### Light Usage (10 generations/month)
- 10 generations × $0.44 = $4.40 (₹367.40)
- 5 enhancements × $0.24 = $1.20 (₹100.20)
- **Monthly Total: $5.60 (₹467.60)**

### Medium Usage (50 generations/month)
- 50 generations × $0.44 = $22.00 (₹1,837.00)
- 25 enhancements × $0.24 = $6.00 (₹501.00)
- **Monthly Total: $28.00 (₹2,338.00)**

### Heavy Usage (200 generations/month)
- 200 generations × $0.44 = $88.00 (₹7,348.00)
- 100 enhancements × $0.24 = $24.00 (₹2,004.00)
- **Monthly Total: $112.00 (₹9,352.00)**

## Future Enhancements

### Immediate Priorities
1. Add CSV export for usage logs
2. Add date range filters to billing dashboard
3. Add cost alerts when user exceeds threshold
4. Add monthly billing summaries (by month view)

### Long-term Features
1. Admin panel to view all users' usage
2. Usage quotas and limits per user
3. Payment integration for prepaid credits
4. Detailed analytics charts (daily/weekly/monthly trends)
5. Model performance metrics (generation time vs cost)

## Files Modified/Created

### Created Files
- `lib/pricing.ts` - Pricing calculation utilities
- `database/add-pricing-tracking.sql` - Database migration
- `app/casetool/billing/page.tsx` - Billing dashboard UI
- `app/casetool/billing/billing.module.css` - Dashboard styling
- `app/casetool/api/billing/route.ts` - Billing API endpoint

### Modified Files
- `app/casetool/api/generate/route.ts` - Added usage logging (2 calls)
- `app/editor/api/enhance/route.ts` - Added usage logging (1 call)
- `app/casetool/page.tsx` - Added billing link to navigation

## Notes

- All costs are calculated in real-time during API operations
- Token estimation for text output: 1 token ≈ 4 characters
- Editor enhancements have NULL generation_log_id (standalone operations)
- Billing dashboard shows last 100 operations (can be increased)
- Database indexes on user_id, generation_log_id, created_at for fast queries
- Cascade delete: If user deleted, all their usage logs are deleted
- SET NULL on generation_log delete: Preserves cost data even if generation deleted
