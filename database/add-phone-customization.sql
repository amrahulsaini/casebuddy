-- ========================================
-- Phone Customization System Migration
-- Date: December 6, 2025
-- Description: Adds phone brand/model selection and customization options
-- ========================================

-- Phone Brands Table
CREATE TABLE IF NOT EXISTS `phone_brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phone Models Table
CREATE TABLE IF NOT EXISTS `phone_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `brand_id` int(11) NOT NULL,
  `model_name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_brand_model` (`brand_id`, `slug`),
  KEY `idx_brand` (`brand_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `phone_models_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `phone_brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Category Phone Brands (Many-to-Many)
CREATE TABLE IF NOT EXISTS `category_phone_brands` (
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  PRIMARY KEY (`category_id`, `brand_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_brand` (`brand_id`),
  CONSTRAINT `category_phone_brands_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_phone_brands_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `phone_brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add customization columns to categories table
ALTER TABLE `categories` 
  ADD COLUMN IF NOT EXISTS `customization_enabled` tinyint(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `customization_options` JSON DEFAULT NULL;

-- Add customization_data column to order_items table
ALTER TABLE `order_items`
  ADD COLUMN IF NOT EXISTS `customization_data` JSON DEFAULT NULL;

-- ========================================
-- Insert Sample Phone Brands
-- ========================================
INSERT INTO `phone_brands` (`name`, `slug`, `sort_order`, `is_active`) VALUES
('Apple', 'apple', 1, 1),
('Samsung', 'samsung', 2, 1),
('Xiaomi', 'xiaomi', 3, 1),
('OnePlus', 'oneplus', 4, 1),
('Realme', 'realme', 5, 1),
('Oppo', 'oppo', 6, 1),
('Vivo', 'vivo', 7, 1),
('Google', 'google', 8, 1),
('Motorola', 'motorola', 9, 1),
('Nothing', 'nothing', 10, 1);

-- ========================================
-- Insert Sample Phone Models for Apple
-- ========================================
INSERT INTO `phone_models` (`brand_id`, `model_name`, `slug`, `sort_order`, `is_active`)
SELECT 
  (SELECT id FROM phone_brands WHERE slug = 'apple'),
  model_name,
  slug,
  sort_order,
  1
FROM (
  SELECT 'iPhone 16 Pro Max' as model_name, 'iphone-16-pro-max' as slug, 1 as sort_order UNION ALL
  SELECT 'iPhone 16 Pro', 'iphone-16-pro', 2 UNION ALL
  SELECT 'iPhone 16 Plus', 'iphone-16-plus', 3 UNION ALL
  SELECT 'iPhone 16', 'iphone-16', 4 UNION ALL
  SELECT 'iPhone 15 Pro Max', 'iphone-15-pro-max', 5 UNION ALL
  SELECT 'iPhone 15 Pro', 'iphone-15-pro', 6 UNION ALL
  SELECT 'iPhone 15 Plus', 'iphone-15-plus', 7 UNION ALL
  SELECT 'iPhone 15', 'iphone-15', 8 UNION ALL
  SELECT 'iPhone 14 Pro Max', 'iphone-14-pro-max', 9 UNION ALL
  SELECT 'iPhone 14 Pro', 'iphone-14-pro', 10 UNION ALL
  SELECT 'iPhone 14 Plus', 'iphone-14-plus', 11 UNION ALL
  SELECT 'iPhone 14', 'iphone-14', 12 UNION ALL
  SELECT 'iPhone 13 Pro Max', 'iphone-13-pro-max', 13 UNION ALL
  SELECT 'iPhone 13 Pro', 'iphone-13-pro', 14 UNION ALL
  SELECT 'iPhone 13', 'iphone-13', 15 UNION ALL
  SELECT 'iPhone 13 Mini', 'iphone-13-mini', 16 UNION ALL
  SELECT 'iPhone 12 Pro Max', 'iphone-12-pro-max', 17 UNION ALL
  SELECT 'iPhone 12 Pro', 'iphone-12-pro', 18 UNION ALL
  SELECT 'iPhone 12', 'iphone-12', 19 UNION ALL
  SELECT 'iPhone 12 Mini', 'iphone-12-mini', 20 UNION ALL
  SELECT 'iPhone 11 Pro Max', 'iphone-11-pro-max', 21 UNION ALL
  SELECT 'iPhone 11 Pro', 'iphone-11-pro', 22 UNION ALL
  SELECT 'iPhone 11', 'iphone-11', 23 UNION ALL
  SELECT 'iPhone SE (2022)', 'iphone-se-2022', 24 UNION ALL
  SELECT 'iPhone SE (2020)', 'iphone-se-2020', 25
) AS models;

-- ========================================
-- Insert Sample Phone Models for Samsung
-- ========================================
INSERT INTO `phone_models` (`brand_id`, `model_name`, `slug`, `sort_order`, `is_active`)
SELECT 
  (SELECT id FROM phone_brands WHERE slug = 'samsung'),
  model_name,
  slug,
  sort_order,
  1
FROM (
  SELECT 'Galaxy S24 Ultra' as model_name, 'galaxy-s24-ultra' as slug, 1 as sort_order UNION ALL
  SELECT 'Galaxy S24+', 'galaxy-s24-plus', 2 UNION ALL
  SELECT 'Galaxy S24', 'galaxy-s24', 3 UNION ALL
  SELECT 'Galaxy S23 Ultra', 'galaxy-s23-ultra', 4 UNION ALL
  SELECT 'Galaxy S23+', 'galaxy-s23-plus', 5 UNION ALL
  SELECT 'Galaxy S23', 'galaxy-s23', 6 UNION ALL
  SELECT 'Galaxy S23 FE', 'galaxy-s23-fe', 7 UNION ALL
  SELECT 'Galaxy S22 Ultra', 'galaxy-s22-ultra', 8 UNION ALL
  SELECT 'Galaxy S22+', 'galaxy-s22-plus', 9 UNION ALL
  SELECT 'Galaxy S22', 'galaxy-s22', 10 UNION ALL
  SELECT 'Galaxy Z Fold 6', 'galaxy-z-fold-6', 11 UNION ALL
  SELECT 'Galaxy Z Flip 6', 'galaxy-z-flip-6', 12 UNION ALL
  SELECT 'Galaxy Z Fold 5', 'galaxy-z-fold-5', 13 UNION ALL
  SELECT 'Galaxy Z Flip 5', 'galaxy-z-flip-5', 14 UNION ALL
  SELECT 'Galaxy A55', 'galaxy-a55', 15 UNION ALL
  SELECT 'Galaxy A54', 'galaxy-a54', 16 UNION ALL
  SELECT 'Galaxy A35', 'galaxy-a35', 17 UNION ALL
  SELECT 'Galaxy A34', 'galaxy-a34', 18 UNION ALL
  SELECT 'Galaxy M55', 'galaxy-m55', 19 UNION ALL
  SELECT 'Galaxy M35', 'galaxy-m35', 20
) AS models;

-- ========================================
-- Insert Sample Phone Models for Xiaomi
-- ========================================
INSERT INTO `phone_models` (`brand_id`, `model_name`, `slug`, `sort_order`, `is_active`)
SELECT 
  (SELECT id FROM phone_brands WHERE slug = 'xiaomi'),
  model_name,
  slug,
  sort_order,
  1
FROM (
  SELECT 'Xiaomi 14 Pro' as model_name, 'xiaomi-14-pro' as slug, 1 as sort_order UNION ALL
  SELECT 'Xiaomi 14', 'xiaomi-14', 2 UNION ALL
  SELECT 'Xiaomi 13 Pro', 'xiaomi-13-pro', 3 UNION ALL
  SELECT 'Xiaomi 13', 'xiaomi-13', 4 UNION ALL
  SELECT 'Redmi Note 13 Pro+', 'redmi-note-13-pro-plus', 5 UNION ALL
  SELECT 'Redmi Note 13 Pro', 'redmi-note-13-pro', 6 UNION ALL
  SELECT 'Redmi Note 13', 'redmi-note-13', 7 UNION ALL
  SELECT 'Redmi Note 12 Pro+', 'redmi-note-12-pro-plus', 8 UNION ALL
  SELECT 'Redmi Note 12 Pro', 'redmi-note-12-pro', 9 UNION ALL
  SELECT 'Redmi Note 12', 'redmi-note-12', 10 UNION ALL
  SELECT 'POCO X6 Pro', 'poco-x6-pro', 11 UNION ALL
  SELECT 'POCO X6', 'poco-x6', 12 UNION ALL
  SELECT 'POCO F6', 'poco-f6', 13 UNION ALL
  SELECT 'POCO M6 Pro', 'poco-m6-pro', 14 UNION ALL
  SELECT 'Redmi 13C', 'redmi-13c', 15
) AS models;

-- ========================================
-- Insert Sample Phone Models for OnePlus
-- ========================================
INSERT INTO `phone_models` (`brand_id`, `model_name`, `slug`, `sort_order`, `is_active`)
SELECT 
  (SELECT id FROM phone_brands WHERE slug = 'oneplus'),
  model_name,
  slug,
  sort_order,
  1
FROM (
  SELECT 'OnePlus 12' as model_name, 'oneplus-12' as slug, 1 as sort_order UNION ALL
  SELECT 'OnePlus 12R', 'oneplus-12r', 2 UNION ALL
  SELECT 'OnePlus 11', 'oneplus-11', 3 UNION ALL
  SELECT 'OnePlus 11R', 'oneplus-11r', 4 UNION ALL
  SELECT 'OnePlus Nord 4', 'oneplus-nord-4', 5 UNION ALL
  SELECT 'OnePlus Nord 3', 'oneplus-nord-3', 6 UNION ALL
  SELECT 'OnePlus Nord CE 4', 'oneplus-nord-ce-4', 7 UNION ALL
  SELECT 'OnePlus Nord CE 3', 'oneplus-nord-ce-3', 8 UNION ALL
  SELECT 'OnePlus 10 Pro', 'oneplus-10-pro', 9 UNION ALL
  SELECT 'OnePlus 10T', 'oneplus-10t', 10
) AS models;

-- ========================================
-- VERIFICATION QUERIES (Run these to check)
-- ========================================

-- Check brands
-- SELECT * FROM phone_brands ORDER BY sort_order;

-- Check models count by brand
-- SELECT b.name, COUNT(m.id) as model_count 
-- FROM phone_brands b 
-- LEFT JOIN phone_models m ON b.id = m.brand_id 
-- GROUP BY b.id 
-- ORDER BY b.sort_order;

-- Check if columns were added to categories
-- SHOW COLUMNS FROM categories LIKE 'customization%';

-- Check if column was added to order_items
-- SHOW COLUMNS FROM order_items LIKE 'customization_data';

COMMIT;
