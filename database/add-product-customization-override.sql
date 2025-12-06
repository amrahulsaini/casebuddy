-- Add product-level customization override functionality
-- This allows individual products to override category-level customization settings

USE case_main;

-- Add customization columns to products table
ALTER TABLE products
ADD COLUMN customization_override BOOLEAN DEFAULT FALSE COMMENT 'Whether this product overrides category customization settings',
ADD COLUMN customization_enabled BOOLEAN DEFAULT NULL COMMENT 'Product-specific customization enabled (NULL = use category default)',
ADD COLUMN customization_options JSON DEFAULT NULL COMMENT 'Product-specific customization options (NULL = use category default)';

-- Create product_phone_brands junction table for product-specific phone brand associations
CREATE TABLE IF NOT EXISTS product_phone_brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  phone_brand_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (phone_brand_id) REFERENCES phone_brands(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_brand (product_id, phone_brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
CREATE INDEX idx_products_customization_override ON products(customization_override);
CREATE INDEX idx_product_phone_brands_product ON product_phone_brands(product_id);
CREATE INDEX idx_product_phone_brands_brand ON product_phone_brands(phone_brand_id);

-- Migration complete
SELECT 'Product-level customization override migration completed successfully!' AS status;
