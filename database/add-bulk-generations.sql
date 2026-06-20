-- Bulk Mockup Studio (/casetool/bulk) persistence table.
-- Run this in phpMyAdmin against the `case_tool` database.

CREATE TABLE IF NOT EXISTS bulk_generations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  file_name   VARCHAR(255) NOT NULL,                  -- original uploaded file name
  model_name  VARCHAR(255) NOT NULL,                  -- model name shown in the UI
  case_type   VARCHAR(50)  NOT NULL DEFAULT 'transparent',
  src_file    VARCHAR(255) DEFAULT NULL,              -- saved reference image file
  src_url     VARCHAR(512) DEFAULT NULL,              -- url to preview the reference
  gen_file    VARCHAR(255) DEFAULT NULL,              -- saved png file in /public/output/bulk
  gen_url     VARCHAR(512) DEFAULT NULL,              -- url used to preview/download
  file_base   VARCHAR(255) DEFAULT NULL,
  prompt      MEDIUMTEXT   DEFAULT NULL,              -- master analysis prompt (reusable)
  mark        ENUM('none','right','wrong') NOT NULL DEFAULT 'none',
  status      VARCHAR(20)  NOT NULL DEFAULT 'done',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_file_case (file_name, case_type),
  KEY idx_case_type (case_type),
  KEY idx_mark (mark)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If you already created the table from an earlier version, run these instead:
-- ALTER TABLE bulk_generations
--   ADD COLUMN src_file VARCHAR(255) DEFAULT NULL AFTER case_type,
--   ADD COLUMN src_url  VARCHAR(512) DEFAULT NULL AFTER src_file;
