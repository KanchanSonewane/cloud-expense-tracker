// =============================================================================
// Dashboard Controller
// Calculates financial metrics, category breakdowns, and monthly statistics
// Queries Amazon RDS / MySQL database
// =============================================================================

const db = require('../config/db');

/**
 * Get dashboard summary cards (Total Income, Expenses, Balance, Count)
 * GET /api/dashboard/summary
 */
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(id) AS total_transactions,
        COUNT(CASE WHEN receipt_key IS NOT NULL THEN 1 END) AS receipts_stored
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    const summary = rows[0] || {
      total_income: 0,
      total_expense: 0,
      total_transactions: 0,
      receipts_stored: 0,
    };

    const income = parseFloat(summary.total_income);
    const expense = parseFloat(summary.total_expense);
    const balance = income - expense;

    res.status(200).json({
      success: true,
      data: {
        totalIncome: income,
        totalExpenses: expense,
        currentBalance: balance,
        transactionCount: parseInt(summary.total_transactions, 10),
        receiptsStored: parseInt(summary.receipts_stored, 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get category-wise spending breakdown for Chart.js doughnut chart
 * GET /api/dashboard/category-summary
 */
async function getCategorySummary(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        category,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(id) AS count
       FROM transactions
       WHERE user_id = ? AND type = 'expense'
       GROUP BY category
       ORDER BY total_amount DESC`,
      [userId]
    );

    const categories = (rows || []).map((row) => ({
      category: row.category,
      amount: parseFloat(row.total_amount),
      count: parseInt(row.count, 10),
    }));

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get monthly trend summary (income vs expenses over last 6 months)
 * GET /api/dashboard/monthly-summary
 */
async function getMonthlySummary(req, res, next) {
  try {
    const userId = req.user.id;

    // Standard date formatting query
    const [rows] = await db.query(
      `SELECT 
        SUBSTRING(transaction_date, 1, 7) AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ?
       GROUP BY SUBSTRING(transaction_date, 1, 7)
       ORDER BY month ASC`,
      [userId]
    );

    const monthlyData = (rows || []).map((row) => ({
      month: row.month,
      income: parseFloat(row.income),
      expense: parseFloat(row.expense),
      net: parseFloat(row.income) - parseFloat(row.expense),
    }));

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getCategorySummary,
  getMonthlySummary,
};
