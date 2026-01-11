/**
 * Migration Script: Convert family_members to persons and marriages tables
 *
 * This script migrates data from the old family_members table to the new
 * persons and marriages tables to properly handle divorced cases.
 *
 * Usage: node be/src/database/migrate-to-persons-marriages.js
 */

const pool = require("../config/database");

async function migrateData() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log(
      "🚀 Starting migration from family_members to persons and marriages..."
    );

    // Step 1: Create new tables
    console.log("\n📋 Step 1: Creating new tables...");
    const createTablesSQL = require("fs").readFileSync(
      __dirname + "/migrations/2026-01-07_refactor_person_marriage.sql",
      "utf8"
    );

    // Execute each statement separately
    const statements = createTablesSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore table already exists errors
          if (!error.message.includes("already exists")) {
            throw error;
          }
        }
      }
    }
    console.log("✅ Tables created successfully");

    // Step 2: Get all family_members
    console.log("\n📋 Step 2: Reading family_members data...");
    const [members] = await connection.execute(
      "SELECT * FROM family_members ORDER BY family_id, generation, id"
    );
    console.log(`✅ Found ${members.length} members to migrate`);

    // Step 3: Migrate to persons table
    console.log("\n📋 Step 3: Migrating to persons table...");
    const memberIdMapping = new Map(); // old_id -> new_id

    for (const member of members) {
      const [result] = await connection.execute(
        `INSERT INTO persons (
          family_id, user_id, nama_depan, nama_belakang, nama_panggilan, nama_sapaan, gender,
          tanggal_lahir, tempat_lahir, tanggal_meninggal, status_hidup,
          pekerjaan, biography, 
          contact_phone, contact_email, contact_address,
          nama_display, photo_url, node_position_x, node_position_y,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.family_id,
          member.user_id,
          member.nama_depan,
          member.nama_belakang,
          member.nama_panggilan || null,
          member.nama_sapaan,
          member.gender,
          member.tanggal_lahir,
          member.tempat_lahir,
          member.tanggal_meninggal,
          member.status,
          member.pekerjaan,
          member.biography,
          member.contact_phone,
          member.contact_email,
          member.contact_address,
          member.nama_display,
          member.photo_url,
          member.node_position_x || 0,
          member.node_position_y || 0,
          member.created_at,
          member.updated_at,
        ]
      );

      memberIdMapping.set(member.id, result.insertId);
    }
    console.log(`✅ Migrated ${memberIdMapping.size} persons`);

    // Step 4: Update parent references
    console.log("\n📋 Step 4: Updating parent references...");
    let updatedParents = 0;

    for (const member of members) {
      const newPersonId = memberIdMapping.get(member.id);
      const newAyahId = member.ayah_id
        ? memberIdMapping.get(member.ayah_id)
        : null;
      const newIbuId = member.ibu_id
        ? memberIdMapping.get(member.ibu_id)
        : null;

      if (newAyahId || newIbuId) {
        await connection.execute(
          "UPDATE persons SET ayah_id = ?, ibu_id = ? WHERE id = ?",
          [newAyahId, newIbuId, newPersonId]
        );
        updatedParents++;
      }
    }
    console.log(`✅ Updated ${updatedParents} parent references`);

    // Step 5: Create marriages from married members
    console.log("\n📋 Step 5: Creating marriages...");
    const processedMarriages = new Set();
    let marriageCount = 0;

    // Group members by family_id and generation to find married couples
    const familiesMap = new Map();
    members.forEach((member) => {
      if (!familiesMap.has(member.family_id)) {
        familiesMap.set(member.family_id, []);
      }
      familiesMap.get(member.family_id).push(member);
    });

    for (const [familyId, familyMembers] of familiesMap) {
      // Group by generation and status_menikah
      const marriedByGeneration = new Map();

      familyMembers.forEach((member) => {
        if (
          (member.status_menikah &&
            member.status_menikah.includes("Menikah")) ||
          member.status_menikah?.includes("Cerai")
        ) {
          const gen = member.generation;
          if (!marriedByGeneration.has(gen)) {
            marriedByGeneration.set(gen, []);
          }
          marriedByGeneration.get(gen).push(member);
        }
      });

      // Try to pair married members
      for (const [gen, genMembers] of marriedByGeneration) {
        // Find consecutive pairs (suami-istri)
        for (let i = 0; i < genMembers.length - 1; i++) {
          const member1 = genMembers[i];
          const member2 = genMembers[i + 1];

          // Check if they are a couple (different genders, same generation, consecutive)
          if (member1.gender !== member2.gender) {
            const suami = member1.gender === "Pria" ? member1 : member2;
            const istri = member1.gender === "Wanita" ? member2 : member1;

            const marriageKey = `${suami.id}-${istri.id}`;
            if (!processedMarriages.has(marriageKey)) {
              const newSuamiId = memberIdMapping.get(suami.id);
              const newIstriId = memberIdMapping.get(istri.id);

              // Determine status
              let statusPerkawinan = "Menikah";
              if (
                suami.status_menikah?.includes("Cerai") ||
                istri.status_menikah?.includes("Cerai")
              ) {
                if (
                  suami.status_menikah?.includes("Tercatat") ||
                  istri.status_menikah?.includes("Tercatat")
                ) {
                  statusPerkawinan = "Cerai Tercatat";
                } else if (
                  suami.status === "Meninggal" ||
                  istri.status === "Meninggal"
                ) {
                  statusPerkawinan = "Cerai Mati";
                } else {
                  statusPerkawinan = "Cerai Hidup";
                }
              }

              await connection.execute(
                `INSERT INTO marriages (
                  family_id, suami_id, istri_id, status_perkawinan
                ) VALUES (?, ?, ?, ?)`,
                [familyId, newSuamiId, newIstriId, statusPerkawinan]
              );

              processedMarriages.add(marriageKey);
              marriageCount++;
            }
          }
        }
      }
    }
    console.log(`✅ Created ${marriageCount} marriages`);

    // Step 6: Update relationships table references
    console.log("\n📋 Step 6: Updating relationships table...");
    const [relationships] = await connection.execute(
      "SELECT * FROM relationships"
    );

    for (const rel of relationships) {
      const newMember1Id = memberIdMapping.get(rel.member1_id);
      const newMember2Id = memberIdMapping.get(rel.member2_id);

      if (newMember1Id && newMember2Id) {
        await connection.execute(
          `UPDATE relationships 
           SET old_member1_id = member1_id, 
               old_member2_id = member2_id,
               member1_id = ?, 
               member2_id = ? 
           WHERE id = ?`,
          [newMember1Id, newMember2Id, rel.id]
        );
      }
    }
    console.log(`✅ Updated ${relationships.length} relationships`);

    // Step 7: Commit transaction
    await connection.commit();

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Persons migrated: ${memberIdMapping.size}`);
    console.log(`   - Parent references updated: ${updatedParents}`);
    console.log(`   - Marriages created: ${marriageCount}`);
    console.log(`   - Relationships updated: ${relationships.length}`);
    console.log("\n💡 Next steps:");
    console.log("   1. Verify the data in persons and marriages tables");
    console.log("   2. Test the new API endpoints");
    console.log("   3. Update frontend to use new endpoints");
    console.log("   4. After verification, you can:");
    console.log("      - RENAME family_members to family_members_old");
    console.log("      - Keep it for backup or DROP if confident");
    console.log("\n⚠️  Old table family_members is kept as backup!");
    console.log("=".repeat(60));
  } catch (error) {
    await connection.rollback();
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

// Run migration
migrateData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
