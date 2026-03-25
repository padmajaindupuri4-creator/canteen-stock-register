const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import Routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stock');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const ordersRoutes = require('./routes/orders');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/orders', ordersRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
