# Net Billing Report Feature

## Overview
The Net Billing Report is a comprehensive admin dashboard that displays detailed billing information for all users in the casetool. It provides insights into API usage, costs, and models used across all email IDs.

## Features

### 1. **Summary Statistics**
- Total Users: Count of all registered users
- Total Operations: Sum of all API operations performed
- Total Cost (USD): Overall cost in US dollars
- Total Cost (INR): Overall cost in Indian rupees
- Total Tokens: Combined input and output tokens used
- Total Images: Combined input and output images processed

### 2. **User Billing Details Table**
Displays per-user billing information with the following columns:
- **Email ID**: User's email address (searchable)
- **Total Operations**: Number of API calls made
- **Text Analysis**: Count of text analysis operations
- **Image Generation**: Count of image generation operations
- **Image Enhancement**: Count of image enhancement/4K processing operations
- **Tokens Used**: Total input + output tokens consumed
- **Images Used**: Total input + output images processed
- **Cost (USD)**: Amount in US dollars
- **Cost (INR)**: Amount in Indian rupees
- **Last Activity**: Timestamp of the last API call

### 3. **Model Usage Breakdown**
Detailed breakdown of API models used:
- **Model Name**: Name of the Gemini model used
- **Operation Type**: Type of operation (text_analysis, image_generation, image_enhancement)
- **Count**: Number of times this model was used for this operation
- **Total Cost (USD)**: Total cost for this model-operation combination
- **Total Cost (INR)**: Total cost in INR for this model-operation combination
- **Avg Cost per Operation**: Average cost per single operation

### 4. **Filtering & Sorting**
- **Search**: Filter users by email ID (real-time search)
- **Sort Options**:
  - Total Cost (Highest First) - Default
  - Operations (Most First)
  - Email (A-Z)

### 5. **Export Feature**
- **Export to CSV**: Download the entire report including:
  - Summary statistics
  - User billing details
  - Model usage breakdown
  - Timestamp of export

## Access & Permissions

The Net Billing Report is **admin-only**. Access is restricted to users with the following:
- Valid authentication (casetool_user_id cookie)
- Admin role (casetool_user_role = 'admin')

**Access URLs:**
- Frontend: `/casetool/net-billing`
- API: `/casetool/api/net-billing`

## Database Tables Used

### `api_usage_logs`
Tracks all API usage with the following relevant fields:
- `user_id` - Links to the user
- `model_name` - Gemini model used
- `operation_type` - Type of operation (text_analysis, image_generation, image_enhancement)
- `input_tokens`, `output_tokens` - Token counts
- `input_images`, `output_images` - Image counts
- `cost_usd`, `cost_inr` - Calculated costs
- `created_at` - Timestamp of operation

### `users`
User authentication table:
- `id` - User ID
- `email` - User's email address

### `pricing_config` (Referenced)
Contains pricing information for different models

## API Response Format

### Request
```
GET /casetool/api/net-billing
```

### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_users": 10,
      "total_operations": 150,
      "total_cost_usd": 125.45,
      "total_cost_inr": 10474.575,
      "total_tokens": 500000,
      "total_images": 250
    },
    "userBilling": [
      {
        "user_id": 1,
        "email": "user@example.com",
        "total_operations": 50,
        "text_analysis_count": 20,
        "image_generation_count": 25,
        "image_enhancement_count": 5,
        "total_tokens": 150000,
        "total_images": 50,
        "total_cost_usd": 45.50,
        "total_cost_inr": 3796.75,
        "last_activity": "2026-01-23T10:30:00Z"
      }
    ],
    "modelUsage": [
      {
        "model_name": "gemini-2.0-flash",
        "operation_type": "text_analysis",
        "count": 50,
        "total_cost_usd": 20.00,
        "total_cost_inr": 1670.00,
        "avg_cost_per_operation": 0.4
      }
    ]
  }
}
```

## Implementation Details

### Frontend (`app/casetool/net-billing/page.tsx`)
- Client-side React component with Next.js
- Features filtering, sorting, and CSV export functionality
- Responsive design supporting mobile, tablet, and desktop views
- Gradient background with styled cards and tables
- Loading and error states

### Styling (`app/casetool/net-billing/net-billing.module.css`)
- Modern gradient design (purple gradient theme)
- Responsive grid layout for summary cards
- Scrollable table for detailed information
- Mobile-optimized with breakpoints at 768px and 480px
- Hover effects and smooth transitions

### API Route (`app/casetool/api/net-billing/route.ts`)
- Built with Next.js App Router
- MySQL database queries using mysql2/promise
- Admin-only access control
- Three main queries:
  1. Summary statistics aggregation
  2. Per-user billing details with operation type breakdown
  3. Model usage breakdown by operation type
- Proper error handling and response formatting

## Navigation

The Net Billing Report is accessible from:
1. **Main Navigation Menu**: Account → Net Billing Report
2. **Direct URL**: `/casetool/net-billing`

## Future Enhancements

Potential improvements:
1. Date range filtering (by month, custom range)
2. Per-category cost breakdown
3. Charts and graphs visualization (pie charts, bar charts)
4. Email-based detailed reports
5. Cost trend analysis over time
6. Budget alerts and thresholds
7. User-specific drill-down views
8. Advanced filters (date range, operation type, model)
9. Scheduled report generation and email delivery
10. Performance metrics and efficiency analytics

## Troubleshooting

### "Unauthorized: Admin access required"
- Ensure you're logged in as an admin user
- Check that `casetool_user_role` cookie is set to 'admin'

### "Failed to fetch net billing data"
- Verify the API route is properly deployed
- Check database connection and credentials
- Ensure `api_usage_logs` table exists and has data

### Tables showing no data
- Verify API usage logs are being recorded in the database
- Check that users have performed API operations
- Confirm the timestamp fields are populated correctly
