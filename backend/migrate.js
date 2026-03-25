const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'canteen_stock_db',
    multipleStatements: true
};

async function migrate() {
    let connection;
    try {
        console.log('Running Order Management DB Migrations...');
        connection = await mysql.createConnection(dbConfig);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(100) NOT NULL,
                avatar VARCHAR(10) DEFAULT 'B1',
                status ENUM('New', 'In Progress', 'Ready', 'Completed') DEFAULT 'New',
                payment_status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
                total_items INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created orders table.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                order_item_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT,
                item_id INT,
                quantity INT,
                FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY(item_id) REFERENCES stock(item_id) ON DELETE CASCADE
            );
        `);
        console.log('Created order_items table.');

        // Insert some dummy orders so the dashboard looks populated initially
        const [existingOrders] = await connection.query('SELECT COUNT(*) as count FROM orders');
        if (existingOrders[0].count === 0) {
            console.log('Seeding initial orders...');
            const seedSql = `
                INSERT INTO orders (customer_name, avatar, status, payment_status, total_items) VALUES 
                ('Ahmad Faiz', 'B2', 'Ready', 'Paid', 3),
                ('Lim Jia Hao', 'B12', 'New', 'Paid', 4),
                ('Arvind Kumar', 'B4', 'New', 'Paid', 2),
                ('Kavitha Nair', 'B12', 'New', 'Paid', 1),
                ('Salina', 'B7', 'In Progress', 'Unpaid', 4),
                ('Siti Hajar', 'B12', 'Ready', 'Unpaid', 1),
                ('Tan Wei Loon', 'B12', 'Ready', 'Unpaid', 1),
                ('Li Mei Ling', 'B4', 'In Progress', 'Unpaid', 2);
                
                -- Note: To keep things simple we won't seed complex order_items right away
            `;
            await connection.query(seedSql);
            console.log('Seeded initial orders.');
        }

        console.log('Migrations complete!');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e.message);
        process.exit(1);
    } finally {
        if (connection) connection.end();
    }
}

migrate();
