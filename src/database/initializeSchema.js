require("dotenv").config();
const pool = require("../config/database");

const initializeSchema = async () => {
  try {
    console.log("\n🔄 Initializing database schema...");

    const conn = await pool.getConnection();

    // Create users table
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        namaDepan VARCHAR(100) NOT NULL,
        namaBelakang VARCHAR(100),
        gender ENUM('Pria', 'Wanita') DEFAULT 'Pria',
        tempatLahir VARCHAR(100),
        tanggalLahir DATE,
        pekerjaan VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'user') DEFAULT 'user',
        isRoot BOOLEAN DEFAULT FALSE,
        ayahId VARCHAR(36),
        ibuId VARCHAR(36),
        pasanganId VARCHAR(36),
        keterangan TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_isRoot (isRoot),
        INDEX idx_ayahId (ayahId),
        INDEX idx_ibuId (ibuId),
        INDEX idx_pasanganId (pasanganId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const familiesTable = `
      CREATE TABLE IF NOT EXISTS families (
        id VARCHAR(36) PRIMARY KEY,
        nama_keluarga VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        privacy_type ENUM('public', 'private') DEFAULT 'private',
        photo_url LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_privacy (privacy_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const familyMembersTable = `
      CREATE TABLE IF NOT EXISTS family_members (
        id VARCHAR(36) PRIMARY KEY,
        family_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        nama_depan VARCHAR(100),
        nama_belakang VARCHAR(100),
        nama_sapaan VARCHAR(100),
        generation INT DEFAULT 1,
        gender ENUM('Pria', 'Wanita'),
        status_hidup ENUM('Hidup', 'Meninggal') DEFAULT 'Hidup',
        tanggal_lahir DATE,
        tanggal_meninggal DATE,
        tanggal_wafat DATE,
        tempat_lahir VARCHAR(100),
        pekerjaan VARCHAR(100),
        biography TEXT,
        photo_url LONGTEXT,
        ayah_id VARCHAR(36),
        ibu_id VARCHAR(36),
        pasangan_id VARCHAR(36),
        status_menikah ENUM('Single', 'Menikah', 'Cerai', 'Janda/Duda') DEFAULT 'Single',
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        contact_address TEXT,
        nama_display VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_family_id (family_id),
        INDEX idx_user_id (user_id),
        INDEX idx_generation (generation),
        INDEX idx_ayah_id (ayah_id),
        INDEX idx_ibu_id (ibu_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Execute table creations
    await conn.query(usersTable);
    console.log("✅ Users table created/verified");

    await conn.query(familiesTable);
    console.log("✅ Families table created/verified");

    await conn.query(familyMembersTable);
    console.log("✅ Family members table created/verified");

    // Insert admin user if not exists
    const adminInsert = `
      INSERT INTO users (id, namaDepan, namaBelakang, email, password, role, isRoot)
      VALUES (
        'admin-001',
        'Admin',
        'System',
        'admin@family.com',
        '$2a$10$5RKqvXhGQQvXhGQQvXhGQQvXhGQQvXhGQQvXhGQQvXhGQQvXhGQQvX.',
        'admin',
        TRUE
      ) ON DUPLICATE KEY UPDATE id=id
    `;

    await conn.query(adminInsert);
    console.log("✅ Admin user created/verified");

    conn.release();

    console.log("✨ Database schema initialization complete!\n");
    return true;
  } catch (error) {
    console.error("❌ Schema initialization error:", error.message);
    return false;
  }
};

module.exports = initializeSchema;
