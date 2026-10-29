// =============================================================================
// Database Configuration and Connection Pool
// Primary: Amazon RDS for MySQL (MySQL 8.0+)
// Auto-creates database and tables on RDS seamlessly
// Lab Mapping: Practical 11 (RDS MySQL & EC2 Connection)
// =============================================================================

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let sqliteDb = null;
let activeDbType = 'mysql'; // 'mysql' (Amazon RDS) or 'sqlite' (local fallback)
let dbStatus = 'connecting';
let lastDbError = null;

const targetDbName = process.env.DB_NAME || 'cloud_expense_tracker';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '',
  database: targetDbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000,
};

// Auto-initialize MySQL schema if tables do not exist
async function initMySQLSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
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
      CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT chk_positive_amount CHECK (amount > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (1, 'Cloud Lab Student', 'demo@cloudlab.edu', '$2a$10$wQ9K48E0dJ6ZpZ0PjB7w1uB1Q1Rsm6G7OqYxG5k7cT5n3FkRz3F2e')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `);
}

// Convert MySQL DATE_SUB/CURDATE syntax or parameter placeholders if executing on SQLite
function adaptQueryForSqlite(sql) {
  return sql
    .replace(/CURDATE\(\)/gi, "date('now')")
    .replace(/DATE_SUB\(date\('now'\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "date('now', '-$1 days')")
    .replace(/DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "date('now', '-$1 days')")
    .replace(/NOW\(\)/gi, "datetime('now')");
}

function executeSqliteQuery(sql, params = []) {
  const adaptedSql = adaptQueryForSqlite(sql);
  const trimmed = adaptedSql.trim();
  const isSelect = /^SELECT/i.test(trimmed);

  try {
    const stmt = sqliteDb.prepare(adaptedSql);
    if (isSelect) {
      const rows = stmt.all(...params);
      return [rows, []];
    } else {
      const info = stmt.run(...params);
      return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
    }
  } catch (err) {
    throw err;
  }
}

// Setup and connect
async function initializeDatabase() {
  const forceSqlite = process.env.DB_CLIENT === 'sqlite' || process.env.USE_LOCAL_SQLITE === 'true';

  if (!forceSqlite) {
    try {
      console.log(`[Amazon RDS / MySQL] Connecting to ${config.host}:${config.port}...`);

      // Step 1: Connect to MySQL server without forcing a database name
      // This allows auto-creating the database if RDS was launched without an initial DB
      let preConn = null;
      try {
        preConn = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          connectTimeout: 7000,
        });

        await preConn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await preConn.end();
      } catch (preErr) {
        // If connecting without DB failed, continue and let createPool attempt connection
        console.warn(`[Amazon RDS Notice] Pre-connection check: ${preErr.message}`);
      }

      // Step 2: Initialize connection pool
      pool = mysql.createPool(config);
      const connection = await pool.getConnection();
      console.log(`[Amazon RDS / MySQL] Successfully connected to database "${config.database}" on ${config.host}!`);

      // Step 3: Initialize schema & default user
      await initMySQLSchema(connection);
      connection.release();

      activeDbType = 'mysql';
      dbStatus = 'connected';
      lastDbError = null;
      return;
    } catch (err) {
      lastDbError = err.message;
      console.error(`[Amazon RDS / MySQL Error] ${err.message}`);
      console.log('[DATABASE NOTICE] Attempting local SQLite fallback for offline development...');
    }
  }

  // Attempt SQLite fallback (available on Node.js 22+)
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbDir = path.join(__dirname, '..', '..', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'expense_tracker.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO users (id, name, email, password_hash)
      VALUES (1, 'Cloud Lab Student', 'demo@cloudlab.edu', 'mock_hash');

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL CHECK(amount > 0),
        category TEXT NOT NULL,
        description TEXT,
        transaction_date TEXT NOT NULL,
        receipt_key TEXT,
        receipt_filename TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    activeDbType = 'sqlite';
    dbStatus = 'connected (local fallback)';
    console.log(`[Database SQLite] Local database active at: ${dbPath}`);
  } catch (sqliteErr) {
    dbStatus = `Database connection failed. ${lastDbError || sqliteErr.message}`;
    console.error('[Database Status] Could not connect to RDS MySQL:', lastDbError || sqliteErr.message);
  }
}

// Unified query function
async function query(sql, params = []) {
  if (activeDbType === 'mysql' && pool) {
    return await pool.query(sql, params);
  } else if (activeDbType === 'sqlite' && sqliteDb) {
    return executeSqliteQuery(sql, params);
  } else {
    // If database connection is failing, return a descriptive error so user knows what to fix in .env
    throw new Error(`Database Error: ${lastDbError || 'Database not connected. Please verify DB_PASSWORD and DB_HOST in your .env file on EC2.'}`);
  }
}

// Get diagnostic info for the Cloud Computing Lab demonstration
function getDbInfo() {
  return {
    type: activeDbType === 'mysql' && pool ? 'Amazon RDS for MySQL' : 'Amazon RDS MySQL (Connecting...)',
    host: config.host,
    database: config.database,
    port: config.port,
    status: dbStatus,
    error: lastDbError,
  };
}

// Initialize on module load
initializeDatabase();

module.exports = {
  query,
  getDbInfo,
  initializeDatabase,
};
