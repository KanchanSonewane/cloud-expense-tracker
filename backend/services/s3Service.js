// =============================================================================
// Amazon S3 Storage Service
// Handles receipt uploads, presigned URL generation, and S3 Versioning
// Lab Mapping: Practical 4 (S3 Storage), Practical 5 (S3 Versioning & Recovery)
// =============================================================================

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectVersionsCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');
const { s3Client, bucketName, region, isS3Configured, useIamRole } = require('../config/aws');

const localUploadDir = path.join(__dirname, '..', '..', 'uploads');
const versionsManifestPath = path.join(localUploadDir, 'versions_manifest.json');

// Ensure local fallback directory exists
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

// Helper to sanitize filenames
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Local version manifest helper for offline simulation
function getLocalManifest() {
  if (fs.existsSync(versionsManifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(versionsManifestPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveLocalManifest(manifest) {
  fs.writeFileSync(versionsManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

/**
 * Upload receipt document to Amazon S3
 * @param {Buffer} buffer - File buffer
 * @param {string} originalFilename - Original client file name
 * @param {string} mimeType - File MIME type (image/png, image/jpeg, application/pdf)
 * @param {number|string} userId - ID of the user owning the transaction
 * @param {string} [customKey] - Optional existing key to overwrite (for S3 versioning demo)
 */
async function uploadReceipt(buffer, originalFilename, mimeType, userId, customKey = null) {
  const cleanName = sanitizeFilename(originalFilename);
  const key = customKey || `receipts/user_${userId}/${Date.now()}_${cleanName}`;

  if (isS3Configured && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': encodeURIComponent(originalFilename),
          'user-id': String(userId),
          'uploaded-at': new Date().toISOString(),
        },
      });

      const response = await s3Client.send(command);
      console.log(`[Amazon S3] Successfully uploaded "${key}" to bucket "${bucketName}". VersionId: ${response.VersionId || 'N/A'}`);

      return {
        key,
        filename: originalFilename,
        versionId: response.VersionId || null,
        storageType: 's3',
        bucket: bucketName,
        region,
      };
    } catch (err) {
      console.error('[Amazon S3 Error] Upload failed:', err);
      throw new Error(`Failed to upload receipt to Amazon S3: ${err.message}`);
    }
  }

  // Offline / Local storage fallback
  console.log(`[Storage Notice] Amazon S3 not active. Storing receipt locally in: ${localUploadDir}`);
  const userDir = path.join(localUploadDir, `user_${userId}`);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const filenameOnly = path.basename(key);
  const filePath = path.join(userDir, filenameOnly);
  fs.writeFileSync(filePath, buffer);

  // Maintain local version tracking for lab demonstrations when offline
  const manifest = getLocalManifest();
  if (!manifest[key]) {
    manifest[key] = [];
  }
  const simulatedVersionId = 'v' + (manifest[key].length + 1) + '-' + Date.now().toString(36);
  manifest[key].unshift({
    versionId: simulatedVersionId,
    lastModified: new Date().toISOString(),
    size: buffer.length,
    isLatest: true,
  });
  // Mark previous versions as not latest
  for (let i = 1; i < manifest[key].length; i++) {
    manifest[key][i].isLatest = false;
  }
  saveLocalManifest(manifest);

  return {
    key,
    filename: originalFilename,
    versionId: simulatedVersionId,
    storageType: 'local_fallback',
    localPath: filePath,
  };
}

/**
 * Generate a secure presigned URL for viewing/downloading the receipt from Amazon S3
 * @param {string} key - S3 object key
 * @param {string} [versionId] - Optional S3 Version ID to retrieve a specific historical version
 */
async function getReceiptUrl(key, versionId = null) {
  if (!key) return null;

  if (isS3Configured && s3Client) {
    try {
      const getObjectParams = {
        Bucket: bucketName,
        Key: key,
      };
      if (versionId) {
        getObjectParams.VersionId = versionId;
      }

      const command = new GetObjectCommand(getObjectParams);
      // Presigned URL valid for 1 hour (3600 seconds)
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return presignedUrl;
    } catch (err) {
      console.error('[Amazon S3 Error] Presigned URL generation failed:', err);
      throw new Error(`Failed to generate receipt access URL from Amazon S3: ${err.message}`);
    }
  }

  // Local fallback path
  return `/uploads/${key.replace('receipts/', '')}`;
}

/**
 * List all historical versions of an object from Amazon S3
 * Lab Practical 5 Requirement: Demonstrate S3 Versioning & recovery of previous versions
 * @param {string} key - S3 object key
 */
async function listReceiptVersions(key) {
  if (!key) return [];

  if (isS3Configured && s3Client) {
    try {
      const command = new ListObjectVersionsCommand({
        Bucket: bucketName,
        Prefix: key,
      });

      const response = await s3Client.send(command);

      const versions = (response.Versions || [])
        .filter((v) => v.Key === key)
        .map((v) => ({
          versionId: v.VersionId,
          isLatest: v.IsLatest,
          lastModified: v.LastModified,
          size: v.Size,
          eTag: v.ETag,
          type: 'version',
        }));

      const deleteMarkers = (response.DeleteMarkers || [])
        .filter((d) => d.Key === key)
        .map((d) => ({
          versionId: d.VersionId,
          isLatest: d.IsLatest,
          lastModified: d.LastModified,
          type: 'delete_marker',
        }));

      return {
        key,
        bucket: bucketName,
        versions,
        deleteMarkers,
        versioningEnabled: true,
      };
    } catch (err) {
      console.error('[Amazon S3 Error] ListObjectVersions failed:', err);
      throw new Error(`Failed to fetch S3 object versions: ${err.message}`);
    }
  }

  // Offline simulation fallback
  const manifest = getLocalManifest();
  const versions = manifest[key] || [
    {
      versionId: 'v1-initial',
      isLatest: true,
      lastModified: new Date().toISOString(),
      size: 1024,
      type: 'version',
    },
  ];

  return {
    key,
    bucket: 'local-storage-demo',
    versions,
    deleteMarkers: [],
    versioningEnabled: true,
  };
}

/**
 * Delete receipt object or specific version from Amazon S3
 * In a versioned S3 bucket:
 * - Calling without versionId places a Delete Marker (soft delete, can be recovered)
 * - Deleting the delete marker restores the file!
 */
async function deleteReceipt(key, versionId = null) {
  if (!key) return;

  if (isS3Configured && s3Client) {
    try {
      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };
      if (versionId) {
        deleteParams.VersionId = versionId;
      }
      const command = new DeleteObjectCommand(deleteParams);
      const response = await s3Client.send(command);
      console.log(`[Amazon S3] Deleted object "${key}" (DeleteMarker: ${response.DeleteMarker}, VersionId: ${response.VersionId})`);
      return response;
    } catch (err) {
      console.error('[Amazon S3 Error] Delete failed:', err);
      throw new Error(`Failed to delete object from S3: ${err.message}`);
    }
  }

  // Local fallback
  const localFile = path.join(localUploadDir, key.replace('receipts/', ''));
  if (fs.existsSync(localFile) && !versionId) {
    fs.unlinkSync(localFile);
  }
}

/**
 * Get service diagnostic info for lab check
 */
function getStorageInfo() {
  return {
    type: isS3Configured ? 'Amazon S3' : 'Local Storage (Offline Fallback)',
    bucket: bucketName || 'Not configured',
    region: region,
    useIamRole: useIamRole,
    isS3Configured: isS3Configured,
  };
}

module.exports = {
  uploadReceipt,
  getReceiptUrl,
  listReceiptVersions,
  deleteReceipt,
  getStorageInfo,
};
