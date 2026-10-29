// =============================================================================
// Cleaned & Standardized Personal Expense Dataset
// Derived from User's Excel Records for Cloud-Based Expense Tracker
// Organized across 2026 with consistent categories, dates, and amounts
// =============================================================================

const cleanedTransactions = [
  // --- OCTOBER 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-10-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Monthly Phone & Data Recharge', date: '2026-10-02' },
  { type: 'expense', amount: 486.00, category: 'Food', description: 'Groceries & Home Food', date: '2026-10-03' },
  { type: 'expense', amount: 2330.00, category: 'Shopping', description: 'New Clothes & Apparel', date: '2026-10-04' },
  { type: 'expense', amount: 1500.00, category: 'Travel', description: 'Weekend Trip Travel Expenses', date: '2026-10-05' },
  { type: 'expense', amount: 306.00, category: 'Food', description: 'College Canteen Meal', date: '2026-10-06' },
  { type: 'expense', amount: 564.00, category: 'Food', description: 'Cafe Outing with Friends', date: '2026-10-07' },
  { type: 'expense', amount: 165.00, category: 'Food', description: 'Amul Dairy & Ice Cream', date: '2026-10-08' },
  { type: 'expense', amount: 526.00, category: 'Entertainment', description: 'Weekend Movie Tickets', date: '2026-10-09' },
  { type: 'expense', amount: 52.00, category: 'Education', description: 'Exam Stationary & Pens', date: '2026-10-10' },
  { type: 'expense', amount: 910.00, category: 'Travel', description: 'Two-Wheeler Petrol Refuel', date: '2026-10-14' },
  { type: 'expense', amount: 849.00, category: 'Other', description: 'Friend Birthday Gift', date: '2026-10-18' },
  { type: 'expense', amount: 72.00, category: 'Food', description: 'Snackify Evening Munchies', date: '2026-10-22' },

  // --- SEPTEMBER 2026 ---
  { type: 'income', amount: 3017.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-09-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Broadband / Data Recharge', date: '2026-09-02' },
  { type: 'expense', amount: 774.00, category: 'Food', description: 'Dinner & Food Supplies', date: '2026-09-04' },
  { type: 'expense', amount: 1190.00, category: 'Food', description: 'College Cafeteria Dining', date: '2026-09-06' },
  { type: 'expense', amount: 700.00, category: 'Travel', description: 'Vehicle Petrol', date: '2026-09-08' },
  { type: 'expense', amount: 220.00, category: 'Food', description: 'Beverages & Soft Drinks', date: '2026-09-11' },
  { type: 'expense', amount: 199.00, category: 'Food', description: 'Snackify Snacks', date: '2026-09-14' },
  { type: 'expense', amount: 111.00, category: 'Education', description: 'Lab Journal & Stationary', date: '2026-09-18' },
  { type: 'expense', amount: 804.00, category: 'Food', description: 'Coffee & Cafe Outing', date: '2026-09-22' },
  { type: 'expense', amount: 694.00, category: 'Shopping', description: 'Casual Wear Clothes', date: '2026-09-26' },

  // --- AUGUST 2026 (Major Trip & Vacation) ---
  { type: 'income', amount: 4200.00, category: 'Salary', description: 'Day Job + Lab Project Honorarium', date: '2026-08-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Monthly Phone Recharge', date: '2026-08-02' },
  { type: 'expense', amount: 3180.00, category: 'Travel', description: 'Train Tickets (CSMT Express)', date: '2026-08-04' },
  { type: 'expense', amount: 3201.00, category: 'Travel', description: 'Resort & Room Stay Booking', date: '2026-08-05' },
  { type: 'expense', amount: 1350.00, category: 'Entertainment', description: 'Theme Park & Imagica Entry Pass', date: '2026-08-06' },
  { type: 'expense', amount: 1905.00, category: 'Travel', description: 'Local Sightseeing & Taxi Cab', date: '2026-08-07' },
  { type: 'expense', amount: 550.00, category: 'Entertainment', description: 'Water Sports Adventure', date: '2026-08-08' },
  { type: 'expense', amount: 606.00, category: 'Food', description: 'Trip Restaurants & Meals', date: '2026-08-09' },
  { type: 'expense', amount: 4651.00, category: 'Shopping', description: 'Vacation Shopping & Apparel', date: '2026-08-11' },
  { type: 'expense', amount: 7254.00, category: 'Other', description: 'Family & Friends Return Gifts', date: '2026-08-14' },
  { type: 'expense', amount: 1150.00, category: 'Shopping', description: 'Handicraft & Souvenir Shopping', date: '2026-08-18' },
  { type: 'expense', amount: 364.00, category: 'Travel', description: 'Car Fuel & Highway Tolls', date: '2026-08-20' },

  // --- JULY 2026 ---
  { type: 'income', amount: 3004.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-07-01' },
  { type: 'expense', amount: 6000.00, category: 'Healthcare', description: 'Skincare Consultation & Products', date: '2026-07-03' },
  { type: 'expense', amount: 1235.00, category: 'Education', description: 'College Textbooks & Reference Guides', date: '2026-07-05' },
  { type: 'expense', amount: 900.00, category: 'Travel', description: 'Monthly Petrol Refill', date: '2026-07-08' },
  { type: 'expense', amount: 404.00, category: 'Food', description: 'College Lunch & Meals', date: '2026-07-12' },
  { type: 'expense', amount: 359.00, category: 'Food', description: 'Cafe Snacks & Beverages', date: '2026-07-16' },
  { type: 'expense', amount: 200.00, category: 'Food', description: 'Amul Ice Cream & Dessert', date: '2026-07-20' },
  { type: 'expense', amount: 280.00, category: 'Other', description: 'Friend Friendship Day Gift', date: '2026-07-24' },
  { type: 'expense', amount: 140.00, category: 'Food', description: 'Snackify Munchies', date: '2026-07-28' },

  // --- JUNE 2026 ---
  { type: 'income', amount: 3025.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-06-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Quarterly Phone Plan Recharge', date: '2026-06-02' },
  { type: 'expense', amount: 2227.00, category: 'Healthcare', description: 'Dermatologist & Skin Care', date: '2026-06-05' },
  { type: 'expense', amount: 950.00, category: 'Travel', description: 'Two-Wheeler Petrol Fuel', date: '2026-06-08' },
  { type: 'expense', amount: 922.00, category: 'Food', description: 'College Canteen Daily Meals', date: '2026-06-12' },
  { type: 'expense', amount: 2000.00, category: 'Healthcare', description: 'Prescription Glasses & Lens Frame', date: '2026-06-16' },
  { type: 'expense', amount: 920.00, category: 'Education', description: 'Engineering Drawing & Stationary', date: '2026-06-20' },
  { type: 'expense', amount: 3139.00, category: 'Shopping', description: 'Monsoon Wardrobe Clothes', date: '2026-06-23' },
  { type: 'expense', amount: 1789.00, category: 'Other', description: 'Sibling Birthday Gift', date: '2026-06-27' },

  // --- MAY 2026 ---
  { type: 'income', amount: 3038.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-05-01' },
  { type: 'expense', amount: 695.00, category: 'Food', description: 'Home Food & Lunch', date: '2026-05-03' },
  { type: 'expense', amount: 280.00, category: 'Education', description: 'Notebooks & File Folders', date: '2026-05-06' },
  { type: 'expense', amount: 730.00, category: 'Travel', description: 'Bike Petrol Refuel', date: '2026-05-09' },
  { type: 'expense', amount: 631.00, category: 'Food', description: 'College Canteen Meals', date: '2026-05-12' },
  { type: 'expense', amount: 323.00, category: 'Food', description: 'Ice Cream & Desserts', date: '2026-05-16' },
  { type: 'expense', amount: 250.00, category: 'Food', description: 'Evening Cafe Coffee', date: '2026-05-20' },
  { type: 'expense', amount: 5901.00, category: 'Shopping', description: 'College Festival Clothes', date: '2026-05-24' },
  { type: 'expense', amount: 738.00, category: 'Entertainment', description: 'IMAX Movie Outing', date: '2026-05-28' },

  // --- APRIL 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-04-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Monthly Phone Recharge', date: '2026-04-02' },
  { type: 'expense', amount: 1073.68, category: 'Travel', description: 'Monthly Petrol Expense', date: '2026-04-04' },
  { type: 'expense', amount: 683.50, category: 'Travel', description: 'Metro Rail Smart Card Recharge', date: '2026-04-07' },
  { type: 'expense', amount: 635.00, category: 'Food', description: 'Daily Food & Lunch', date: '2026-04-11' },
  { type: 'expense', amount: 570.00, category: 'Entertainment', description: 'College Sports & Fun Day', date: '2026-04-15' },
  { type: 'expense', amount: 489.00, category: 'Education', description: 'Project Printouts & Stationary', date: '2026-04-18' },
  { type: 'expense', amount: 300.00, category: 'Other', description: 'Salon Haircut & Grooming', date: '2026-04-22' },
  { type: 'expense', amount: 684.00, category: 'Travel', description: 'Auto Rickshaw City Commute', date: '2026-04-26' },

  // --- MARCH 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-03-01' },
  { type: 'expense', amount: 401.00, category: 'Bills', description: 'Data Pack Recharge', date: '2026-03-03' },
  { type: 'expense', amount: 342.00, category: 'Food', description: 'Home Food Supplies', date: '2026-03-06' },
  { type: 'expense', amount: 475.00, category: 'Food', description: 'Chips, Snacks & Beverages', date: '2026-03-10' },
  { type: 'expense', amount: 225.00, category: 'Travel', description: 'Metro Fares', date: '2026-03-14' },
  { type: 'expense', amount: 223.00, category: 'Entertainment', description: 'Cinema Ticket', date: '2026-03-18' },
  { type: 'expense', amount: 264.00, category: 'Travel', description: 'Ola/Uber Cab Ride', date: '2026-03-22' },
  { type: 'expense', amount: 150.00, category: 'Travel', description: 'Auto Rickshaw Travel', date: '2026-03-26' },
  { type: 'expense', amount: 74.00, category: 'Food', description: 'Maggi & Hot Snacks', date: '2026-03-29' },

  // --- FEBRUARY 2026 ---
  { type: 'income', amount: 3000.00, category: 'Salary', description: 'Day Job Monthly Stipend', date: '2026-02-01' },
  { type: 'expense', amount: 899.00, category: 'Bills', description: 'Quarterly SIM Recharge', date: '2026-02-02' },
  { type: 'expense', amount: 591.00, category: 'Food', description: 'College Meals & Dinners', date: '2026-02-05' },
  { type: 'expense', amount: 248.00, category: 'Food', description: 'Cafe Drinks & Softy', date: '2026-02-09' },
  { type: 'expense', amount: 154.00, category: 'Education', description: 'Assignments & Stationary', date: '2026-02-13' },
  { type: 'expense', amount: 154.00, category: 'Travel', description: 'City Metro Transit', date: '2026-02-17' },
  { type: 'expense', amount: 85.00, category: 'Travel', description: 'Auto Commute', date: '2026-02-21' },
  { type: 'expense', amount: 65.00, category: 'Food', description: 'Snacks & Soft Drink', date: '2026-02-25' },
];

module.exports = cleanedTransactions;
