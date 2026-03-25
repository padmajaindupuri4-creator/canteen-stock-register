const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const logActivity = require('../utils/logger');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, username, password, role } = req.body;
        
        // Basic validation
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const userRole = role === 'Admin' ? 'Admin' : 'Staff'; // Default to Staff
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, username, hashedPassword, userRole]
        );
        
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ip_address = req.ip || req.connection.remoteAddress;

        // Rate limiting for failed logins (simple naive implementation)
        const [failedAttempts] = await pool.query(
            "SELECT COUNT(*) as count FROM failed_logins WHERE ip_address = ? AND attempt_time > (NOW() - INTERVAL 15 MINUTE)",
            [ip_address]
        );
        
        if (failedAttempts[0].count >= 5) {
            // Log security alert
            await logActivity(null, 'Security Alert', `Account locked temporarily due to multiple failed login attempts for IP ${ip_address}`, ip_address);
            return res.status(429).json({ message: 'Too many failed login attempts. Please try again after 15 minutes.' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            // Log failed attempt
            await pool.query('INSERT INTO failed_logins (ip_address, username) VALUES (?, ?)', [ip_address, username]);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            // Log failed attempt
            await pool.query('INSERT INTO failed_logins (ip_address, username) VALUES (?, ?)', [ip_address, username]);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Login successful - Clear failed login attempts for this IP/User
        await pool.query('DELETE FROM failed_logins WHERE ip_address = ? OR username = ?', [ip_address, username]);

        const token = jwt.sign(
            { id: user.user_id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecretjwtkey_change_me_in_production',
            { expiresIn: '8h' }
        );

        // Record activity log
        await logActivity(user.user_id, 'Login', 'User logged in successfully', ip_address);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
