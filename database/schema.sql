-- =============================================================================
-- Cloud-Based Expense Tracker: Database Schema
-- B.Tech CSE Cloud Computing Lab Mini Project
-- Compatible with Amazon RDS for MySQL (MySQL 8.0+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS cloud_expense_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cloud_expense_tracker;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- Stores user accounts with bcrypt hashed passwords
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Transactions Table
-- Stores income and expense records for each user
-- Note: Receipts are stored in Amazon S3, and receipt_key references the S3 object key
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    transaction_date DATE NOT NULL,
    receipt_key VARCHAR(255) DEFAULT NULL,
    receipt_filename VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_positive_amount
        CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Indexes for Optimized Query Performance on Amazon RDS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_transactions_user_date ON transactions (user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions (user_id, category);
CREATE INDEX idx_transactions_user_type ON transactions (user_id, type);

-- -----------------------------------------------------------------------------
-- 4. Default User & Personal Expense Dataset (Cleaned from Excel sheet)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash)
VALUES (1, 'Cloud Lab Student', 'demo@cloudlab.edu', '$2a$10$wQ9K48E0dJ6ZpZ0PjB7w1uB1Q1Rsm6G7OqYxG5k7cT5n3FkRz3F2e')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO transactions (user_id, type, amount, category, description, transaction_date) VALUES
(1, 'income', 3000.00, 'Salary', 'Day Job Monthly Stipend', '2026-10-01'),
(1, 'expense', 899.00, 'Bills', 'Monthly Phone & Data Recharge', '2026-10-02'),
(1, 'expense', 486.00, 'Food', 'Groceries & Home Food', '2026-10-03'),
(1, 'expense', 2330.00, 'Shopping', 'New Clothes & Apparel', '2026-10-04'),
(1, 'expense', 1500.00, 'Travel', 'Weekend Trip Travel Expenses', '2026-10-05'),
(1, 'expense', 306.00, 'Food', 'College Canteen Meal', '2026-10-06'),
(1, 'expense', 564.00, 'Food', 'Cafe Outing with Friends', '2026-10-07'),
(1, 'expense', 165.00, 'Food', 'Amul Dairy & Ice Cream', '2026-10-08'),
(1, 'expense', 526.00, 'Entertainment', 'Weekend Movie Tickets', '2026-10-09'),
(1, 'expense', 52.00, 'Education', 'Exam Stationary & Pens', '2026-10-10'),
(1, 'expense', 910.00, 'Travel', 'Two-Wheeler Petrol Refuel', '2026-10-14'),
(1, 'expense', 849.00, 'Other', 'Friend Birthday Gift', '2026-10-18'),
(1, 'expense', 72.00, 'Food', 'Snackify Evening Munchies', '2026-10-22'),
(1, 'income', 3017.00, 'Salary', 'Day Job Monthly Stipend', '2026-09-01'),
(1, 'expense', 899.00, 'Bills', 'Broadband / Data Recharge', '2026-09-02'),
(1, 'expense', 774.00, 'Food', 'Dinner & Food Supplies', '2026-09-04'),
(1, 'expense', 1190.00, 'Food', 'College Cafeteria Dining', '2026-09-06'),
(1, 'expense', 700.00, 'Travel', 'Vehicle Petrol', '2026-09-08'),
(1, 'expense', 220.00, 'Food', 'Beverages & Soft Drinks', '2026-09-11'),
(1, 'expense', 199.00, 'Food', 'Snackify Snacks', '2026-09-14'),
(1, 'expense', 111.00, 'Education', 'Lab Journal & Stationary', '2026-09-18'),
(1, 'expense', 804.00, 'Food', 'Coffee & Cafe Outing', '2026-09-22'),
(1, 'expense', 694.00, 'Shopping', 'Casual Wear Clothes', '2026-09-26'),
(1, 'income', 4200.00, 'Salary', 'Day Job + Lab Project Honorarium', '2026-08-01'),
(1, 'expense', 899.00, 'Bills', 'Monthly Phone Recharge', '2026-08-02'),
(1, 'expense', 3180.00, 'Travel', 'Train Tickets (CSMT Express)', '2026-08-04'),
(1, 'expense', 3201.00, 'Travel', 'Resort & Room Stay Booking', '2026-08-05'),
(1, 'expense', 1350.00, 'Entertainment', 'Theme Park & Imagica Entry Pass', '2026-08-06'),
(1, 'expense', 1905.00, 'Travel', 'Local Sightseeing & Taxi Cab', '2026-08-07'),
(1, 'expense', 550.00, 'Entertainment', 'Water Sports Adventure', '2026-08-08'),
(1, 'expense', 606.00, 'Food', 'Trip Restaurants & Meals', '2026-08-09'),
(1, 'expense', 4651.00, 'Shopping', 'Vacation Shopping & Apparel', '2026-08-11'),
(1, 'expense', 7254.00, 'Other', 'Family & Friends Return Gifts', '2026-08-14'),
(1, 'expense', 1150.00, 'Shopping', 'Handicraft & Souvenir Shopping', '2026-08-18'),
(1, 'expense', 364.00, 'Travel', 'Car Fuel & Highway Tolls', '2026-08-20'),
(1, 'income', 3004.00, 'Salary', 'Day Job Monthly Stipend', '2026-07-01'),
(1, 'expense', 6000.00, 'Healthcare', 'Skincare Consultation & Products', '2026-07-03'),
(1, 'expense', 1235.00, 'Education', 'College Textbooks & Reference Guides', '2026-07-05'),
(1, 'expense', 900.00, 'Travel', 'Monthly Petrol Refill', '2026-07-08'),
(1, 'expense', 404.00, 'Food', 'College Lunch & Meals', '2026-07-12'),
(1, 'expense', 359.00, 'Food', 'Cafe Snacks & Beverages', '2026-07-16'),
(1, 'expense', 200.00, 'Food', 'Amul Ice Cream & Dessert', '2026-07-20'),
(1, 'expense', 280.00, 'Other', 'Friend Friendship Day Gift', '2026-07-24'),
(1, 'expense', 140.00, 'Food', 'Snackify Munchies', '2026-07-28'),
(1, 'income', 3025.00, 'Salary', 'Day Job Monthly Stipend', '2026-06-01'),
(1, 'expense', 899.00, 'Bills', 'Quarterly Phone Plan Recharge', '2026-06-02'),
(1, 'expense', 2227.00, 'Healthcare', 'Dermatologist & Skin Care', '2026-06-05'),
(1, 'expense', 950.00, 'Travel', 'Two-Wheeler Petrol Fuel', '2026-06-08'),
(1, 'expense', 922.00, 'Food', 'College Canteen Daily Meals', '2026-06-12'),
(1, 'expense', 2000.00, 'Healthcare', 'Prescription Glasses & Lens Frame', '2026-06-16'),
(1, 'expense', 920.00, 'Education', 'Engineering Drawing & Stationary', '2026-06-20'),
(1, 'expense', 3139.00, 'Shopping', 'Monsoon Wardrobe Clothes', '2026-06-23'),
(1, 'expense', 1789.00, 'Other', 'Sibling Birthday Gift', '2026-06-27'),
(1, 'income', 3038.00, 'Salary', 'Day Job Monthly Stipend', '2026-05-01'),
(1, 'expense', 695.00, 'Food', 'Home Food & Lunch', '2026-05-03'),
(1, 'expense', 280.00, 'Education', 'Notebooks & File Folders', '2026-05-06'),
(1, 'expense', 730.00, 'Travel', 'Bike Petrol Refuel', '2026-05-09'),
(1, 'expense', 631.00, 'Food', 'College Canteen Meals', '2026-05-12'),
(1, 'expense', 323.00, 'Food', 'Ice Cream & Desserts', '2026-05-16'),
(1, 'expense', 250.00, 'Food', 'Evening Cafe Coffee', '2026-05-20'),
(1, 'expense', 5901.00, 'Shopping', 'College Festival Clothes', '2026-05-24'),
(1, 'expense', 738.00, 'Entertainment', 'IMAX Movie Outing', '2026-05-28'),
(1, 'income', 3000.00, 'Salary', 'Day Job Monthly Stipend', '2026-04-01'),
(1, 'expense', 899.00, 'Bills', 'Monthly Phone Recharge', '2026-04-02'),
(1, 'expense', 1073.68, 'Travel', 'Monthly Petrol Expense', '2026-04-04'),
(1, 'expense', 683.50, 'Travel', 'Metro Rail Smart Card Recharge', '2026-04-07'),
(1, 'expense', 635.00, 'Food', 'Daily Food & Lunch', '2026-04-11'),
(1, 'expense', 570.00, 'Entertainment', 'College Sports & Fun Day', '2026-04-15'),
(1, 'expense', 489.00, 'Education', 'Project Printouts & Stationary', '2026-04-18'),
(1, 'expense', 300.00, 'Other', 'Salon Haircut & Grooming', '2026-04-22'),
(1, 'expense', 684.00, 'Travel', 'Auto Rickshaw City Commute', '2026-04-26'),
(1, 'income', 3000.00, 'Salary', 'Day Job Monthly Stipend', '2026-03-01'),
(1, 'expense', 401.00, 'Bills', 'Data Pack Recharge', '2026-03-03'),
(1, 'expense', 342.00, 'Food', 'Home Food Supplies', '2026-03-06'),
(1, 'expense', 475.00, 'Food', 'Chips, Snacks & Beverages', '2026-03-10'),
(1, 'expense', 225.00, 'Travel', 'Metro Fares', '2026-03-14'),
(1, 'expense', 223.00, 'Entertainment', 'Cinema Ticket', '2026-03-18'),
(1, 'expense', 264.00, 'Travel', 'Ola/Uber Cab Ride', '2026-03-22'),
(1, 'expense', 150.00, 'Travel', 'Auto Rickshaw Travel', '2026-03-26'),
(1, 'expense', 74.00, 'Food', 'Maggi & Hot Snacks', '2026-03-29'),
(1, 'income', 3000.00, 'Salary', 'Day Job Monthly Stipend', '2026-02-01'),
(1, 'expense', 899.00, 'Bills', 'Quarterly SIM Recharge', '2026-02-02'),
(1, 'expense', 591.00, 'Food', 'College Meals & Dinners', '2026-02-05'),
(1, 'expense', 248.00, 'Food', 'Cafe Drinks & Softy', '2026-02-09'),
(1, 'expense', 154.00, 'Education', 'Assignments & Stationary', '2026-02-13'),
(1, 'expense', 154.00, 'Travel', 'City Metro Transit', '2026-02-17'),
(1, 'expense', 85.00, 'Travel', 'Auto Commute', '2026-02-21'),
(1, 'expense', 65.00, 'Food', 'Snacks & Soft Drink', '2026-02-25')
ON DUPLICATE KEY UPDATE id=id;
