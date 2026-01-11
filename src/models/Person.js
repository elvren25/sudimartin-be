const pool = require("../config/database");

class Person {
  /**
   * Create a new person
   */
  /**
   * Check if person is root (no parents)
   */
  static isRoot(person) {
    return !person.ayah_id && !person.ibu_id;
  }

  /**
   * Calculate generation recursively
   * Root = 1, Children = max(parent generations) + 1
   */
  static async calculateGeneration(personId, personMap = null) {
    const person = personMap
      ? personMap.get(personId)
      : await this.findById(personId);
    if (!person) return 0;

    // Root: no parents
    if (this.isRoot(person)) return 1;

    // Calculate parent generations
    const fatherGen = person.ayah_id
      ? await this.calculateGeneration(person.ayah_id, personMap)
      : 0;
    const motherGen = person.ibu_id
      ? await this.calculateGeneration(person.ibu_id, personMap)
      : 0;

    return Math.max(fatherGen, motherGen) + 1;
  }

  /**
   * Create a new person
   */
  static async create(personData) {
    const query = `
      INSERT INTO persons (
        family_id, user_id, nama_depan, nama_belakang, nama_panggilan, gender,
        tanggal_lahir, tempat_lahir, tanggal_meninggal, tempat_meninggal, status_hidup,
        ayah_id, ibu_id, pekerjaan, pendidikan, biography,
        contact_phone, contact_email, contact_address,
        nama_display, photo_url, node_position_x, node_position_y
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      personData.family_id,
      personData.user_id || null,
      personData.nama_depan,
      personData.nama_belakang || null,
      personData.nama_panggilan || null,
      personData.gender || "Pria",
      personData.tanggal_lahir || null,
      personData.tempat_lahir || null,
      personData.tanggal_meninggal || null,
      personData.tempat_meninggal || null,
      personData.status_hidup || "Hidup",
      personData.ayah_id || null,
      personData.ibu_id || null,
      personData.pekerjaan || null,
      personData.pendidikan || null,
      personData.biography || null,
      personData.contact_phone || null,
      personData.contact_email || null,
      personData.contact_address || null,
      personData.nama_display || "nama_depan",
      personData.photo_url || null,
      personData.node_position_x || 0,
      personData.node_position_y || 0,
    ];

    const [result] = await pool.execute(query, values);
    const newPerson = {
      id: result.insertId,
      ...personData,
      status_hidup: personData.status_hidup || "Hidup",
      created_at: new Date(),
    };

    // Calculate generation dynamically
    newPerson.generation = await this.calculateGeneration(newPerson.id);
    newPerson.isRoot = this.isRoot(newPerson);

    return newPerson;
  }

  /**
   * Get person by ID
   */
  static async findById(personId) {
    const query = "SELECT * FROM persons WHERE id = ?";
    const [rows] = await pool.execute(query, [personId]);
    if (rows.length === 0) return null;

    const person = rows[0];
    // Add computed fields
    person.isRoot = this.isRoot(person);
    // Note: generation will be calculated when needed in tree context

    return person;
  }

  /**
   * Get all persons in a family
   */
  static async findByFamilyId(familyId) {
    const query = `
      SELECT * FROM persons 
      WHERE family_id = ? 
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId]);

    // Add computed fields to each person
    return rows.map((person) => ({
      ...person,
      isRoot: this.isRoot(person),
    }));
  }

  /**
   * Get persons by generation
   */
  static async findByGeneration(familyId, generation) {
    const query = `
      SELECT * FROM persons 
      WHERE family_id = ? AND generation = ?
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(query, [familyId, generation]);
    return rows;
  }

  /**
   * Get person by user ID and family ID
   */
  static async findByUserIdAndFamilyId(userId, familyId) {
    const query = `
      SELECT * FROM persons 
      WHERE family_id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [familyId, userId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get children of a person
   */
  static async getChildren(personId) {
    const query = `
      SELECT * FROM persons 
      WHERE ayah_id = ? OR ibu_id = ?
      ORDER BY tanggal_lahir ASC
    `;
    const [rows] = await pool.execute(query, [personId, personId]);
    return rows;
  }

  /**
   * Get parents of a person
   */
  static async getParents(personId) {
    const person = await this.findById(personId);
    if (!person) return { ayah: null, ibu: null };

    const ayah = person.ayah_id ? await this.findById(person.ayah_id) : null;
    const ibu = person.ibu_id ? await this.findById(person.ibu_id) : null;

    return { ayah, ibu };
  }

  /**
   * Get siblings of a person
   */
  static async getSiblings(personId) {
    const person = await this.findById(personId);
    if (!person) return [];

    let query = `
      SELECT * FROM persons 
      WHERE id != ? 
      AND (
        (ayah_id = ? AND ayah_id IS NOT NULL) 
        OR (ibu_id = ? AND ibu_id IS NOT NULL)
      )
      ORDER BY tanggal_lahir ASC
    `;

    const [rows] = await pool.execute(query, [
      personId,
      person.ayah_id || 0,
      person.ibu_id || 0,
    ]);
    return rows;
  }

  /**
   * Update person
   */
  static async update(personId, personData) {
    const fields = [];
    const values = [];

    // List of fields that can be updated (generation is computed, not stored)
    const allowedFields = [
      "nama_depan",
      "nama_belakang",
      "nama_panggilan",
      "gender",
      "tanggal_lahir",
      "tempat_lahir",
      "tanggal_meninggal",
      "tempat_meninggal",
      "status_hidup",
      "ayah_id",
      "ibu_id",
      "pekerjaan",
      "pendidikan",
      "biography",
      "contact_phone",
      "contact_email",
      "contact_address",
      "nama_display",
      "photo_url",
      "node_position_x",
      "node_position_y",
    ];

    for (const [key, value] of Object.entries(personData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(personId);
    const query = `UPDATE persons SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Delete person
   */
  static async delete(personId) {
    const query = "DELETE FROM persons WHERE id = ?";
    const [result] = await pool.execute(query, [personId]);
    return result.affectedRows > 0;
  }

  /**
   * Search persons by name
   */
  static async searchByName(familyId, searchTerm) {
    const query = `
      SELECT * FROM persons 
      WHERE family_id = ? 
      AND (
        nama_depan LIKE ? 
        OR nama_belakang LIKE ? 
        OR nama_lengkap LIKE ?
      )
      ORDER BY nama_lengkap ASC
    `;
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.execute(query, [
      familyId,
      searchPattern,
      searchPattern,
      searchPattern,
    ]);
    return rows;
  }

  /**
   * Get complete family tree data with marriages
   */
  static async getFamilyTreeWithMarriages(familyId) {
    // Get all persons
    const persons = await this.findByFamilyId(familyId);

    // Get all marriages
    const [marriages] = await pool.execute(
      "SELECT * FROM marriages WHERE family_id = ?",
      [familyId]
    );

    // Build tree structure
    const personMap = new Map();
    persons.forEach((person) => {
      personMap.set(person.id, {
        ...person,
        marriages: [],
        children: [],
        isRoot: this.isRoot(person),
      });
    });

    // Calculate generation for each person
    for (const [id, person] of personMap.entries()) {
      person.generation = await this.calculateGeneration(id, personMap);
    }

    // Add marriages to persons
    marriages.forEach((marriage) => {
      const suami = personMap.get(marriage.suami_id);
      const istri = personMap.get(marriage.istri_id);

      if (suami) {
        suami.marriages.push({
          ...marriage,
          pasangan: istri,
        });
      }

      if (istri) {
        istri.marriages.push({
          ...marriage,
          pasangan: suami,
        });
      }
    });

    // Add children to parents (derived from ayah_id/ibu_id, NOT stored array)
    persons.forEach((person) => {
      if (person.ayah_id) {
        const ayah = personMap.get(person.ayah_id);
        if (ayah) ayah.children.push(person);
      }
      if (person.ibu_id) {
        const ibu = personMap.get(person.ibu_id);
        if (ibu && !ibu.children.find((c) => c.id === person.id)) {
          ibu.children.push(person);
        }
      }
    });

    return Array.from(personMap.values());
  }
}

module.exports = Person;
