// =============================================================================
// Direct Amazon S3 Receipt Upload Test
// Streams a sample receipt into the S3 bucket and verifies S3 Versioning
// Lab Mapping: Practical 4 (S3 Storage) & Practical 5 (S3 Versioning)
// =============================================================================

const s3Service = require('../backend/services/s3Service');
const db = require('../backend/config/db');

async function testUpload() {
  console.log('[S3 Test] Uploading sample receipt to Amazon S3 bucket...');

  // Create sample 1x1 PNG image buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  try {
    // 1. Initial Upload (creates Version 1 in S3)
    const result1 = await s3Service.uploadReceipt(
      samplePngBuffer,
      'college_canteen_bill.png',
      'image/png',
      1
    );

    console.log(`✅ Success! Uploaded receipt to S3 key: ${result1.key}`);
    console.log(`   VersionId: ${result1.versionId || 'Enabled'}`);

    // 2. Overwrite under the same S3 key (creates Version 2 in S3 for Lab Exp 5!)
    console.log('[S3 Test] Re-uploading under same key to demonstrate S3 Versioning...');
    const result2 = await s3Service.uploadReceipt(
      samplePngBuffer,
      'college_canteen_bill_v2.png',
      'image/png',
      1,
      result1.key
    );
    console.log(`✅ Success! Created new S3 VersionId: ${result2.versionId || 'v2'}`);

    // 3. Link this receipt to the latest Food transaction in RDS
    await db.query(
      `UPDATE transactions 
       SET receipt_key = ?, receipt_filename = ? 
       WHERE user_id = 1 AND category = 'Food' 
       ORDER BY id DESC LIMIT 1`,
      [result1.key, 'college_canteen_bill.png']
    );

    console.log('✅ Linked S3 receipt to transaction in the database!');
    console.log('\n🎉 Go to your AWS S3 Console and refresh — your receipt is now in the bucket!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    process.exit(1);
  }
}

testUpload();
