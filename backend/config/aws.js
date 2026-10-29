// =============================================================================
// AWS S3 Client Configuration
// Supports EC2 IAM Roles (Default Instance Profile) and .env credentials
// Defaulted to your bucket: expense-receipts-57-63 in ap-south-1 (Mumbai)
// =============================================================================

const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET || 'expense-receipts-57-63';

let s3Client = null;
let isS3Configured = false;

try {
  // Check if explicit keys are provided in .env
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    !process.env.AWS_ACCESS_KEY_ID.includes('your_') &&
    !process.env.AWS_SECRET_ACCESS_KEY.includes('your_')
  ) {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    isS3Configured = true;
    console.log(`[AWS S3] Initialized S3 Client with explicit credentials for bucket "${bucketName}" in region ${region}`);
  } else {
    // Default AWS Credentials Provider Chain (EC2 IAM Instance Profile / IMDSv2)
    s3Client = new S3Client({ region });
    isS3Configured = true;
    console.log(`[AWS S3] Initialized S3 Client using EC2 IAM Role for bucket "${bucketName}" in region ${region}`);
  }
} catch (err) {
  console.warn('[AWS S3 Error] Failed to initialize S3 client:', err.message);
  isS3Configured = false;
}

module.exports = {
  s3Client,
  bucketName,
  region,
  isS3Configured,
  useIamRole: true,
};
