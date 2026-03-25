const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const logActivity = require('../utils/logger');

router.use(verifyToken);
// Both Admin and Staff can record sales

// POST /api/sales
router.post('/', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection(); // Use transaction to ensure data integrity
        await connection.beginTransaction();

        const { item_id, quantity_sold } = req.body;

        if (!item_id || !quantity_sold || quantity_sold <= 0) {
            connection.release();
            return res.status(400).json({ message: 'Valid item_id and quantity_sold are required' });
        }

        // 1. Get the item sold
        const [items] = await connection.query('SELECT * FROM stock WHERE item_id = ?', [item_id]);
        if (items.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Item not found' });
        }
        const item = items[0];

        // 2. Check raw material availability before recording the sale
        const [mappings] = await connection.query(
            'SELECT raw_material_id, quantity_required FROM raw_material_mapping WHERE food_item_id = ?',
            [item_id]
        );

        if (mappings.length > 0) {
            // This is a prepared food - check raw material availability
            for (let mapping of mappings) {
                const totalRequired = mapping.quantity_required * quantity_sold;
                const [rawItem] = await connection.query('SELECT item_name, quantity FROM stock WHERE item_id = ?', [mapping.raw_material_id]);
                if (rawItem.length > 0 && rawItem[0].quantity < totalRequired) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({
                        message: `Insufficient raw material: ${rawItem[0].item_name}. Available: ${rawItem[0].quantity}, Required: ${totalRequired}`
                    });
                }
            }
        } else {
            // Direct stock item - check its own quantity
            if (item.quantity < quantity_sold) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    message: `Insufficient stock for ${item.item_name}. Available: ${item.quantity}, Requested: ${quantity_sold}`
                });
            }
        }

        // 3. Record the sale
        await connection.query(
            'INSERT INTO sales (item_id, quantity_sold) VALUES (?, ?)',
            [item_id, quantity_sold]
        );

        // 4. Subtract the main item stock
        await connection.query(
            'UPDATE stock SET quantity = quantity - ? WHERE item_id = ?',
            [quantity_sold, item_id]
        );

        // 5. Handle Raw Material Subtraction (Dependency System)
        if (mappings.length > 0) {
            for (let mapping of mappings) {
                const totalRequired = mapping.quantity_required * quantity_sold;
                await connection.query(
                    'UPDATE stock SET quantity = quantity - ? WHERE item_id = ?',
                    [totalRequired, mapping.raw_material_id]
                );
            }
        }

        await connection.commit();
        await logActivity(req.user.id, 'Record Sale', `Sold ${quantity_sold} of ${item.item_name}`);

        return res.status(201).json({ message: 'Sale recorded and stock updated successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/sales
// Admin can view all sales
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT s.sale_id, s.quantity_sold, s.sale_date, i.item_name, i.category
            FROM sales s
            JOIN stock i ON s.item_id = i.item_id
            ORDER BY s.sale_date DESC
            LIMIT 100
        `;
        const [rows] = await pool.query(query);
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
