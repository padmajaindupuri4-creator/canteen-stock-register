const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    // Connect without specifying database first to create it if it doesn't exist
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true // REQUIRED to run multiple queries from a file
    });

    console.log("Connected to MySQL server.");

    try {
        const schemaPath = path.join(__dirname, 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema.sql...");
        await connection.query(schemaSql);
        console.log("Database initialized successfully!");
    } catch (error) {
        console.error("Error initializing database:", error);
    } finally {
        await connection.end();
    }
}

initDB();
