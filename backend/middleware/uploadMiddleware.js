// =============================================================================
// File Upload Middleware (Multer)
// Validates file types (JPG, JPEG, PNG, PDF) and enforces 5MB size limits
// Holds file in memory buffer for direct streaming to Amazon S3
// Lab Mapping: Practical 4 (S3 File Storage)
// =============================================================================

const multer = require('multer');

// Store file in memory buffer so it can be pushed directly to Amazon S3
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum file size
  },
});

module.exports = upload;
