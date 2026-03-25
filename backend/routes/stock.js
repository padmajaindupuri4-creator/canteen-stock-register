const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const logActivity = require('../utils/logger');

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// GET /api/stock
// Accessible by both Admin and Staff
// Supports optional ?category= filter
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let rows;
        if (category) {
            [rows] = await pool.query('SELECT * FROM stock WHERE category = ? ORDER BY item_id ASC', [category]);
        } else {
            [rows] = await pool.query('SELECT * FROM stock ORDER BY item_id ASC');
        }
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/stock
// Only Admin can add new stock items
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { item_name, category, quantity, unit } = req.body;
        
        if (!item_name || !category) {
            return res.status(400).json({ message: 'Item name and category are required' });
        }

        const qty = quantity || 0;
        const u = unit || 'units';

        const [result] = await pool.query(
            'INSERT INTO stock (item_name, category, quantity, unit) VALUES (?, ?, ?, ?)',
            [item_name, category, qty, u]
        );

        await logActivity(req.user.id, 'Add Stock', `Added new item: ${item_name} (${qty} ${u})`);

        return res.status(201).json({ message: 'Stock item added successfully', item_id: result.insertId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/stock/:id
// Only Admin can update stock
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, category, quantity, unit } = req.body;

        const [existing] = await pool.query('SELECT * FROM stock WHERE item_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await pool.query(
            'UPDATE stock SET item_name = ?, category = ?, quantity = ?, unit = ? WHERE item_id = ?',
            [item_name, category, quantity, unit, id]
        );

        await logActivity(req.user.id, 'Update Stock', `Updated item ID ${id} (${item_name}) to qty: ${quantity}`);

        return res.json({ message: 'Stock item updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/stock/:id
// Only Admin can delete stock
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query('SELECT * FROM stock WHERE item_id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await pool.query('DELETE FROM stock WHERE item_id = ?', [id]);

        await logActivity(req.user.id, 'Delete Stock', `Deleted item ID ${id} (${existing[0].item_name})`);

        return res.json({ message: 'Stock item deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
