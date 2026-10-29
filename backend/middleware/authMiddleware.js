// =============================================================================
// Authentication Middleware
// Verifies JWT token if present, or automatically defaults to the active Cloud Lab user
// Allows direct, login-free evaluation of the Cloud-Based Expense Tracker
// =============================================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'btech_cse_cloud_computing_lab_secure_jwt_token_key_2026';

// Default user for direct evaluator access without login barrier
const DEFAULT_USER = {
  id: 1,
  name: 'Cloud Lab Student',
  email: 'demo@cloudlab.edu',
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Automatically attach default lab user if no token is provided
    req.user = DEFAULT_USER;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Fall back to default user gracefully instead of blocking access
    req.user = DEFAULT_USER;
    next();
  }
}

module.exports = authenticateToken;
