const pool = require("../config/database");

/**
 * Migration: Add nama_panggilan field to persons table
 * Run this once to add the new field
 */
async function addNamaPanggilanField() {
  try {
    const connection = await pool.getConnection();

    console.log("Checking if nama_panggilan column exists...");

    // Check if column exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'persons' AND COLUMN_NAME = 'nama_panggilan'"
    );

    if (columns.length > 0) {
      console.log("nama_panggilan column already exists. Skipping...");
      await connection.release();
      return;
    }

    // Add column after nama_belakang
    console.log("Adding nama_panggilan column to persons table...");
    await connection.execute(`
      ALTER TABLE persons 
      ADD COLUMN nama_panggilan VARCHAR(100) 
      AFTER nama_belakang
    `);

    console.log("✅ nama_panggilan field added successfully!");
    await connection.release();
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addNamaPanggilanField()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = addNamaPanggilanField;
