-- Create database if not exists
CREATE DATABASE IF NOT EXISTS express_laundry;
USE express_laundry;

-- 2.1 Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'partner') NOT NULL,
  profile_photo VARCHAR(255), -- Store R2 public URL
  balance DECIMAL(15, 2) DEFAULT 0.00,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Shops (Partners Detail)
CREATE TABLE IF NOT EXISTS shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  shop_photo VARCHAR(255), -- Store R2 public URL
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(2, 1) DEFAULT 0.0,
  is_open BOOLEAN DEFAULT TRUE,
  opening_hours VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.3 Addresses (Customer Only)
CREATE TABLE IF NOT EXISTS user_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50) NOT NULL, -- Rumah, Kantor, etc.
  name VARCHAR(255) NOT NULL, -- Recipient Name
  phone VARCHAR(20) NOT NULL,
  full_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  icon VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.4 Services & Packages
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  name VARCHAR(255) NOT NULL, -- Laundry Kiloan, Satuan, etc.
  category VARCHAR(100),
  photo VARCHAR(255), -- Store R2 public URL
  icon VARCHAR(50),
  color VARCHAR(7),
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  name VARCHAR(255) NOT NULL, -- Reguler, Express, etc.
  time_estimate VARCHAR(100), -- 2 Hari, 6 Jam, etc.
  price DECIMAL(15, 2) NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 2.5 Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY, -- e.g., ORD-1678293
  customer_id INT NOT NULL,
  shop_id INT NOT NULL,
  service_info JSON NOT NULL, -- Snapshot of service/package name & price
  status ENUM('PENDING', 'ACCEPTED', 'PICKING_UP', 'PROCESSING', 'DELIVERING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  total_amount DECIMAL(15, 2) NOT NULL,
  actual_weight DECIMAL(5, 2) DEFAULT NULL, -- Updated by partner later
  payment_method ENUM('BALANCE', 'CASH') DEFAULT 'BALANCE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);
