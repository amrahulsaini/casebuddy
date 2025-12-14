-- Shipments table for Shiprocket integration (manual admin workflow)
-- Run this on your MAIN store database (the same DB that has the `orders` table).

CREATE TABLE IF NOT EXISTS shipments (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,

  provider VARCHAR(50) NOT NULL DEFAULT 'shiprocket',

  shiprocket_order_id VARCHAR(100) NULL,
  shiprocket_shipment_id VARCHAR(100) NULL,
  shiprocket_awb VARCHAR(100) NULL,
  shiprocket_courier_id VARCHAR(100) NULL,
  shiprocket_courier_name VARCHAR(255) NULL,

  status VARCHAR(50) NULL,
  tracking_url VARCHAR(500) NULL,

  label_url VARCHAR(500) NULL,
  manifest_url VARCHAR(500) NULL,
  invoice_url VARCHAR(500) NULL,

  pickup_location VARCHAR(200) NULL,

  payload_json JSON NULL,
  response_json JSON NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uniq_shipments_order_id (order_id),
  KEY idx_shipments_shiprocket_shipment_id (shiprocket_shipment_id),
  KEY idx_shipments_shiprocket_awb (shiprocket_awb),
  CONSTRAINT fk_shipments_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
