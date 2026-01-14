-- REVISI KE-2: Simplified Schema dengan Person + Marriage
-- Drop existing tables if exists
DROP TABLE IF EXISTS marriages;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS users;

USE railway;

-- Create users table (for authentication)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  namaDepan VARCHAR(100) NOT NULL,
  namaBelakang VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  isRoot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create families table
CREATE TABLE families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  nama_keluarga VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  privacy_type ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PRIVATE',
  access_code VARCHAR(20),
  photo_url LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_admin_id (admin_id),
  INDEX idx_privacy_type (privacy_type),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create family_members table (REVISI KE-2: Simplified)
CREATE TABLE family_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  nama_depan VARCHAR(100) NOT NULL,
  nama_belakang VARCHAR(100),
  nama_panggilan VARCHAR(100) NOT NULL COMMENT 'Wajib diisi',
  gender ENUM('M', 'F') NOT NULL COMMENT 'M=Laki-laki, F=Perempuan',
  tanggal_lahir DATE,
  tempat_lahir VARCHAR(100),
  tanggal_meninggal DATE,
  status ENUM('Hidup', 'Meninggal') DEFAULT 'Hidup',
  
  -- Parent references
  ayah_id INT COMMENT 'Father ID',
  ibu_id INT COMMENT 'Mother ID',
  
  -- Additional info
  pekerjaan VARCHAR(100),
  alamat TEXT,
  biografi TEXT COMMENT 'Biography/Description',
  photo_url LONGTEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family_id (family_id),
  INDEX idx_ayah_id (ayah_id),
  INDEX idx_ibu_id (ibu_id),
  INDEX idx_gender (gender),
  INDEX idx_status (status),
  
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (ayah_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (ibu_id) REFERENCES family_members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create marriages table (NEW - REVISI KE-2)
CREATE TABLE marriages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  suami_id INT COMMENT 'Husband ID (optional)',
  istri_id INT COMMENT 'Wife ID (optional)',
  status ENUM('MENIKAH', 'CERAI HIDUP', 'CERAI MATI') DEFAULT 'MENIKAH',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family_id (family_id),
  INDEX idx_suami_id (suami_id),
  INDEX idx_istri_id (istri_id),
  INDEX idx_status (status),
  
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (suami_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (istri_id) REFERENCES family_members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default admin user
INSERT INTO users (namaDepan, namaBelakang, email, password, role, isRoot)
VALUES ('Admin', 'System', 'admin@family.com', '$2a$10$Zp3IKNVh8N6c0Z.F6v6mxO0B6.DfPnYkDM5mKvFZE5X4KzJ2O2YdG', 'admin', TRUE)
ON DUPLICATE KEY UPDATE password = VALUES(password);
