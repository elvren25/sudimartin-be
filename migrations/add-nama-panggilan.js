/**
 * MIGRATION: Add missing columns to family_members table
 * Production database doesn't have nama_panggilan column
 */

const pool = require("../src/config/database");

async function runMigration() {
  try {
    console.log("🔄 Starting migration...\n");

    // First, check what columns exist
    console.log("📋 Checking existing columns in family_members table...");
    const [columns] = await pool.execute("DESCRIBE family_members");

    const columnNames = columns.map((col) => col.Field);
    console.log("Existing columns:", columnNames);
    console.log("\n");

    // Check if nama_panggilan exists
    if (!columnNames.includes("nama_panggilan")) {
      console.log("❌ Column 'nama_panggilan' NOT FOUND");
      console.log("🔧 Adding 'nama_panggilan' column...");

      const addColumnQuery = `
        ALTER TABLE family_members 
        ADD COLUMN nama_panggilan VARCHAR(100) NOT NULL DEFAULT 'Panggilan' 
        AFTER nama_depan
      `;

      await pool.execute(addColumnQuery);
      console.log("✅ Column 'nama_panggilan' added successfully!\n");
    } else {
      console.log("✅ Column 'nama_panggilan' already exists\n");
    }

    // Check other expected columns
    const expectedColumns = [
      "id",
      "family_id",
      "nama_depan",
      "nama_panggilan",
      "nama_belakang",
      "gender",
      "tanggal_lahir",
      "tanggal_meninggal",
      "status",
      "ayah_id",
      "ibu_id",
      "pekerjaan",
      "alamat",
    ];

    console.log("📋 Checking all expected columns:");
    const missingColumns = expectedColumns.filter(
      (col) => !columnNames.includes(col)
    );

    if (missingColumns.length === 0) {
      console.log("✅ All expected columns exist!\n");
    } else {
      console.log("❌ Missing columns:", missingColumns);
      console.log(
        "⚠️  These columns should be created manually or via SQL migration\n"
      );
    }

    console.log("✨ Migration completed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed!");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
