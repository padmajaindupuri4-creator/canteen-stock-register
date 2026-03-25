const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');

router.use(verifyToken);

// GET /api/analytics/dashboard
// Both Admin and Staff can view standard analytics
router.get('/dashboard', async (req, res) => {
    try {
        // 1. Total Stock Items
        const [[{ total_items }]] = await pool.query('SELECT COUNT(*) as total_items FROM stock');

        // 2. Low Stock Alerts (quantity < 10 for raw materials/snacks)
        const [low_stock] = await pool.query('SELECT * FROM stock WHERE quantity < 10 AND category != "Fast Food" AND category != "Beverages" LIMIT 5');

        // 3. Most Selling Items (overall)
        const [most_selling] = await pool.query(`
            SELECT i.item_name, SUM(s.quantity_sold) as total_sold
            FROM sales s
            JOIN stock i ON s.item_id = i.item_id
            GROUP BY s.item_id
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // 4. Category Distribution
        const [category_distribution] = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM stock
            GROUP BY category
        `);

        res.json({
            total_items,
            low_stock,
            most_selling,
            category_distribution
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/analytics/predictions
// AI-Based Smart Demand Prediction (Moving Average)
router.get('/predictions', async (req, res) => {
    try {
        // Simple prediction: Look at sales in the last 7 days vs previous 7 days to determine trend
        const [trends] = await pool.query(`
            SELECT 
                i.item_id,
                i.item_name,
                IFNULL(SUM(CASE WHEN s.sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN s.quantity_sold ELSE 0 END), 0) as recent_7_days,
                IFNULL(SUM(CASE WHEN s.sale_date >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND s.sale_date < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN s.quantity_sold ELSE 0 END), 0) as previous_7_days
            FROM stock i
            LEFT JOIN sales s ON i.item_id = s.item_id
            WHERE i.category IN ('Fast Food', 'Snacks', 'Beverages')
            GROUP BY i.item_id
        `);

        const predictions = trends.map(item => {
            let demandLevel = 'Low';
            let trend = 'Stable';

            if (item.recent_7_days > 50) demandLevel = 'High';
            else if (item.recent_7_days > 20) demandLevel = 'Medium';

            if (item.recent_7_days > item.previous_7_days * 1.2 && item.previous_7_days > 0) trend = 'Increasing';
            else if (item.recent_7_days < item.previous_7_days * 0.8) trend = 'Decreasing';

            return {
                item_name: item.item_name,
                past_sales_weekly: item.recent_7_days,
                predicted_demand: demandLevel,
                trend: trend
            };
        });

        res.json(predictions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
