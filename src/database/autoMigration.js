/**
 * Auto Migration - Check and apply database migrations automatically
 * This will run on server startup to ensure database is up to date
 */

const pool = require("../config/database");

async function checkAndMigrate() {
  console.log("🔍 Checking database schema...");

  try {
    // Check if nama_panggilan column exists in family_members
    const [namaPanel] = await pool.execute(
      "SHOW COLUMNS FROM family_members LIKE 'nama_panggilan'"
    );

    if (namaPanel.length === 0) {
      console.log(
        "⚠️  Column 'nama_panggilan' not found. Running migration..."
      );

      // Add nama_panggilan column
      await pool.execute(`
        ALTER TABLE family_members 
        ADD COLUMN nama_panggilan VARCHAR(100) NOT NULL DEFAULT 'Panggilan'
        AFTER nama_depan
      `);
      console.log("✅ Added column 'nama_panggilan'");
    } else {
      console.log("✅ Column 'nama_panggilan' exists");
    }

    // Check if access_code column exists
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM families LIKE 'access_code'"
    );

    if (columns.length === 0) {
      console.log("⚠️  Column 'access_code' not found. Running migration...");

      // Add access_code column
      await pool.execute(`
        ALTER TABLE families 
        ADD COLUMN access_code VARCHAR(20) 
        AFTER privacy_type
      `);
      console.log("✅ Added column 'access_code'");

      // Add index
      try {
        await pool.execute(`
          ALTER TABLE families 
          ADD INDEX idx_access_code (access_code)
        `);
        console.log("✅ Added index 'idx_access_code'");
      } catch (err) {
        // Index might already exist, ignore error
        if (!err.message.includes("Duplicate key name")) {
          console.log("⚠️  Index might already exist:", err.message);
        }
      }

      // Generate access codes for existing families
      const [result] = await pool.execute(`
        UPDATE families 
        SET access_code = LPAD(FLOOR(RAND() * 1000000), 6, '0')
        WHERE access_code IS NULL OR access_code = ''
      `);

      if (result.affectedRows > 0) {
        console.log(
          `✅ Generated access codes for ${result.affectedRows} existing families`
        );
      }

      console.log("🎉 Migration completed successfully!");
    } else {
      console.log("✅ Database schema is up to date");
    }
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    // Don't crash the server, just log the error
    console.error("⚠️  Please run migration manually if needed");
  }
}

module.exports = { checkAndMigrate };
