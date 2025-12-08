-- Create orders table for checkout system
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer Information
  customer_email VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(15) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  
  -- Shipping Address
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_pincode VARCHAR(10) NOT NULL,
  
  -- Product Information
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  phone_model VARCHAR(100) NOT NULL,
  design_name VARCHAR(255),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Additional Information
  notes TEXT,
  
  -- Order Status
  order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  
  -- Tracking
  tracking_number VARCHAR(100),
  tracking_url VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  
  INDEX idx_order_number (order_number),
  INDEX idx_customer_email (customer_email),
  INDEX idx_customer_mobile (customer_mobile),
  INDEX idx_order_status (order_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
