// =============================================================================
// Dashboard Metrics Routes
// Endpoints: /api/dashboard/*
// =============================================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/summary', dashboardController.getSummary);
router.get('/category-summary', dashboardController.getCategorySummary);
router.get('/monthly-summary', dashboardController.getMonthlySummary);

module.exports = router;
