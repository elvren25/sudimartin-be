const pool = require("../config/database");

class Marriage {
  /**
   * Create a new marriage
   */
  static async create(marriageData) {
    const query = `
      INSERT INTO marriages (
        family_id, suami_id, istri_id, 
        tanggal_menikah, tempat_menikah,
        tanggal_cerai, tempat_cerai,
        status_perkawinan, catatan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      marriageData.family_id,
      marriageData.suami_id,
      marriageData.istri_id,
      marriageData.tanggal_menikah || null,
      marriageData.tempat_menikah || null,
      marriageData.tanggal_cerai || null,
      marriageData.tempat_cerai || null,
      marriageData.status_perkawinan || "Menikah",
      marriageData.catatan || null,
    ];

    const [result] = await pool.execute(query, values);
    return {
      id: result.insertId,
      ...marriageData,
      status_perkawinan: marriageData.status_perkawinan || "Menikah",
      created_at: new Date(),
    };
  }

  /**
   * Get marriage by ID
   */
  static async findById(marriageId) {
    const query = "SELECT * FROM marriages WHERE id = ?";
    const [rows] = await pool.execute(query, [marriageId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all marriages in a family
   */
  static async findByFamilyId(familyId) {
    const query = `
      SELECT m.*, 
        ps.nama_lengkap as nama_suami,
        pi.nama_lengkap as nama_istri
      FROM marriages m
      LEFT JOIN persons ps ON m.suami_id = ps.id
      LEFT JOIN persons pi ON m.istri_id = pi.id
      WHERE m.family_id = ?
      ORDER BY m.tanggal_menikah DESC
    `;
    const [rows] = await pool.execute(query, [familyId]);
    return rows;
  }

  /**
   * Get marriages of a person
   */
  static async findByPersonId(personId) {
    const query = `
      SELECT m.*, 
        ps.nama_lengkap as nama_suami,
        pi.nama_lengkap as nama_istri,
        CASE 
          WHEN m.suami_id = ? THEN pi.id
          ELSE ps.id
        END as pasangan_id,
        CASE 
          WHEN m.suami_id = ? THEN pi.nama_lengkap
          ELSE ps.nama_lengkap
        END as nama_pasangan
      FROM marriages m
      LEFT JOIN persons ps ON m.suami_id = ps.id
      LEFT JOIN persons pi ON m.istri_id = pi.id
      WHERE m.suami_id = ? OR m.istri_id = ?
      ORDER BY m.tanggal_menikah DESC
    `;
    const [rows] = await pool.execute(query, [
      personId,
      personId,
      personId,
      personId,
    ]);
    return rows;
  }

  /**
   * Get active marriage of a person
   */
  static async findActiveMarriage(personId) {
    const query = `
      SELECT m.*, 
        ps.nama_lengkap as nama_suami,
        pi.nama_lengkap as nama_istri,
        CASE 
          WHEN m.suami_id = ? THEN pi.id
          ELSE ps.id
        END as pasangan_id
      FROM marriages m
      LEFT JOIN persons ps ON m.suami_id = ps.id
      LEFT JOIN persons pi ON m.istri_id = pi.id
      WHERE (m.suami_id = ? OR m.istri_id = ?)
      AND m.status_perkawinan = 'Menikah'
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [personId, personId, personId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get children of a marriage
   */
  static async getChildren(marriageId) {
    const marriage = await this.findById(marriageId);
    if (!marriage) return [];

    const query = `
      SELECT * FROM family_members 
      WHERE (ayah_id = ? OR ayah_id IS NULL)
      AND (ibu_id = ? OR ibu_id IS NULL)
      AND ayah_id IS NOT NULL AND ibu_id IS NOT NULL
      ORDER BY tanggal_lahir ASC
    `;
    const [rows] = await pool.execute(query, [
      marriage.suami_id,
      marriage.istri_id,
    ]);
    return rows;
  }

  /**
   * Update marriage
   */
  static async update(marriageId, marriageData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      "tanggal_menikah",
      "tempat_menikah",
      "tanggal_cerai",
      "tempat_cerai",
      "status_perkawinan",
      "catatan",
    ];

    for (const [key, value] of Object.entries(marriageData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(marriageId);
    const query = `UPDATE marriages SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Update marriage status (e.g., divorce)
   */
  static async updateStatus(marriageId, status, divorceData = {}) {
    const fields = ["status_perkawinan = ?"];
    const values = [status];

    if (
      status.includes("Cerai") &&
      (divorceData.tanggal_cerai || divorceData.tempat_cerai)
    ) {
      if (divorceData.tanggal_cerai) {
        fields.push("tanggal_cerai = ?");
        values.push(divorceData.tanggal_cerai);
      }
      if (divorceData.tempat_cerai) {
        fields.push("tempat_cerai = ?");
        values.push(divorceData.tempat_cerai);
      }
    }

    values.push(marriageId);
    const query = `UPDATE marriages SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Delete marriage
   */
  static async delete(marriageId) {
    const query = "DELETE FROM marriages WHERE id = ?";
    const [result] = await pool.execute(query, [marriageId]);
    return result.affectedRows > 0;
  }

  /**
   * Check if marriage exists between two persons
   */
  static async exists(familyId, suamiId, istriId) {
    const query = `
      SELECT id FROM marriages 
      WHERE family_id = ? 
      AND suami_id = ? 
      AND istri_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [familyId, suamiId, istriId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all divorced marriages in a family
   */
  static async findDivorcedMarriages(familyId) {
    const query = `
      SELECT m.*, 
        ps.nama_lengkap as nama_suami,
        pi.nama_lengkap as nama_istri
      FROM marriages m
      LEFT JOIN persons ps ON m.suami_id = ps.id
      LEFT JOIN persons pi ON m.istri_id = pi.id
      WHERE m.family_id = ?
      AND m.status_perkawinan IN ('Cerai Hidup', 'Cerai Mati', 'Cerai Tercatat')
      ORDER BY m.tanggal_cerai DESC
    `;
    const [rows] = await pool.execute(query, [familyId]);
    return rows;
  }
}

module.exports = Marriage;
