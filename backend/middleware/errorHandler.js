// =============================================================================
// Centralized Error Handling Middleware
// Formats errors into structured, user-friendly JSON responses
// Prevents sensitive system stack traces from leaking in production
// =============================================================================

function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err.message || err);

  // Multer error handling (e.g., file size limit exceeded)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Database error handling (e.g., unique key violation or connection loss)
  if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
