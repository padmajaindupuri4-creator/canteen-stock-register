CREATE DATABASE IF NOT EXISTS canteen_stock_db;
USE canteen_stock_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Table
CREATE TABLE IF NOT EXISTS stock (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Beverages', 'Fast Food', 'Snacks', 'Raw Materials') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'units',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    quantity_sold DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES stock(item_id) ON DELETE CASCADE
);

-- Raw Material Mapping Table
-- food_item links to prepared item, raw_material links to raw material. Both are references to stock table.
CREATE TABLE IF NOT EXISTS raw_material_mapping (
    mapping_id INT AUTO_INCREMENT PRIMARY KEY,
    food_item_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (food_item_id) REFERENCES stock(item_id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES stock(item_id) ON DELETE CASCADE
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT 'B1',
    status ENUM('New', 'In Progress', 'Ready', 'Completed') DEFAULT 'New',
    payment_status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    total_items INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    item_id INT,
    quantity INT,
    FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES stock(item_id) ON DELETE CASCADE
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Failed Logins Table (for brute force protection)
CREATE TABLE IF NOT EXISTS failed_logins (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    username VARCHAR(100),
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Insert Admin User (Password is 'admin123', assuming bcrypt hash: $2b$10$wT.fD1fP4S./nIUB6s6Cse2P/lE7z5yV.a6O/j4uGzLhK1rL45Q22)
-- Note: Replace with actual bcrypt hash of 'admin123' if different.
INSERT IGNORE INTO users (user_id, name, username, password_hash, role) VALUES 
(1, 'System Admin', 'admin', '$2a$10$vI8aWBn/epNVXh8k3d1GauLd.3P9rY0u9S9S6yvK1W.Qj9I2B3/S2', 'Admin');

-- Seed Raw Materials
INSERT IGNORE INTO stock (item_id, item_name, category, quantity, unit) VALUES
(1, 'Rice', 'Raw Materials', 50, 'kg'),
(2, 'Wheat flour', 'Raw Materials', 30, 'kg'),
(3, 'Oil', 'Raw Materials', 20, 'litres'),
(4, 'Eggs', 'Raw Materials', 100, 'pcs'),
(5, 'Vegetables', 'Raw Materials', 15, 'kg'),
(6, 'Sugar', 'Raw Materials', 10, 'kg'),
(7, 'Tea powder', 'Raw Materials', 5, 'kg'),
(8, 'Milk', 'Raw Materials', 20, 'litres'),
(9, 'Bread', 'Raw Materials', 10, 'packs'),
(10, 'Potatoes', 'Raw Materials', 20, 'kg'),
(11, 'Urad dal', 'Raw Materials', 10, 'kg'),
(12, 'Noodles packets', 'Raw Materials', 50, 'packs'),
(13, 'Coffee powder', 'Raw Materials', 2, 'kg'),
(14, 'Butter', 'Raw Materials', 5, 'kg');

-- Seed Prepared Food
INSERT IGNORE INTO stock (item_id, item_name, category, quantity, unit) VALUES
(15, 'Dosa', 'Fast Food', 0, 'plates'),
(16, 'Idli', 'Fast Food', 0, 'plates'),
(17, 'Noodles', 'Fast Food', 0, 'plates'),
(18, 'Sandwich', 'Fast Food', 0, 'pcs'),
(19, 'Fried rice', 'Fast Food', 0, 'plates'),
(20, 'Tea', 'Beverages', 0, 'cups'),
(21, 'Coffee', 'Beverages', 0, 'cups'),
(22, 'Samosa', 'Snacks', 0, 'pcs');

-- Seed Mappings
-- Dosa mapping: 0.1kg Rice, 0.05kg Urad Dal, 0.02l Oil
INSERT IGNORE INTO raw_material_mapping (food_item_id, raw_material_id, quantity_required) VALUES
(15, 1, 0.10),  -- Dosa -> Rice (0.1 kg)
(15, 11, 0.05), -- Dosa -> Urad dal (0.05 kg)
(15, 3, 0.02),  -- Dosa -> Oil (0.02 litres)
(17, 12, 1.00), -- Noodles -> Noodles packet (1 pack)
(17, 5, 0.10),  -- Noodles -> Vegetables (0.1 kg)
(17, 3, 0.02),  -- Noodles -> Oil (0.02 litres)
(18, 9, 0.20),  -- Sandwich -> Bread (0.2 packs)
(18, 14, 0.02), -- Sandwich -> Butter (0.02 kg)
(18, 5, 0.05),  -- Sandwich -> Vegetables (0.05 kg)
(22, 10, 0.10), -- Samosa -> Potatoes (0.1 kg)
(22, 2, 0.05),  -- Samosa -> Wheat flour (0.05 kg)
(22, 3, 0.01),  -- Samosa -> Oil (0.01 litres)
(20, 8, 0.10),  -- Tea -> Milk (0.1 litres)
(20, 6, 0.01),  -- Tea -> Sugar (0.01 kg)
(20, 7, 0.005); -- Tea -> Tea powder (0.005 kg)
