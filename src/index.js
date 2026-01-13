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

// Initialize database endpoint
app.post("/api/init-db", async (req, res) => {
  try {
    console.log("🔄 Running database initialization...");

    const mysql = require("mysql2/promise");
    const databaseName = process.env.DB_NAME || "sql12814227";

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root1234",
      multipleStatements: true,
    });

    const setupSQL = `
      CREATE DATABASE IF NOT EXISTS ${databaseName}
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      USE ${databaseName};

      DROP TABLE IF EXISTS relationships;
      DROP TABLE IF EXISTS family_members;
      DROP TABLE IF EXISTS families;
      DROP TABLE IF EXISTS users;

      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        namaDepan VARCHAR(100) NOT NULL,
        namaBelakang VARCHAR(100) NOT NULL,
        gender ENUM('Pria', 'Wanita') DEFAULT 'Pria',
        tempatLahir VARCHAR(100),
        tanggalLahir DATE,
        pekerjaan VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'user') DEFAULT 'user',
        isRoot BOOLEAN DEFAULT FALSE,
        ayahId INT,
        ibuId INT,
        pasanganId INT,
        keterangan TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_isRoot (isRoot),
        INDEX idx_ayahId (ayahId),
        INDEX idx_ibuId (ibuId),
        INDEX idx_pasanganId (pasanganId),
        
        FOREIGN KEY (ayahId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (ibuId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (pasanganId) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE families (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        nama_keluarga VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        privacy_type ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PRIVATE',
        access_code VARCHAR(20),
        photo_url LONGTEXT,
        canvas_layout_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_admin_id (admin_id),
        INDEX idx_privacy_type (privacy_type),
        INDEX idx_access_code (access_code),
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        contact_email VARCHAR(255),
        contact_address TEXT,
        node_position_x FLOAT DEFAULT 0,
        node_position_y FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_family_id (family_id),
        INDEX idx_user_id (user_id),
        INDEX idx_generation (generation),
        INDEX idx_status (status),
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_family_id (family_id),
        INDEX idx_member1_id (member1_id),
        INDEX idx_member2_id (member2_id),
        INDEX idx_relationship_type (relationship_type),
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (member1_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (member2_id) REFERENCES family_members(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      INSERT INTO users (namaDepan, namaBelakang, email, password, role, isRoot)
      VALUES ('Admin', 'System', 'admin@family.com', '$2a$10$Zp3IKNVh8N6c0Z.F6v6mxO0B6.DfPnYkDM5mKvFZE5X4KzJ2O2YdG', 'admin', TRUE)
      ON DUPLICATE KEY UPDATE password = '$2a$10$Zp3IKNVh8N6c0Z.F6v6mxO0B6.DfPnYkDM5mKvFZE5X4KzJ2O2YdG';
    `;

    // Execute all SQL statements
    const statements = setupSQL.split(";").filter((s) => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
        console.log("✅ Executed:", statement.substring(0, 50) + "...");
      }
    }

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
