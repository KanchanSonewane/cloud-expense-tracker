// =============================================================================
// Cloud-Based Expense Tracker - Backend Server
// Main Application Entry Point
// B.Tech CSE Cloud Computing Lab Mini Project
// Technologies: Node.js, Express.js, Amazon RDS (MySQL), Amazon S3, Amazon EC2
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cloudRoutes = require('./routes/cloudRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve Local Uploads (used only during offline development fallback if S3 is unconfigured)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Cloud-Based Expense Tracker API',
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cloud', cloudRoutes);

// Fallback Route for Single Page Navigation
app.get('*', (req, res, next) => {
  // If API route not found, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  // Otherwise serve landing page
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================================================');
  console.log(` Cloud-Based Expense Tracker Server Started`);
  console.log(` Port: ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Cloud Lab Status: http://localhost:${PORT}/api/cloud/status`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================================================');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

module.exports = app;
