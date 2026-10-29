// =============================================================================
// Transaction & Receipt Routes
// Endpoints: /api/transactions/*
// Lab Mapping: Practical 4 (S3), Practical 5 (S3 Versioning), Practical 11 (RDS)
// =============================================================================

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All transaction routes require authentication
router.use(authenticateToken);

// Standard CRUD
router.get('/', transactionController.getTransactions);
router.post('/', upload.single('receipt'), transactionController.createTransaction);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', upload.single('receipt'), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Dedicated Receipt Upload & S3 Versioning inspection
router.post('/:id/receipt', upload.single('receipt'), transactionController.uploadReceiptForTransaction);
router.get('/:id/receipt-versions', transactionController.getReceiptVersions);

module.exports = router;
