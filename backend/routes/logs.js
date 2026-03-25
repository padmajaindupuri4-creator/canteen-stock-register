const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');

router.use(verifyToken);
// Only Admins can view activity logs
router.use(verifyAdmin);

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT l.log_id, l.action, l.description, l.timestamp, l.ip_address, IFNULL(u.username, 'System') as username
            FROM activity_log l
            LEFT JOIN users u ON l.user_id = u.user_id
            ORDER BY l.timestamp DESC
            LIMIT 200
        `;
        const [rows] = await pool.query(query);
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
