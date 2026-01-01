const mysql = require("mysql2/promise");
require("dotenv").config();

// Parse DATABASE_URL (from Railway) or use individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  // Railway MySQL format: mysql://user:password@host:port/database
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading /
    port: url.port || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
} else {
  // Local development
  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root1234",
    database: process.env.DB_NAME || "tree_family_db",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
