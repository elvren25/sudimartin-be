-- ============================================
-- CREATE MARRIAGES TABLE - PRODUCTION
-- ============================================
-- Database: sql12814227
-- Host: sql12.freesqldatabase.com
-- 
-- RUN THIS SCRIPT DI SQL CONSOLE phpMyAdmin
-- ============================================

-- Create marriages table (if not exists)
CREATE TABLE IF NOT EXISTS marriages (
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

-- ✅ TABLE CREATED!
-- 
-- Verify:
-- SELECT * FROM marriages;

-- If you want to see table structure:
-- DESCRIBE marriages;

-- Sample data (if needed for testing):
-- INSERT INTO marriages (family_id, suami_id, istri_id, status) VALUES
-- (1, 1, 2, 'MENIKAH'),
-- (1, 3, 4, 'MENIKAH');
