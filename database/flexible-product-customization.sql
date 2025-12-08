-- Flexible Product Customization System
-- This allows each product to have different customization options

-- 1. Customization Types Table (defines what types of customizations exist)
CREATE TABLE IF NOT EXISTS customization_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'design', 'style', 'phone_holder', 'font'
  display_name VARCHAR(100) NOT NULL, -- e.g., 'Choose Design', 'Select Style'
  input_type ENUM('image_select', 'dropdown', 'color_picker', 'text_input', 'toggle') DEFAULT 'image_select',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Product Customization Options (links products to which customization types they support)
CREATE TABLE IF NOT EXISTS product_customization_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  customization_type_id INT NOT NULL,
  is_required TINYINT(1) DEFAULT 0, -- whether this customization is mandatory
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (customization_type_id) REFERENCES customization_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_customization (product_id, customization_type_id),
  INDEX idx_product_id (product_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customization Values (stores actual options for each customization type)
CREATE TABLE IF NOT EXISTS customization_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customization_type_id INT NOT NULL,
  product_id INT NULL, -- if NULL, it's a global option; if set, it's product-specific
  value_name VARCHAR(255) NOT NULL,
  value_data TEXT, -- JSON or string data (e.g., image URL, hex color, font name)
  price_modifier DECIMAL(10, 2) DEFAULT 0.00, -- additional price for this option
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customization_type_id) REFERENCES customization_types(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_customization_type (customization_type_id),
  INDEX idx_product_id (product_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common customization types
INSERT INTO customization_types (type_name, display_name, input_type) VALUES
('design', 'Choose Design', 'image_select'),
('style', 'Select Style', 'image_select'),
('phone_holder', 'Phone Holder', 'toggle'),
('font_style', 'Font Style', 'dropdown'),
('text_color', 'Text Color', 'color_picker'),
('custom_text', 'Custom Text', 'text_input');

-- Example: Product 1 supports designs and phone holder
-- INSERT INTO product_customization_options (product_id, customization_type_id, is_required, sort_order) VALUES
-- (1, 1, 1, 1), -- design is required
-- (1, 3, 0, 2); -- phone holder is optional

-- Example: Add design values for a product
-- INSERT INTO customization_values (customization_type_id, product_id, value_name, value_data, price_modifier, sort_order) VALUES
-- (1, 1, 'Classic Black', '{"image": "/products/design-black.jpg"}', 0.00, 1),
-- (1, 1, 'Vibrant Red', '{"image": "/products/design-red.jpg"}', 50.00, 2);

-- Example: Add phone holder options (global, not product-specific)
-- INSERT INTO customization_values (customization_type_id, product_id, value_name, value_data, price_modifier, sort_order) VALUES
-- (3, NULL, 'No Holder', '{"enabled": false}', 0.00, 1),
-- (3, NULL, 'With Holder', '{"enabled": true}', 100.00, 2);
