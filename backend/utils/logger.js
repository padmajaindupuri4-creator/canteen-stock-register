const pool = require('../config/db');

/**
 * Logs user activity to the database.
 * @param {Number} userId - The ID of the user performing the action (null if system action).
 * @param {String} action - The action type (e.g., 'Login', 'Add Stock', 'Security Alert').
 * @param {String} description - Detailed description of the action.
 * @param {String} ipAddress - IP address of the user.
 */
const logActivity = async (userId, action, description, ipAddress = '') => {
    try {
        await pool.query(
            'INSERT INTO activity_log (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
            [userId || null, action, description, ipAddress]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

module.exports = logActivity;
