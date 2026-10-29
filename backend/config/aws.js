// =============================================================================
// AWS S3 Client Configuration
// Supports both EC2 IAM Roles (Production) and IAM User Credentials (.env)
// Lab Mapping: Practical 4 (S3), Practical 5 (S3 Versioning), Practical 12 (IAM)
// =============================================================================

const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || '';
const useIamRole = process.env.AWS_USE_IAM_ROLE === 'true';

let s3Client = null;
let isS3Configured = false;

// Determine if valid AWS credentials or IAM role are specified
if (useIamRole) {
  // When running on an Amazon EC2 instance with an attached IAM Role,
  // the AWS SDK automatically fetches temporary credentials from the
  // Instance Metadata Service (IMDSv2). This is the AWS best practice.
  try {
    s3Client = new S3Client({ region });
    isS3Configured = !!bucketName;
    console.log(`[AWS IAM] Initialized S3 Client using EC2 Instance Profile / IAM Role in region ${region}`);
  } catch (err) {
    console.warn('[AWS IAM] Failed to initialize S3 with IAM Role:', err.message);
  }
} else if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  !process.env.AWS_ACCESS_KEY_ID.includes('your_') &&
  !process.env.AWS_SECRET_ACCESS_KEY.includes('your_')
) {
  // Running locally or without IAM Role, using provided IAM User credentials
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  isS3Configured = !!bucketName;
  console.log(`[AWS S3] Initialized S3 Client with provided credentials for bucket "${bucketName}" in region ${region}`);
} else {
  console.log('[AWS S3] No active AWS credentials found in environment. Storage service will operate in local fallback mode if enabled.');
}

module.exports = {
  s3Client,
  bucketName,
  region,
  isS3Configured,
  useIamRole,
};
