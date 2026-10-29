// =============================================================================
// Excel Data Seeder for Cloud-Based Expense Tracker
// Populates Amazon RDS MySQL with the user's real expense & income sheet data
// Distributed across recent months for realistic Chart.js graphs & analytics
// =============================================================================

const db = require('../backend/config/db');

const excelTransactions = [
  // --- Month 1: October 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Stipend', date: '2026-10-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Mobile Recharge', date: '2026-10-02' },
  { type: 'expense', amount: 486.00, category: 'Food', description: 'Home Food & Groceries', date: '2026-10-03' },
  { type: 'expense', amount: 2330.00, category: 'Shopping', description: 'New Clothes', date: '2026-10-04' },
  { type: 'expense', amount: 1500.00, category: 'Travel', description: 'Weekend Trip Expense', date: '2026-10-05' },
  { type: 'expense', amount: 306.00, category: 'Food', description: 'College Canteen Food', date: '2026-10-06' },
  { type: 'expense', amount: 564.00, category: 'Food', description: 'Cafe Outing', date: '2026-10-07' },
  { type: 'expense', amount: 165.00, category: 'Food', description: 'Amul Dairy & Snacks', date: '2026-10-08' },
  { type: 'expense', amount: 526.00, category: 'Entertainment', description: 'Movie Tickets', date: '2026-10-09' },
  { type: 'expense', amount: 52.00, category: 'Education', description: 'College Stationary', date: '2026-10-10' },

  // --- Month 2: September 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Stipend', date: '2026-09-01' },
  { type: 'expense', amount: 270.00, category: 'Food', description: 'Lunch & Food', date: '2026-09-03' },
  { type: 'expense', amount: 910.00, category: 'Travel', description: 'Vehicle Petrol', date: '2026-09-04' },
  { type: 'expense', amount: 620.00, category: 'Food', description: 'Amul & Dairy Products', date: '2026-09-06' },
  { type: 'expense', amount: 707.00, category: 'Food', description: 'Cafe Meeting', date: '2026-09-08' },
  { type: 'expense', amount: 849.00, category: 'Other', description: 'Friend Birthday Gift', date: '2026-09-12' },
  { type: 'expense', amount: 80.00, category: 'Entertainment', description: 'Movie Matinee', date: '2026-09-15' },
  { type: 'expense', amount: 113.00, category: 'Food', description: 'College Canteen Meal', date: '2026-09-18' },
  { type: 'expense', amount: 72.00, category: 'Food', description: 'Snackify Snacks', date: '2026-09-22' },

  // --- Month 3: August 2026 ---
  { type: 'income', amount: 3017.00, category: 'Salary', description: 'Day Job Stipend + Bonus', date: '2026-08-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Monthly Phone Recharge', date: '2026-08-02' },
  { type: 'expense', amount: 774.00, category: 'Food', description: 'Home Food & Dinner', date: '2026-08-05' },
  { type: 'expense', amount: 1190.00, category: 'Food', description: 'College Food Court', date: '2026-08-07' },
  { type: 'expense', amount: 700.00, category: 'Travel', description: 'Petrol Refuel', date: '2026-08-10' },
  { type: 'expense', amount: 220.00, category: 'Food', description: 'Cold Drinks & Beverages', date: '2026-08-12' },
  { type: 'expense', amount: 199.00, category: 'Food', description: 'Snackify Munchies', date: '2026-08-15' },
  { type: 'expense', amount: 111.00, category: 'Education', description: 'Lab Records & Stationary', date: '2026-08-20' },
  { type: 'expense', amount: 804.00, category: 'Food', description: 'Cafe Coffee & Snacks', date: '2026-08-25' },

  // --- Month 4: July 2026 (Vacation & Trip) ---
  { type: 'income', amount: 4200.00, category: 'Salary', description: 'Day Job + Extra Project', date: '2026-07-01' },
  { type: 'expense', amount: 3180.00, category: 'Travel', description: 'Train Tickets (CSMT)', date: '2026-07-03' },
  { type: 'expense', amount: 3201.00, category: 'Travel', description: 'Hotel Room Stay', date: '2026-07-04' },
  { type: 'expense', amount: 1350.00, category: 'Entertainment', description: 'Imagica Theme Park Pass', date: '2026-07-05' },
  { type: 'expense', amount: 1905.00, category: 'Travel', description: 'Local Transport & Cab', date: '2026-07-06' },
  { type: 'expense', amount: 550.00, category: 'Entertainment', description: 'Water Sports Activities', date: '2026-07-07' },
  { type: 'expense', amount: 606.00, category: 'Food', description: 'Trip Dining & Meals', date: '2026-07-08' },
  { type: 'expense', amount: 4651.00, category: 'Shopping', description: 'Trip Shopping & Clothes', date: '2026-07-10' },
  { type: 'expense', amount: 7254.00, category: 'Other', description: 'Gifts & Souvenirs', date: '2026-07-12' },

  // --- Month 5: June 2026 ---
  { type: 'income', amount: 3025.00, category: 'Salary', description: 'Day Job Stipend', date: '2026-06-01' },
  { type: 'expense', amount: 6000.00, category: 'Healthcare', description: 'Skincare Treatment & Care', date: '2026-06-03' },
  { type: 'expense', amount: 950.00, category: 'Travel', description: 'Petrol Refuel', date: '2026-06-05' },
  { type: 'expense', amount: 922.00, category: 'Food', description: 'College Canteen Dining', date: '2026-06-08' },
  { type: 'expense', amount: 1235.00, category: 'Education', description: 'College Books & Stationary', date: '2026-06-12' },
  { type: 'expense', amount: 2000.00, category: 'Healthcare', description: 'New Eye Glasses & Frame', date: '2026-06-15' },
  { type: 'expense', amount: 359.00, category: 'Food', description: 'Evening Cafe', date: '2026-06-18' },
  { type: 'expense', amount: 243.00, category: 'Other', description: 'Family Gift', date: '2026-06-22' },

  // --- Month 6: May 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Stipend', date: '2026-05-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Quarterly Data Recharge', date: '2026-05-02' },
  { type: 'expense', amount: 1073.68, category: 'Travel', description: 'Monthly Petrol Expense', date: '2026-05-05' },
  { type: 'expense', amount: 683.50, category: 'Travel', description: 'City Metro Pass', date: '2026-05-08' },
  { type: 'expense', amount: 635.00, category: 'Food', description: 'Food & Meals', date: '2026-05-12' },
  { type: 'expense', amount: 570.00, category: 'Entertainment', description: 'Weekend Fun & Outing', date: '2026-05-16' },
  { type: 'expense', amount: 489.00, category: 'Education', description: 'College Assignment Supplies', date: '2026-05-20' },
  { type: 'expense', amount: 300.00, category: 'Other', description: 'Haircut & Grooming', date: '2026-05-24' },
  { type: 'expense', amount: 684.00, category: 'Travel', description: 'Auto Rickshaw Fares', date: '2026-05-27' },
];

async function seedData() {
  console.log('[Excel Seeder] Starting import of your personal sheet data...');

  try {
    // 1. Ensure User 1 exists
    await db.query(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (1, 'Cloud Lab Student', 'demo@cloudlab.edu', 'default_hash')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // 2. Clear previous test records for clean slate
    await db.query('DELETE FROM transactions WHERE user_id = 1');

    // 3. Insert all parsed Excel transactions
    for (const tx of excelTransactions) {
      await db.query(
        `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, tx.type, tx.amount, tx.category, tx.description, tx.date]
      );
    }

    console.log(`[Excel Seeder] Successfully imported ${excelTransactions.length} records into the cloud database!`);
    return { success: true, count: excelTransactions.length };
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
    .catch(() => process.exit(1));
}

module.exports = { seedData, excelTransactions };
