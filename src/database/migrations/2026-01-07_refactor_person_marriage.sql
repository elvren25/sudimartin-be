-- =============================================
-- MIGRATION: Refactor Person and Marriage Tables
-- Date: 2026-01-07
-- Purpose: Separate person data from marriage data
--          to handle divorced cases properly
-- =============================================

-- =============================================
-- 1. CREATE NEW TABLES
-- =============================================

-- Table: persons (replaces family_members for individual data)
CREATE TABLE IF NOT EXISTS persons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT,
  
  -- Personal Information
  nama_depan VARCHAR(100) NOT NULL,
  nama_belakang VARCHAR(100),
  nama_panggilan VARCHAR(100),
  nama_sapaan VARCHAR(100),
  nama_lengkap VARCHAR(255) GENERATED ALWAYS AS (
    CONCAT(IFNULL(nama_depan, ''), ' ', IFNULL(nama_belakang, ''))
  ) STORED,
  gender ENUM('Pria', 'Wanita') NOT NULL DEFAULT 'Pria',
  
  -- Birth Information
  tanggal_lahir DATE,
  tempat_lahir VARCHAR(100),
  
  -- Death Information
  tanggal_meninggal DATE,
  tempat_meninggal VARCHAR(100),
  status_hidup ENUM('Hidup', 'Meninggal') DEFAULT 'Hidup',
  
  -- Parent References (untuk child-parent relationship)
  ayah_id INT,
  ibu_id INT,
  
  -- Additional Information (generation calculated dynamically, not stored)
  pekerjaan VARCHAR(100),
  pendidikan VARCHAR(100),
  biography TEXT,
  
  -- Contact Information
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  contact_address TEXT,
  
  -- Display Settings
  nama_display ENUM('nama_depan', 'nama_lengkap', 'nama_sapaan') DEFAULT 'nama_depan',
  photo_url LONGTEXT,
  
  -- Canvas Position (for tree visualization)
  node_position_x FLOAT DEFAULT 0,
  node_position_y FLOAT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status_hidup (status_hidup),
  INDEX idx_gender (gender),
  INDEX idx_ayah_id (ayah_id),
  INDEX idx_ibu_id (ibu_id),
  INDEX idx_nama_lengkap (nama_lengkap),
  
  -- Foreign Keys
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (ayah_id) REFERENCES persons(id) ON DELETE SET NULL,
  FOREIGN KEY (ibu_id) REFERENCES persons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: marriages (for marriage/spouse relationships)
CREATE TABLE IF NOT EXISTS marriages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  
  -- Spouse References
  suami_id INT NOT NULL COMMENT 'Reference to husband in persons table',
  istri_id INT NOT NULL COMMENT 'Reference to wife in persons table',
  
  -- Marriage Information
  tanggal_menikah DATE,
  tempat_menikah VARCHAR(100),
  
  -- Divorce Information
  tanggal_cerai DATE,
  tempat_cerai VARCHAR(100),
  
  -- Marriage Status
  status_perkawinan ENUM(
    'Menikah',
    'Cerai Hidup',
    'Cerai Mati',
    'Cerai Tercatat',
    'Belum Kawin'
  ) DEFAULT 'Menikah',
  
  -- Additional Information
  catatan TEXT COMMENT 'Notes about the marriage',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_family_id (family_id),
  INDEX idx_suami_id (suami_id),
  INDEX idx_istri_id (istri_id),
  INDEX idx_status (status_perkawinan),
  
  -- Foreign Keys
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (suami_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (istri_id) REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate marriages
  UNIQUE KEY unique_marriage (family_id, suami_id, istri_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. BACKUP OLD DATA (optional but recommended)
-- =============================================

CREATE TABLE IF NOT EXISTS family_members_backup AS 
SELECT * FROM family_members;

-- =============================================
-- 3. NOTES FOR DATA MIGRATION
-- =============================================

-- Migration steps to be done in Node.js script:
-- 1. Read all family_members data
-- 2. For each member:
--    a. Insert into persons table with personal data
--    b. If status_menikah = 'Menikah', create entry in marriages table
--    c. Map ayah_id and ibu_id to new person IDs
-- 3. Update all relationships to use new person IDs
-- 4. After verification, can drop family_members table

-- =============================================
-- 4. UPDATE RELATIONSHIPS TABLE
-- =============================================

-- Add temporary column to track old member IDs during migration
ALTER TABLE relationships 
ADD COLUMN old_member1_id INT COMMENT 'Temporary: old family_members.id',
ADD COLUMN old_member2_id INT COMMENT 'Temporary: old family_members.id';

-- =============================================
-- END OF MIGRATION SQL
-- =============================================
