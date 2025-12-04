# Image Feedback & Refund System - SQL Setup

## Run these SQL queries on your server:

```sql
-- Add feedback columns to generation_logs table
ALTER TABLE generation_logs 
ADD COLUMN user_id INT DEFAULT NULL AFTER session_id,
ADD COLUMN feedback_status ENUM('pending', 'accurate', 'inaccurate') DEFAULT 'pending' AFTER status,
ADD COLUMN feedback_comment TEXT DEFAULT NULL AFTER feedback_status,
ADD COLUMN feedback_at TIMESTAMP NULL DEFAULT NULL AFTER feedback_comment,
ADD COLUMN is_refunded BOOLEAN DEFAULT FALSE AFTER feedback_at,
ADD COLUMN refund_amount_inr DECIMAL(10, 2) DEFAULT 0.00 AFTER is_refunded,
ADD INDEX idx_user (user_id),
ADD INDEX idx_feedback_status (feedback_status),
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add is_billable column to api_usage_logs
ALTER TABLE api_usage_logs
ADD COLUMN is_billable BOOLEAN DEFAULT TRUE AFTER cost_inr,
ADD INDEX idx_billable (is_billable);

-- Update the billing summary view to exclude non-billable usage
DROP VIEW IF EXISTS user_billing_summary;
CREATE VIEW user_billing_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  COUNT(DISTINCT aul.generation_log_id) AS total_generations,
  COUNT(DISTINCT CASE WHEN aul.is_billable = TRUE THEN aul.generation_log_id END) AS billable_generations,
  SUM(CASE WHEN aul.operation_type = 'text_analysis' AND aul.is_billable = TRUE THEN 1 ELSE 0 END) AS text_analysis_count,
  SUM(CASE WHEN aul.operation_type = 'image_generation' AND aul.is_billable = TRUE THEN 1 ELSE 0 END) AS image_generation_count,
  SUM(CASE WHEN aul.operation_type = 'image_enhancement' AND aul.is_billable = TRUE THEN 1 ELSE 0 END) AS image_enhancement_count,
  SUM(CASE WHEN aul.is_billable = TRUE THEN aul.cost_usd ELSE 0 END) AS total_cost_usd,
  SUM(CASE WHEN aul.is_billable = TRUE THEN aul.cost_inr ELSE 0 END) AS total_cost_inr,
  MAX(aul.created_at) AS last_usage_date
FROM users u
LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
GROUP BY u.id, u.email;

-- Create feedback logs table for detailed tracking
CREATE TABLE IF NOT EXISTS feedback_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  generation_log_id INT NOT NULL,
  user_id INT NOT NULL,
  feedback_type ENUM('accurate', 'inaccurate') NOT NULL,
  feedback_comment TEXT DEFAULT NULL,
  refund_amount_inr DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_generation_log (generation_log_id),
  INDEX idx_user (user_id),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_created (created_at),
  FOREIGN KEY (generation_log_id) REFERENCES generation_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## How it works:

### User Experience:
1. After image generation, user sees two buttons: "Accurate ✓" and "Inaccurate ✗"
2. If user clicks "Accurate": Feedback recorded, no refund
3. If user clicks "Inaccurate": 
   - All API costs for that generation are refunded automatically
   - Refund amount added to user balance
   - Usage marked as non-billable
   - Cannot submit feedback again for same image

### Database Changes:

**generation_logs table:**
- `user_id`: Link to user who generated the image
- `feedback_status`: 'pending', 'accurate', or 'inaccurate'
- `feedback_comment`: Optional comment (for future use)
- `feedback_at`: Timestamp when feedback was submitted
- `is_refunded`: Boolean flag if refunded
- `refund_amount_inr`: Amount refunded in INR

**api_usage_logs table:**
- `is_billable`: Boolean flag (FALSE for refunded generations)

**feedback_logs table (new):**
- Detailed tracking of all feedback submissions
- Links to generation_log_id and user_id
- Stores feedback type and refund amount

### Billing & Usage Pages:
- `user_billing_summary` view now excludes non-billable usage
- Only accurate/pending generations are counted in billing
- Gallery page will show feedback status on each image

### API Endpoint:
- `POST /casetool/api/feedback`
- Requires: `{ logId, feedbackType: 'accurate' | 'inaccurate' }`
- Returns refund amount if inaccurate

## Notes:
- User can only submit feedback once per image
- Refunds are instant and automatic
- All feedback is logged for quality monitoring
- Billing reports automatically exclude refunded generations
