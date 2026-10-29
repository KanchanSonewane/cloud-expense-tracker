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
-- Stores registered user accounts with securely hashed passwords (bcrypt)
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
-- 3. Indexes for Optimized Query Performance
-- Optimizes filtering by user, date range, category, and type on Amazon RDS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_transactions_user_date ON transactions (user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions (user_id, category);
CREATE INDEX idx_transactions_user_type ON transactions (user_id, type);

-- -----------------------------------------------------------------------------
-- Optional Sample Demonstration Data
-- Password for demo user (demo@cloudlab.edu): "Demo@1234"
-- bcrypt hash: $2a$10$wQ9K48E0dJ6ZpZ0PjB7w1uB1Q1Rsm6G7OqYxG5k7cT5n3FkRz3F2e
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash)
VALUES (1, 'Cloud Lab Demo User', 'demo@cloudlab.edu', '$2a$10$0WpYQ7aKqOq/qP9qYdJp7.1n5o9hZk1P0sUeB1xU1d2fG7a6QhO6m')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
VALUES
(1, 'income', 25000.00, 'Salary', 'Monthly Lab Assistant Stipend', CURDATE()),
(1, 'expense', 450.00, 'Food', 'Cafeteria Lunch & Snacks', CURDATE()),
(1, 'expense', 1200.00, 'Travel', 'Metro Monthly Pass', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(1, 'expense', 850.00, 'Education', 'Cloud Computing Reference Books', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(1, 'expense', 1500.00, 'Bills', 'Broadband Internet Bill', DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(1, 'expense', 600.00, 'Entertainment', 'Weekend Movie Ticket', DATE_SUB(CURDATE(), INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE id=id;
