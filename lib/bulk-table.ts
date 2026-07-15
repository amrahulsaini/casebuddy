/**
 * Ensures the bulk_generations table (and newer columns) exist. Runs once per
 * process so the /bulk feature works without any manual phpMyAdmin migration.
 */
import type { Pool } from 'mysql2/promise';

let ensured: Promise<void> | null = null;

export function ensureBulkTable(pool: Pool): Promise<void> {
  if (ensured) return ensured;
  ensured = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_generations (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        file_name   VARCHAR(255) NOT NULL,
        model_name  VARCHAR(255) NOT NULL,
        case_type   VARCHAR(50)  NOT NULL DEFAULT 'transparent',
        src_file    VARCHAR(255) DEFAULT NULL,
        src_url     VARCHAR(512) DEFAULT NULL,
        src_thumb   MEDIUMTEXT   DEFAULT NULL,
        gen_file    VARCHAR(255) DEFAULT NULL,
        gen_url     VARCHAR(512) DEFAULT NULL,
        file_base   VARCHAR(255) DEFAULT NULL,
        prompt      MEDIUMTEXT   DEFAULT NULL,
        mark        ENUM('none','right','wrong') NOT NULL DEFAULT 'none',
        status      VARCHAR(20)  NOT NULL DEFAULT 'done',
        image_model VARCHAR(64)  DEFAULT NULL,
        cost_usd    DECIMAL(12,6) DEFAULT 0,
        cost_inr    DECIMAL(10,2) DEFAULT 0,
        gen_width   INT          DEFAULT 0,
        gen_height  INT          DEFAULT 0,
        resolution  VARCHAR(8)   DEFAULT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_file_case (file_name, case_type),
        KEY idx_case_type (case_type),
        KEY idx_mark (mark)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Every image API call (including retries) is logged here for billing.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_api_calls (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        case_type   VARCHAR(50)  NOT NULL DEFAULT 'transparent',
        file_name   VARCHAR(255) DEFAULT NULL,
        model_name  VARCHAR(255) DEFAULT NULL,
        image_model VARCHAR(64)  DEFAULT NULL,
        model_key   VARCHAR(24)  DEFAULT NULL,
        model_label VARCHAR(64)  DEFAULT NULL,
        cost_inr    DECIMAL(10,2) NOT NULL DEFAULT 0,
        status      VARCHAR(20)  NOT NULL DEFAULT 'success',
        gen_file    VARCHAR(255) DEFAULT NULL,
        gen_url     VARCHAR(512) DEFAULT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        KEY idx_case (case_type),
        KEY idx_created (created_at),
        KEY idx_model (image_model)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Best-effort add per-call image columns for older bulk_api_calls tables.
    for (const a of [
      "ADD COLUMN gen_file VARCHAR(255) DEFAULT NULL",
      "ADD COLUMN gen_url VARCHAR(512) DEFAULT NULL",
    ]) {
      try { await pool.query(`ALTER TABLE bulk_api_calls ${a}`); }
      catch { /* column already exists */ }
    }

    // Best-effort add columns for tables created by older versions.
    const adds = [
      "ADD COLUMN src_file VARCHAR(255) DEFAULT NULL",
      "ADD COLUMN src_url VARCHAR(512) DEFAULT NULL",
      "ADD COLUMN src_thumb MEDIUMTEXT DEFAULT NULL",
      "ADD COLUMN image_model VARCHAR(64) DEFAULT NULL",
      "ADD COLUMN cost_usd DECIMAL(12,6) DEFAULT 0",
      "ADD COLUMN cost_inr DECIMAL(10,2) DEFAULT 0",
      "ADD COLUMN gen_width INT DEFAULT 0",
      "ADD COLUMN gen_height INT DEFAULT 0",
      "ADD COLUMN resolution VARCHAR(8) DEFAULT NULL",
    ];
    for (const a of adds) {
      try { await pool.query(`ALTER TABLE bulk_generations ${a}`); }
      catch { /* column already exists */ }
    }
  })().catch(err => {
    // Reset so a later request can retry if the DB was briefly unavailable.
    ensured = null;
    throw err;
  });
  return ensured;
}
