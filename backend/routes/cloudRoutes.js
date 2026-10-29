// =============================================================================
// Cloud Diagnostic & Lab Mapping Routes
// Endpoints: /api/cloud/*
// =============================================================================

const express = require('express');
const router = express.Router();
const cloudController = require('../controllers/cloudController');
const { seedData } = require('../../database/seed-excel-data');

router.get('/status', cloudController.getCloudStatus);

// Bulk seed user's Excel sheet data into Amazon RDS
router.post('/seed-excel', async (req, res) => {
  try {
    const result = await seedData();
    res.status(200).json({
      success: true,
      message: `Successfully loaded ${result.count} transactions from your Excel sheet into Amazon RDS!`,
      count: result.count,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to seed data: ${err.message}`,
    });
  }
});

module.exports = router;
