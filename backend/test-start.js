const fs = require('fs');
const logFile = __dirname + '/error_log.txt';

try {
    fs.writeFileSync(logFile, 'Starting...\n');
    
    const express = require('express');
    fs.appendFileSync(logFile, 'express OK\n');
    
    require('dotenv').config();
    fs.appendFileSync(logFile, 'dotenv OK\n');
    
    const authRoutes = require('./routes/auth');
    fs.appendFileSync(logFile, 'auth OK\n');
    
    const stockRoutes = require('./routes/stock');
    fs.appendFileSync(logFile, 'stock OK\n');
    
    const salesRoutes = require('./routes/sales');
    fs.appendFileSync(logFile, 'sales OK\n');
    
    const analyticsRoutes = require('./routes/analytics');
    fs.appendFileSync(logFile, 'analytics OK\n');
    
    const logsRoutes = require('./routes/logs');
    fs.appendFileSync(logFile, 'logs OK\n');
    
    const ordersRoutes = require('./routes/orders');
    fs.appendFileSync(logFile, 'orders OK\n');
    
    fs.appendFileSync(logFile, 'ALL MODULES LOADED\n');

    const app = express();
    app.use(require('cors')());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/stock', stockRoutes);
    app.use('/api/sales', salesRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/logs', logsRoutes);
    app.use('/api/orders', ordersRoutes);
    
    app.listen(5000, () => {
        fs.appendFileSync(logFile, 'SERVER RUNNING ON PORT 5000\n');
    });
} catch(e) {
    fs.appendFileSync(logFile, 'ERROR: ' + e.message + '\n' + e.stack + '\n');
    process.exit(1);
}
