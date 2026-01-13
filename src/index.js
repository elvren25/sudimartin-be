const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const familyRoutes = require("./routes/familyRoutes");
const personRoutes = require("./routes/personRoutes");

const app = express();
const PORT = process.env.PORT || 5200;

// CORS Configuration
const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/families", personRoutes); // New Person & Marriage endpoints

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Setup endpoint - make a user admin (one-time setup for first admin)
app.post("/api/setup/make-admin/:email", async (req, res) => {
  try {
    const pool = require("./config/database");
    const email = decodeURIComponent(req.params.email);

    // Update user to admin
    const [result] = await pool.execute(
      "UPDATE users SET role = 'admin', isRoot = TRUE WHERE email = ?",
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${email} is now admin`,
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      success: false,
      message: "Setup failed",
      error: error.message,
    });
  }
});

// Initialize database endpoint
app.post("/api/init-db", async (req, res) => {
  try {
    console.log("🔄 Running database initialization...");

    const mysql = require("mysql2/promise");

    let connConfig;

    // Use DATABASE_URL if available (Railway MySQL), otherwise use individual env vars
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      connConfig = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        port: url.port || 3306,
      };
    } else {
      connConfig = {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root1234",
      };
    }

    const connection = await mysql.createConnection(connConfig);
    const databaseName = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).pathname.slice(1)
      : process.env.DB_NAME || "tree_family_db";

    // Create database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log("✅ Database created/exists");

    // Switch to database
    await connection.query(`USE \`${databaseName}\``);

    // Drop existing tables
    const dropStatements = [
      "DROP TABLE IF EXISTS relationships",
      "DROP TABLE IF EXISTS family_members",
      "DROP TABLE IF EXISTS families",
      "DROP TABLE IF EXISTS users",
    ];

    for (const stmt of dropStatements) {
      await connection.query(stmt);
      console.log("✅", stmt);
    }

    // Create users table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        namaDepan VARCHAR(100) NOT NULL,
        namaBelakang VARCHAR(100) NOT NULL,
        gender ENUM('Pria', 'Wanita') DEFAULT 'Pria',
        tempatLahir VARCHAR(100),
        tanggalLahir DATE,
        pekerjaan VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'user') DEFAULT 'user',
        isRoot BOOLEAN DEFAULT FALSE,
        ayahId INT,
        ibuId INT,
        pasanganId INT,
        keterangan TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_role (role),
        FOREIGN KEY (ayahId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (ibuId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (pasanganId) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created users table");

    // Create families table
    await connection.query(`
      CREATE TABLE families (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        nama_keluarga VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        privacy_type ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PRIVATE',
        access_code VARCHAR(20),
        photo_url LONGTEXT,
        canvas_layout_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_admin_id (admin_id),
        INDEX idx_privacy_type (privacy_type),
        INDEX idx_access_code (access_code),
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created families table");

    // Create family_members table
    await connection.query(`
      CREATE TABLE family_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        family_id INT NOT NULL,
        user_id INT,
        nama_depan VARCHAR(100) NOT NULL,
        nama_belakang VARCHAR(100),
        nama_sapaan VARCHAR(100),
        gender ENUM('Pria', 'Wanita') DEFAULT 'Pria',
        tanggal_lahir DATE,
        tempat_lahir VARCHAR(100),
        tanggal_meninggal DATE,
        status ENUM('Hidup', 'Meninggal') DEFAULT 'Hidup',
        status_menikah VARCHAR(50) DEFAULT 'Single',
        nama_display VARCHAR(50) DEFAULT 'nama_depan',
        hubungan_keluarga VARCHAR(50),
        photo_url LONGTEXT,
        generation INT DEFAULT 0,
        pekerjaan VARCHAR(100),
        biography TEXT,
        contact_phone VARCHAR(20),
        contact_email VARCHAR(100),
        contact_address TEXT,
        node_position_x FLOAT DEFAULT 0,
        node_position_y FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_family_id (family_id),
        INDEX idx_user_id (user_id),
        INDEX idx_generation (generation),
        INDEX idx_status (status),
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created family_members table");

    // Create relationships table
    await connection.query(`
      CREATE TABLE relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        family_id INT NOT NULL,
        member1_id INT NOT NULL,
        member2_id INT NOT NULL,
        relationship_type VARCHAR(50) NOT NULL,
        direction VARCHAR(20) DEFAULT 'both',
        custom_label VARCHAR(100),
        custom_connector BOOLEAN DEFAULT FALSE,
        connector_x1 FLOAT,
        connector_y1 FLOAT,
        connector_x2 FLOAT,
        connector_y2 FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_family_id (family_id),
        INDEX idx_member1_id (member1_id),
        INDEX idx_member2_id (member2_id),
        INDEX idx_relationship_type (relationship_type),
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (member1_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (member2_id) REFERENCES family_members(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created relationships table");

    // Insert default admin user
    await connection.query(`
      INSERT INTO users (namaDepan, namaBelakang, email, password, role, isRoot)
      VALUES ('Admin', 'System', 'admin@family.com', '$2a$10$Zp3IKNVh8N6c0Z.F6v6mxO0B6.DfPnYkDM5mKvFZE5X4KzJ2O2YdG', 'admin', TRUE)
      ON DUPLICATE KEY UPDATE password = '$2a$10$Zp3IKNVh8N6c0Z.F6v6mxO0B6.DfPnYkDM5mKvFZE5X4KzJ2O2YdG'
    `);
    console.log("✅ Created default admin user");

    await connection.end();
    console.log("✅ Database initialization completed!");

    res.json({
      success: true,
      message: "Database initialization completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Init error:", error);
    res.status(500).json({
      success: false,
      message: "Database initialization failed",
      error: error.message,
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n✨ Backend Server Running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health\n`);

  // Test database connection
  const pool = require("./config/database");
  const { checkAndMigrate } = require("./database/autoMigration");

  pool
    .getConnection()
    .then(async (conn) => {
      console.log("✅ Database connected successfully!");
      conn.release();

      // Run auto-migration to check and update schema
      await checkAndMigrate();
    })
    .catch((err) => {
      console.error("⚠️  Database connection warning:", err.message);
      // Don't crash, let server run anyway for /api/health
    });
});

module.exports = app;
