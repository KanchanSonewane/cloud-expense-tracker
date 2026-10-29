// =============================================================================
// Database Configuration and Connection Pool
// Primary: Amazon RDS for MySQL (MySQL 8.0+)
// Fallback: Built-in SQLite for offline local verification if RDS is unavailable
// Lab Mapping: Practical 11 (RDS MySQL & EC2 Connection)
// =============================================================================

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let sqliteDb = null;
let activeDbType = 'mysql'; // 'mysql' (Amazon RDS) or 'sqlite' (local fallback)
let dbStatus = 'disconnected';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cloud_expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
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
}

// Initialize SQLite schema for offline development mode
function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
}

// Convert MySQL DATE_SUB/CURDATE syntax or parameter placeholders if executing on SQLite
function adaptQueryForSqlite(sql) {
  let adapted = sql
    .replace(/CURDATE\(\)/gi, "date('now')")
    .replace(/DATE_SUB\(date\('now'\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "date('now', '-$1 days')")
    .replace(/DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "date('now', '-$1 days')")
    .replace(/NOW\(\)/gi, "datetime('now')");
  return adapted;
}

// SQLite query wrapper matching mysql2 [rows, fields] return signature
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
      console.log(`[Amazon RDS / MySQL] Attempting connection to ${config.host}:${config.port}/${config.database}...`);
      pool = mysql.createPool(config);

      // Test connection
      const connection = await pool.getConnection();
      console.log(`[Amazon RDS / MySQL] Successfully connected to database "${config.database}" on ${config.host}!`);
      
      // Auto-verify schema
      await initMySQLSchema(connection);
      connection.release();

      activeDbType = 'mysql';
      dbStatus = 'connected';
      return;
    } catch (err) {
      console.warn(`[Amazon RDS / MySQL] Could not connect to MySQL at ${config.host}:${config.port} (${err.message}).`);
      console.log('[DATABASE NOTICE] Falling back to built-in SQLite for offline local demonstration.');
    }
  }

  // Initialize SQLite fallback
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbDir = path.join(__dirname, '..', '..', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'expense_tracker.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    initSqliteSchema(sqliteDb);
    activeDbType = 'sqlite';
    dbStatus = 'connected (local fallback)';
    console.log(`[Database SQLite] Local database active at: ${dbPath}`);
  } catch (sqliteErr) {
    console.error('[Database Error] Failed to initialize local SQLite:', sqliteErr);
    dbStatus = 'error: ' + sqliteErr.message;
  }
}

// Unified query function
async function query(sql, params = []) {
  if (activeDbType === 'mysql' && pool) {
    return await pool.query(sql, params);
  } else if (activeDbType === 'sqlite' && sqliteDb) {
    return executeSqliteQuery(sql, params);
  } else {
    throw new Error('Database is not initialized or connected.');
  }
}

// Get diagnostic info for the Cloud Computing Lab demonstration
function getDbInfo() {
  return {
    type: activeDbType === 'mysql' ? 'Amazon RDS for MySQL' : 'Local SQLite (Offline Fallback)',
    host: activeDbType === 'mysql' ? config.host : 'localhost (node:sqlite)',
    database: activeDbType === 'mysql' ? config.database : 'expense_tracker.sqlite',
    port: activeDbType === 'mysql' ? config.port : 'N/A',
    status: dbStatus,
  };
}

// Initialize on module load
initializeDatabase();

module.exports = {
  query,
  getDbInfo,
  initializeDatabase,
};
