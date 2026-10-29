// =============================================================================
// Excel Data Seeder for Cloud-Based Expense Tracker
// Populates Amazon RDS MySQL with the user's real expense & income sheet data
// Distributed across 2026 for realistic Chart.js graphs & analytics
// =============================================================================

const db = require('../backend/config/db');
const cleanedTransactions = require('./cleaned-transactions');

async function seedData() {
  console.log(`[Excel Seeder] Importing ${cleanedTransactions.length} cleaned personal transactions into database...`);

  try {
    // 1. Ensure User 1 exists
    const [existing] = await db.query('SELECT id FROM users WHERE id = 1');
    if (!existing || existing.length === 0) {
      await db.query(`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (1, 'Cloud Lab Student', 'demo@cloudlab.edu', 'default_hash')
      `);
    }

    // 2. Clear previous test records for clean slate
    await db.query('DELETE FROM transactions WHERE user_id = 1');

    // 3. Insert all parsed Excel transactions
    for (const tx of cleanedTransactions) {
      await db.query(
        `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, tx.type, tx.amount, tx.category, tx.description, tx.date]
      );
    }

    console.log(`[Excel Seeder] Successfully imported ${cleanedTransactions.length} records into the cloud database!`);
    return { success: true, count: cleanedTransactions.length };
  } catch (err) {
    console.error('[Excel Seeder Error]:', err.message);
    throw err;
  }
}

// Execute directly if run as a script
if (require.main === module) {
  seedData()
    .then((res) => {
      console.log(`🎉 Done! ${res.count} transactions are now live in the database.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData, cleanedTransactions };
