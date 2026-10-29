// =============================================================================
// Cloud Architecture Diagnostic Controller
// Provides cloud service status, EC2 metadata, RDS connection info, and S3 status
// Designed specifically for B.Tech CSE Cloud Computing Lab Demonstration & Viva
// =============================================================================

const os = require('os');
const db = require('../config/db');
const s3Service = require('../services/s3Service');
const { isS3Configured, bucketName, region, useIamRole } = require('../config/aws');

/**
 * Get cloud architecture diagnostic status
 * GET /api/cloud/status
 */
async function getCloudStatus(req, res) {
  try {
    const dbInfo = db.getDbInfo();
    const storageInfo = s3Service.getStorageInfo();

    // Check EC2 environment
    const isEc2 = process.env.AWS_EXECUTION_ENV || process.env.EC2_INSTANCE_ID || useIamRole;

    const cloudDetails = {
      project: 'Cloud-Based Expense Tracker',
      version: '1.0.0',
      course: 'Cloud Computing Lab (24CS01TP0503)',
      serverTime: new Date().toISOString(),
      compute: {
        service: isEc2 ? 'Amazon EC2 (Elastic Compute Cloud)' : 'EC2 Instance / Local Node.js Host',
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        hostname: os.hostname(),
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(os.uptime()),
        iamRoleActive: useIamRole,
      },
      database: {
        service: dbInfo.type,
        host: dbInfo.host,
        port: dbInfo.port,
        name: dbInfo.database,
        status: dbInfo.status,
      },
      storage: {
        service: storageInfo.type,
        bucket: storageInfo.bucket,
        region: storageInfo.region,
        versioningSupported: true,
        iamProfileAccess: useIamRole,
      },
      security: {
        iamLeastPrivilege: true,
        passwordEncryption: 'bcrypt (Salt rounds: 10)',
        apiAuth: 'JSON Web Token (JWT)',
        databaseSecurity: 'Parameterized queries (SQL injection proof)',
      },
      labPracticalMapping: [
        { practicalNo: 'Exp 2', service: 'Amazon EC2', task: 'Web application hosting on EC2 in public subnet', status: 'Implemented' },
        { practicalNo: 'Exp 4', service: 'Amazon S3', task: 'Receipt upload, browser access with signed URLs', status: 'Implemented' },
        { practicalNo: 'Exp 5', service: 'S3 Versioning', task: 'Receipt version history and accidental deletion recovery', status: 'Implemented' },
        { practicalNo: 'Exp 8', service: 'Amazon VPC', task: 'Isolated network, public/private subnets, Internet Gateway', status: 'Architecture Ready' },
        { practicalNo: 'Exp 11', service: 'Amazon RDS', task: 'Relational Database (MySQL) connected via EC2', status: 'Implemented' },
        { practicalNo: 'Exp 12', service: 'AWS IAM & Security', task: 'IAM EC2 roles, Security Groups, bcrypt password hashing', status: 'Implemented' },
      ],
    };

    res.status(200).json({
      success: true,
      data: cloudDetails,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getCloudStatus,
};
