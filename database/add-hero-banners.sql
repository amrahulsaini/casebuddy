-- Create hero banners table for admin management
CREATE TABLE IF NOT EXISTS hero_banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  cta_text VARCHAR(100),
  cta_link VARCHAR(255),
  gradient VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default banners
INSERT INTO hero_banners (title, subtitle, description, cta_text, cta_link, gradient, sort_order) VALUES
('Premium Phone Cases', 'Protect Your Device in Style', 'Discover our collection of high-quality phone cases designed for every lifestyle', 'Shop Now', '/shop', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 1),
('Custom Design Cases', 'Make It Uniquely Yours', 'Add your own text and choose from various fonts and placements', 'Customize Now', '/shop', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 2),
('Free Shipping', 'On Orders Above ₹499', 'Get your favorite phone case delivered to your doorstep at no extra cost', 'Browse Collection', '/shop', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 3),
('Exclusive Designs', 'Limited Edition Collection', 'Stand out with our unique and trending phone case designs', 'View Designs', '/shop', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 4),
('Premium Quality', '100% Satisfaction Guaranteed', 'Durable materials, perfect fit, and 7-day return policy', 'Learn More', '/shop', 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', 5),
('Trending Styles', 'Stay Ahead of Fashion', 'Explore the latest phone case trends and styles for 2025', 'See Trends', '/shop', 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 6),
('Durable Protection', 'Military-Grade Drop Protection', 'Advanced shock-absorption technology keeps your phone safe', 'Shop Protection', '/shop', 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 7),
('Special Offers', 'Limited Time Deals', 'Get up to 30% off on selected phone cases this week only', 'Grab Deals', '/shop', 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 8);

-- Create index for sorting
CREATE INDEX idx_sort_order ON hero_banners(sort_order);
CREATE INDEX idx_active ON hero_banners(is_active);
