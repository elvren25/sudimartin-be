const pool = require("../config/database");
const { MEMBER_STATUS, GENERATION } = require("../config/constants");

class FamilyMember {
  /**
   * Create a new family member
   */
  static async create(memberData) {
    const query = `
      INSERT INTO family_members (
        family_id, user_id, nama_depan, nama_belakang, nama_sapaan, gender,
        tanggal_lahir, tempat_lahir, tanggal_meninggal, status, status_menikah,
        nama_display, hubungan_keluarga, photo_url, generation,
        pekerjaan, biography, contact_phone, contact_email, contact_address,
        ayah_id, ibu_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      memberData.family_id,
      memberData.user_id || null,
      memberData.nama_depan,
      memberData.nama_belakang || null,
      memberData.nama_sapaan || null,
      memberData.gender || "Pria",
      memberData.tanggal_lahir || null,
      memberData.tempat_lahir || null,
      memberData.tanggal_wafat || memberData.tanggal_meninggal || null,
      memberData.status_hidup || memberData.status || "Hidup",
      memberData.status_menikah || "Single",
      memberData.nama_display || "nama_depan",
      memberData.hubungan_keluarga || null,
      memberData.photo_url || null,
      memberData.generation || 0,
      memberData.pekerjaan || null,
      memberData.biography || null,
      memberData.contact_phone || null,
      memberData.contact_email || null,
      memberData.contact_address || null,
      memberData.ayah_id || null,
      memberData.ibu_id || null,
    ];

    const [result] = await pool.execute(query, values);
    return {
      id: result.insertId,
      ...memberData,
      status: memberData.status_hidup || "Hidup",
      generation: memberData.generation || 0,
      created_at: new Date(),
    };
  }

  /**
   * Get member by ID
   */
  static async findById(memberId) {
    const query = "SELECT * FROM family_members WHERE id = ?";
    const [rows] = await pool.execute(query, [memberId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all members of a family
   */
  static async findByFamilyId(familyId) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? 
      ORDER BY generation ASC, created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId]);

    // Build person map for generation calculation
    const personMap = new Map();
    rows.forEach((person) => {
      personMap.set(person.id, person);
    });

    // Calculate generation for each person based on parents
    for (const [id, person] of personMap.entries()) {
      // Check if person has parents
      const fatherGen =
        person.ayah_id && personMap.has(person.ayah_id)
          ? await this.calculateGenerationFromMap(person.ayah_id, personMap)
          : 0;
      const motherGen =
        person.ibu_id && personMap.has(person.ibu_id)
          ? await this.calculateGenerationFromMap(person.ibu_id, personMap)
          : 0;

      // Generation = max(parent generations) + 1, or 1 if no parents
      person.generation =
        fatherGen > 0 || motherGen > 0 ? Math.max(fatherGen, motherGen) + 1 : 1;
    }

    return rows;
  }

  /**
   * Helper function to calculate generation from personMap
   */
  static async calculateGenerationFromMap(personId, personMap) {
    const person = personMap.get(personId);
    if (!person) return 0;

    // If person has no parents, it's generation 1
    if (!person.ayah_id && !person.ibu_id) return 1;

    // Calculate parent generations
    const fatherGen =
      person.ayah_id && personMap.has(person.ayah_id)
        ? await this.calculateGenerationFromMap(person.ayah_id, personMap)
        : 0;
    const motherGen =
      person.ibu_id && personMap.has(person.ibu_id)
        ? await this.calculateGenerationFromMap(person.ibu_id, personMap)
        : 0;

    return Math.max(fatherGen, motherGen) + 1;
  }

  /**
   * Get members by generation
   */
  static async findByGeneration(familyId, generation) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? AND generation = ?
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId, generation]);
    return rows;
  }

  /**
   * Get member by user ID and family ID
   */
  static async findByUserIdAndFamilyId(userId, familyId) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [familyId, userId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update member
   */
  static async update(memberId, memberData) {
    const fields = [];
    const values = [];

    // Map frontend field names to database column names
    const fieldMapping = {
      tanggal_wafat: "tanggal_meninggal",
      status_hidup: "status",
    };

    for (const [key, value] of Object.entries(memberData)) {
      if (key === "id" || key === "family_id" || key === "created_at") continue;

      // Map field name if needed, otherwise use original
      const dbFieldName = fieldMapping[key] || key;
      fields.push(`${dbFieldName} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return false;

    values.push(memberId);
    const query = `UPDATE family_members SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Update node position (canvas coordinates)
   */
  static async updateNodePosition(memberId, x, y) {
    const query = `
      UPDATE family_members 
      SET node_position_x = ?, node_position_y = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [x, y, memberId]);
    return result.affectedRows > 0;
  }

  /**
   * Update photo URL
   */
  static async updatePhoto(memberId, photoUrl) {
    const query = `
      UPDATE family_members 
      SET photo_url = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [photoUrl, memberId]);
    return result.affectedRows > 0;
  }

  /**
   * Delete member
   */
  static async delete(memberId) {
    const query = "DELETE FROM family_members WHERE id = ?";
    const [result] = await pool.execute(query, [memberId]);
    return result.affectedRows > 0;
  }

  /**
   * Get member count by family
   */
  static async getCountByFamily(familyId) {
    const query =
      "SELECT COUNT(*) as count FROM family_members WHERE family_id = ?";
    const [rows] = await pool.execute(query, [familyId]);
    return rows[0].count;
  }

  /**
   * Get root members (generation 0)
   */
  static async findRootMembers(familyId) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? AND generation = 0
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId]);
    return rows;
  }

  /**
   * Search members by name
   */
  static async search(familyId, keyword) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? AND (nama_depan LIKE ? OR nama_belakang LIKE ?)
      ORDER BY generation ASC, created_at ASC
    `;
    const searchTerm = `%${keyword}%`;
    const [rows] = await pool.execute(query, [
      familyId,
      searchTerm,
      searchTerm,
    ]);
    return rows;
  }

  /**
   * Get members with photos
   */
  static async findWithPhotos(familyId) {
    const query = `
      SELECT * FROM family_members 
      WHERE family_id = ? AND photo_url IS NOT NULL
      ORDER BY generation ASC, created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId]);
    return rows;
  }
}

module.exports = FamilyMember;
