// =============================================================================
// Transaction Controller
// Manages CRUD operations for income and expenses
// Interacts with Amazon RDS (MySQL) for metadata and Amazon S3 for receipts
// Lab Mapping: Practical 4 (S3 Storage), Practical 11 (RDS MySQL)
// =============================================================================

const db = require('../config/db');
const s3Service = require('../services/s3Service');

// Standard valid categories
const VALID_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Salary',
  'Investment',
  'Other',
];

/**
 * Get all transactions for current user with optional filters
 * GET /api/transactions
 * Query params: type, category, startDate, endDate, search
 */
async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, category, startDate, endDate, search } = req.query;

    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type && ['income', 'expense'].includes(type.toLowerCase())) {
      sql += ' AND type = ?';
      params.push(type.toLowerCase());
    }

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (startDate) {
      sql += ' AND transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    if (search && search.trim()) {
      sql += ' AND (description LIKE ? OR category LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY transaction_date DESC, id DESC';

    const [rows] = await db.query(sql, params);

    // Format transactions and attach presigned URLs if receipt exists
    const transactions = await Promise.all(
      (rows || []).map(async (tx) => {
        let receiptUrl = null;
        if (tx.receipt_key) {
          try {
            receiptUrl = await s3Service.getReceiptUrl(tx.receipt_key);
          } catch (e) {
            console.warn(`Could not generate presigned URL for receipt ${tx.receipt_key}:`, e.message);
          }
        }
        return {
          ...tx,
          amount: parseFloat(tx.amount),
          receipt_url: receiptUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single transaction by ID
 * GET /api/transactions/:id
 */
async function getTransactionById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized access.',
      });
    }

    const tx = rows[0];
    let receiptUrl = null;
    let s3Versions = null;

    if (tx.receipt_key) {
      receiptUrl = await s3Service.getReceiptUrl(tx.receipt_key);
      try {
        s3Versions = await s3Service.listReceiptVersions(tx.receipt_key);
      } catch (e) {
        console.warn('Could not retrieve S3 versions:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...tx,
        amount: parseFloat(tx.amount),
        receipt_url: receiptUrl,
        s3_versions: s3Versions,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new transaction (with optional receipt file upload to Amazon S3)
 * POST /api/transactions
 */
async function createTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, amount, category, description, transaction_date } = req.body;

    // Validation
    if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either "income" or "expense".',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0.',
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    if (!transaction_date || isNaN(Date.parse(transaction_date))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction date (YYYY-MM-DD).',
      });
    }

    let receiptKey = null;
    let receiptFilename = null;
    let s3UploadResult = null;

    // Handle receipt upload to Amazon S3 if file attached
    if (req.file) {
      s3UploadResult = await s3Service.uploadReceipt(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );
      receiptKey = s3UploadResult.key;
      receiptFilename = req.file.originalname;
    }

    // Insert transaction into database
    const [result] = await db.query(
      `INSERT INTO transactions 
        (user_id, type, amount, category, description, transaction_date, receipt_key, receipt_filename)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type.toLowerCase(),
        parsedAmount,
        category.trim(),
        description ? description.trim() : null,
        transaction_date,
        receiptKey,
        receiptFilename,
      ]
    );

    const newId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: {
        id: newId,
        user_id: userId,
        type: type.toLowerCase(),
        amount: parsedAmount,
        category: category.trim(),
        description: description ? description.trim() : null,
        transaction_date,
        receipt_key: receiptKey,
        receipt_filename: receiptFilename,
        s3_details: s3UploadResult,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing transaction
 * PUT /api/transactions/:id
 */
async function updateTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type, amount, category, description, transaction_date } = req.body;

    // Verify ownership
    const [existing] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized access.',
      });
    }

    const currentTx = existing[0];

    // Validation
    if (type && !['income', 'expense'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be "income" or "expense".',
      });
    }

    let parsedAmount = currentTx.amount;
    if (amount !== undefined) {
      parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number greater than 0.',
        });
      }
    }

    let receiptKey = currentTx.receipt_key;
    let receiptFilename = currentTx.receipt_filename;

    // If new receipt file is uploaded during edit, upload to S3.
    // If we overwrite with the same S3 key, Amazon S3 Versioning generates a new version!
    if (req.file) {
      const s3UploadResult = await s3Service.uploadReceipt(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId,
        currentTx.receipt_key || null // re-use key to demonstrate S3 versioning!
      );
      receiptKey = s3UploadResult.key;
      receiptFilename = req.file.originalname;
    }

    await db.query(
      `UPDATE transactions 
       SET type = ?, amount = ?, category = ?, description = ?, transaction_date = ?, receipt_key = ?, receipt_filename = ?
       WHERE id = ? AND user_id = ?`,
      [
        type ? type.toLowerCase() : currentTx.type,
        parsedAmount,
        category ? category.trim() : currentTx.category,
        description !== undefined ? (description ? description.trim() : null) : currentTx.description,
        transaction_date || currentTx.transaction_date,
        receiptKey,
        receiptFilename,
        id,
        userId,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a transaction
 * DELETE /api/transactions/:id
 */
async function deleteTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized access.',
      });
    }

    const tx = existing[0];

    // Optional: Delete from S3 (demonstrates S3 Delete Marker in versioned bucket)
    if (tx.receipt_key) {
      try {
        await s3Service.deleteReceipt(tx.receipt_key);
      } catch (s3Err) {
        console.warn('Error deleting S3 receipt:', s3Err.message);
      }
    }

    await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload receipt separately for an existing transaction
 * POST /api/transactions/:id/receipt
 */
async function uploadReceiptForTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file provided. Please attach a JPG, PNG, or PDF file.',
      });
    }

    const [existing] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized.',
      });
    }

    const currentTx = existing[0];

    // Upload to Amazon S3 (using existing key if available to demonstrate versioning)
    const uploadResult = await s3Service.uploadReceipt(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      currentTx.receipt_key || null
    );

    await db.query(
      'UPDATE transactions SET receipt_key = ?, receipt_filename = ? WHERE id = ? AND user_id = ?',
      [uploadResult.key, req.file.originalname, id, userId]
    );

    const presignedUrl = await s3Service.getReceiptUrl(uploadResult.key);

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded to Amazon S3 successfully.',
      data: {
        receipt_key: uploadResult.key,
        receipt_filename: req.file.originalname,
        receipt_url: presignedUrl,
        version_id: uploadResult.versionId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get receipt version history (S3 Versioning demonstration)
 * GET /api/transactions/:id/receipt-versions
 * Lab Practical 5: S3 Versioning & recovery demonstration
 */
async function getReceiptVersions(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT receipt_key, receipt_filename FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0 || !existing[0].receipt_key) {
      return res.status(404).json({
        success: false,
        message: 'No receipt found for this transaction.',
      });
    }

    const key = existing[0].receipt_key;
    const versionData = await s3Service.listReceiptVersions(key);

    // Generate signed URLs for each version so student can view/download previous versions!
    const versionsWithUrls = await Promise.all(
      versionData.versions.map(async (v) => {
        let url = null;
        try {
          url = await s3Service.getReceiptUrl(key, v.versionId);
        } catch (e) {
          // ignore
        }
        return {
          ...v,
          downloadUrl: url,
        };
      })
    );

    res.status(200).json({
      success: true,
      receipt_key: key,
      receipt_filename: existing[0].receipt_filename,
      bucket: versionData.bucket,
      versions: versionsWithUrls,
      deleteMarkers: versionData.deleteMarkers,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadReceiptForTransaction,
  getReceiptVersions,
};
