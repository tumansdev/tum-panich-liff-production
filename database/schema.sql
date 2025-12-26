-- =============================================
-- DATABASE: tumpanich_db
-- Separate database for Tum Panich LIFF
-- =============================================

-- ผู้ใช้ (จาก LINE Profile)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  line_user_id VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  picture_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  birthday DATE,
  dietary_notes TEXT,
  points INT DEFAULT 0,
  member_tier VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ที่อยู่จัดส่ง
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  address_line TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  note TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- หมวดหมู่เมนู
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(50),
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- เมนูอาหาร
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id INT REFERENCES categories(id),
  is_available BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 5.0,
  order_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ตัวเลือกเพิ่มเติม
CREATE TABLE menu_options (
  id SERIAL PRIMARY KEY,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
  option_group VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false
);

-- คูปอง
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ออเดอร์
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'pending',
  delivery_type VARCHAR(20) NOT NULL,
  delivery_address TEXT,
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  delivery_distance DECIMAL(5,2),
  delivery_note TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_id INT REFERENCES coupons(id),
  payment_status VARCHAR(20) DEFAULT 'pending',
  slip_image_url TEXT,
  rider_name VARCHAR(100),
  rider_phone VARCHAR(20),
  estimated_time INT,
  confirmed_at TIMESTAMP,
  cooking_at TIMESTAMP,
  ready_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- รายการในออเดอร์
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  options TEXT,
  note TEXT
);

-- การใช้คูปอง
CREATE TABLE coupon_usages (
  id SERIAL PRIMARY KEY,
  coupon_id INT REFERENCES coupons(id),
  user_id INT REFERENCES users(id),
  order_id INT REFERENCES orders(id),
  used_at TIMESTAMP DEFAULT NOW()
);

-- Admin users
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  order_id INT REFERENCES orders(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default categories
INSERT INTO categories (name, name_en, icon, sort_order) VALUES
('แนะนำ', 'Recommended', 'local_fire_department', 1),
('ก๋วยเตี๋ยว', 'Noodles', 'ramen_dining', 2),
('ข้าว', 'Rice Dishes', 'rice_bowl', 3),
('กับข้าว', 'Side Dishes', 'lunch_dining', 4),
('ของทานเล่น', 'Appetizers', 'tapas', 5),
('เครื่องดื่ม', 'Beverages', 'local_cafe', 6),
('ของหวาน', 'Desserts', 'icecream', 7);

-- Insert sample menu items (based on current App.jsx)
INSERT INTO menu_items (name, name_en, description, price, image_url, category_id, is_available, is_recommended, rating) VALUES
('บะหมี่หมูแดงย่างถ่าน', 'Charcoal BBQ Pork Noodles', 'เส้นทำเอง เหนียวนุ่ม หมูแดงย่างถ่านหอมๆ', 60, 'https://images.unsplash.com/photo-1543363363-cf292708307c?q=80&w=1000', 1, true, true, 4.9),
('บะหมี่เกี๊ยวกุ้งหมูแดง', 'Shrimp Wonton Noodles', 'เกี๊ยวกุ้งเต็มคำ ซุปกลมกล่อม', 70, 'https://images.unsplash.com/photo-1596626690463-c79435b7194d?q=80&w=1000', 1, true, true, 4.8),
('ข้าวหมูแดงไข่ยางมะตูม', 'BBQ Pork Rice with Soft Boiled Egg', 'น้ำราดสูตรลับ เคี่ยวจนเข้มข้น', 60, 'https://images.unsplash.com/photo-1626804475297-411d0c1737e4?q=80&w=1000', 3, true, false, 4.7),
('หมูแดงสับ (จานใหญ่)', 'Chopped BBQ Pork (Large)', 'สำหรับทานเล่น หรือแกล้ม หมักเข้าเนื้อ', 150, 'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000', 4, true, false, 4.9),
('เกี๊ยวหมูทอด', 'Fried Pork Dumplings', 'กรอบนอก นุ่มใน น้ำจิ้มรสเด็ด', 40, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=2070', 5, true, false, 4.6);

-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO admin_users (username, password_hash, display_name, role) VALUES
('admin', '$2b$10$example_hash_replace_in_production', 'คุณตั้ม', 'owner');

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
