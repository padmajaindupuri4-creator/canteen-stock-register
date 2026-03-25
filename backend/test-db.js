const mysql = require('mysql2/promise');

async function testConnection() {
    console.log("Testing with empty password...");
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        console.log("SUCCESS");
        await connection.end();
    } catch (e) {
        console.error("FAILED_EMPTY:", e.message);
    }

    try {
        const c2 = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password'
        });
        console.log("SUCCESS_PASSWORD");
        await c2.end();
    } catch (e) {
        console.error("FAILED_PASSWORD:", e.message);
    }
}
testConnection();
