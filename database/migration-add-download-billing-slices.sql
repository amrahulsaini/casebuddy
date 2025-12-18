-- Migration: enable per-slice download billing
-- Run this if you already created download_billing_logs using add-download-billing.sql (old schema).

-- 1) Add per-slice columns
ALTER TABLE download_billing_logs
  ADD COLUMN slice_key VARCHAR(64) NOT NULL DEFAULT 'full' AFTER generation_log_id,
  ADD COLUMN downloaded_url VARCHAR(500) DEFAULT NULL AFTER slice_key,
  ADD COLUMN downloaded_label VARCHAR(100) DEFAULT NULL AFTER downloaded_url;

-- 2) Replace unique constraint (was one row per generation) -> (generation, slice)
ALTER TABLE download_billing_logs
  DROP INDEX uniq_generation_log,
  ADD UNIQUE KEY uniq_generation_slice (generation_log_id, slice_key),
  ADD INDEX idx_generation_slice (generation_log_id, slice_key);
