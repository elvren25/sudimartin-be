/**
 * Auto Migration - Check and apply database migrations automatically
 * This will run on server startup to ensure database is up to date
 */

const pool = require("../config/database");

async function checkAndMigrate() {
  console.log("🔍 Checking database schema...");

  try {
    // First, check what columns exist in family_members
    const [existingColumns] = await pool.execute(
      "SHOW COLUMNS FROM family_members"
    );
    const columnNames = existingColumns.map((col) => col.Field);
    console.log("📋 Existing columns in family_members:", columnNames);

    // Define all required columns and their definitions
    const requiredColumns = {
      nama_panggilan: "VARCHAR(100) NOT NULL DEFAULT 'Panggilan'",
      nama_belakang: "VARCHAR(100)",
      tanggal_lahir: "DATE",
      tempat_lahir: "VARCHAR(100)",
      tanggal_meninggal: "DATE",
      ayah_id: "INT",
      ibu_id: "INT",
      pekerjaan: "VARCHAR(100)",
      alamat: "TEXT",
      biografi: "TEXT",
      photo_url: "LONGTEXT",
      status: "VARCHAR(50) DEFAULT 'Hidup'",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      updated_at:
        "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    };

    // Add missing columns
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!columnNames.includes(columnName)) {
        console.log(`⚠️  Column '${columnName}' not found. Adding...`);
        try {
          await pool.execute(`
            ALTER TABLE family_members 
            ADD COLUMN ${columnName} ${columnDef}
          `);
          console.log(`✅ Added column '${columnName}'`);
        } catch (err) {
          console.error(
            `❌ Failed to add column '${columnName}':`,
            err.message
          );
        }
      } else {
        console.log(`✅ Column '${columnName}' exists`);
      }
    }

    // Check if access_code column exists in families table
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM families LIKE 'access_code'"
    );

    if (columns.length === 0) {
      console.log(
        "⚠️  Column 'access_code' not found in families. Running migration..."
      );

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

      console.log("🎉 All migrations completed successfully!");
    } else {
      console.log("✅ Database families schema is up to date");
    }
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    console.error(
      "⚠️  Please check database and run migration manually if needed"
    );
  }
}

module.exports = { checkAndMigrate };
