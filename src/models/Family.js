const pool = require("../config/database");
const { PRIVACY_TYPE } = require("../config/constants");

class Family {
  /**
   * Create a new family/silsilah
   */
  static async create(familyData) {
    const query = `
      INSERT INTO families (admin_id, nama_keluarga, deskripsi, privacy_type, access_code, photo_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      familyData.admin_id,
      familyData.nama_keluarga,
      familyData.deskripsi || null,
      familyData.privacy_type || PRIVACY_TYPE.PRIVATE,
      familyData.access_code || null,
      familyData.photo_url || null,
    ];

    const [result] = await pool.execute(query, values);
    return {
      id: result.insertId,
      ...familyData,
      privacy_type: familyData.privacy_type || PRIVACY_TYPE.PRIVATE,
      created_at: new Date(),
    };
  }

  /**
   * Get family by ID
   */
  static async findById(familyId) {
    const query = "SELECT * FROM families WHERE id = ?";
    const [rows] = await pool.execute(query, [familyId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get family by name
   */
  static async findByName(namaKeluarga) {
    const query = "SELECT * FROM families WHERE nama_keluarga = ?";
    const [rows] = await pool.execute(query, [namaKeluarga]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all families by admin ID
   */
  static async findByAdminId(adminId) {
    const query =
      "SELECT * FROM families WHERE admin_id = ? ORDER BY created_at DESC";
    const [rows] = await pool.execute(query, [adminId]);
    return rows;
  }

  /**
   * Get all public families
   */
  static async findPublic() {
    const query =
      "SELECT * FROM families WHERE privacy_type = ? ORDER BY created_at DESC";
    const [rows] = await pool.execute(query, [PRIVACY_TYPE.PUBLIC]);
    return rows;
  }

  /**
   * Update family
   */
  static async update(familyId, familyData) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(familyData)) {
      if (key === "id" || key === "admin_id" || key === "created_at") continue;

      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return false;

    values.push(familyId);
    const query = `UPDATE families SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Update canvas layout data
   */
  static async updateCanvasLayout(familyId, layoutData) {
    const query = `UPDATE families SET canvas_layout_data = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, [
      JSON.stringify(layoutData),
      familyId,
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Get canvas layout data
   */
  static async getCanvasLayout(familyId) {
    const query = "SELECT canvas_layout_data FROM families WHERE id = ?";
    const [rows] = await pool.execute(query, [familyId]);

    if (rows.length === 0) return null;

    try {
      return rows[0].canvas_layout_data
        ? JSON.parse(rows[0].canvas_layout_data)
        : {};
    } catch {
      return {};
    }
  }

  /**
   * Delete family and all related data
   */
  static async delete(familyId) {
    const query = "DELETE FROM families WHERE id = ?";
    const [result] = await pool.execute(query, [familyId]);
    return result.affectedRows > 0;
  }

  /**
   * Check if user is admin of family
   */
  static async isAdminOf(familyId, userId) {
    const family = await this.findById(familyId);
    return family && family.admin_id === userId;
  }

  /**
   * Get family count by admin
   */
  static async getCountByAdmin(adminId) {
    const query = "SELECT COUNT(*) as count FROM families WHERE admin_id = ?";
    const [rows] = await pool.execute(query, [adminId]);
    return rows[0].count;
  }

  /**
   * Verify access code for a family
   */
  static async verifyAccessCode(familyId, accessCode) {
    const query = "SELECT * FROM families WHERE id = ? AND access_code = ?";
    const [rows] = await pool.execute(query, [familyId, accessCode]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Verify access code for a family by name
   */
  static async verifyAccessCodeByName(namaKeluarga, accessCode) {
    const query =
      "SELECT * FROM families WHERE nama_keluarga = ? AND access_code = ?";
    const [rows] = await pool.execute(query, [namaKeluarga, accessCode]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = Family;
