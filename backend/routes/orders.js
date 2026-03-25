const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/metrics', async (req, res) => {
    try {
        const [totalRows] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()");
        const [newRows] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'New' AND payment_status = 'Unpaid'");
        const [waitingRows] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status IN ('New', 'In Progress') AND payment_status = 'Unpaid'");
        res.json({
            total_orders: totalRows[0].count,
            new_orders: newRows[0].count,
            waiting_list: waitingRows[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/active', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM orders WHERE payment_status = 'Unpaid' ORDER BY created_at ASC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    let connection;
    try {
        const { customer_name, avatar, items } = req.body;
        if (!customer_name) {
            return res.status(400).json({ message: 'customer_name is required' });
        }
        connection = await pool.getConnection();
        await connection.beginTransaction();
        let totalItems = 0;
        if (items && Array.isArray(items)) {
            totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
        }
        const [result] = await connection.query(
            "INSERT INTO orders (customer_name, avatar, status, total_items) VALUES (?, ?, 'New', ?)",
            [customer_name, avatar || 'B1', totalItems]
        );
        const orderId = result.insertId;
        if (items && Array.isArray(items) && items.length > 0) {
            for (let item of items) {
                await connection.query(
                    'INSERT INTO order_items (order_id, item_id, quantity) VALUES (?, ?, ?)',
                    [orderId, item.item_id, item.quantity || 1]
                );
            }
        }
        await connection.commit();
        res.status(201).json({ message: 'Order created', order_id: orderId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['New', 'In Progress', 'Ready', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]);
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/:id/pay', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [orders] = await connection.query('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
        if (orders.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Order not found' });
        }
        if (orders[0].payment_status === 'Paid') {
            connection.release();
            return res.status(400).json({ message: 'Order is already paid' });
        }
        await connection.query("UPDATE orders SET payment_status = 'Paid', status = 'Completed' WHERE order_id = ?", [req.params.id]);
        await connection.commit();
        res.json({ message: 'Order paid successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
