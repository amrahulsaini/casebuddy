-- Add product designs/variants table
CREATE TABLE IF NOT EXISTS product_designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  design_name VARCHAR(255) NOT NULL,
  design_image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sample data (optional - you can remove this if you want to add manually)
-- This assumes you have products with IDs 1, 2, 3 etc.
-- Uncomment below if you want sample data:

/*
INSERT INTO product_designs (product_id, design_name, design_image_url, sort_order) VALUES
(1, 'Classic Black', '/products/design-1-black.jpg', 1),
(1, 'Vibrant Red', '/products/design-1-red.jpg', 2),
(1, 'Ocean Blue', '/products/design-1-blue.jpg', 3),
(2, 'Floral Pattern', '/products/design-2-floral.jpg', 1),
(2, 'Geometric Design', '/products/design-2-geometric.jpg', 2);
*/
