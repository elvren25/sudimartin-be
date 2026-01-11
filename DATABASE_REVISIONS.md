# 🔄 Database Revisions - Person & Marriage Tables

## ⚠️ REVISI PENTING (7 Jan 2026)

### ❌ Field yang HARUS DIHAPUS:

1. **`isRoot` field** - JANGAN simpan di database!

   ```javascript
   // ✅ BENAR: Hitung dinamis dengan function
   function isRoot(person) {
     return !person.ayahId && !person.ibuId;
   }
   ```

2. **`anak` array** - BERBAHAYA! Bikin data dobel & tidak sinkron

   ```javascript
   // ❌ SALAH: Simpan array anak
   person.anak = ["id1", "id2", "id3"]

   // ✅ BENAR: Derive dari query
   SELECT * FROM persons WHERE ayahId = :id OR ibuId = :id
   ```

3. **`generation` field** - WAJIB dihitung dengan FUNCTION, bukan disimpan!

   ```javascript
   // ✅ BENAR: Calculate recursive
   function getGeneration(person, personMap) {
     // Root: no parents
     if (!person.ayahId && !person.ibuId) return 1;

     // Calculate from parents
     const fatherGen = person.ayahId
       ? getGeneration(personMap[person.ayahId], personMap)
       : 0;
     const motherGen = person.ibuId
       ? getGeneration(personMap[person.ibuId], personMap)
       : 0;

     return Math.max(fatherGen, motherGen) + 1;
   }

   // DI UI (LABEL)
   const gen = getGeneration(person, peopleMap);
   label = `Gen ${gen}`;
   ```

---

## ✅ STRUKTUR FINAL (REKOMENDASI)

### Person Object (Response API)

```json
{
  "id": "uuid",
  "namaDepan": "Ahmad",
  "namaBelakang": "Bin Ali",
  "gender": "M",
  "tanggalLahir": "1980-01-01",
  "tanggalWafat": null,

  "ayahId": null,
  "ibuId": null,

  "photoUrl": null,
  "alamat": "Jakarta",
  "pekerjaan": "Petani",

  "createdAt": "2025-01-01",
  "updatedAt": "2025-01-01",

  "generation": 1,
  "isRoot": true
}
```

**NOTES:**

- ✅ `generation` dan `isRoot` dihitung saat fetch, TIDAK disimpan di DB
- ✅ `anak` array TIDAK ada - derive dari query ayahId/ibuId
- ✅ Support multiple marriages via `marriages` table terpisah

---

## 🗄️ Database Schema (FINAL)

### Table: `persons`

```sql
CREATE TABLE persons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT,

  -- Personal Info
  nama_depan VARCHAR(100) NOT NULL,
  nama_belakang VARCHAR(100),
  nama_sapaan VARCHAR(100),
  nama_lengkap VARCHAR(255) GENERATED,
  gender ENUM('Pria', 'Wanita') NOT NULL,

  -- Birth/Death
  tanggal_lahir DATE,
  tempat_lahir VARCHAR(100),
  tanggal_meninggal DATE,
  tempat_meninggal VARCHAR(100),
  status_hidup ENUM('Hidup', 'Meninggal'),

  -- Parent References (untuk derive children)
  ayah_id INT,
  ibu_id INT,

  -- Other Info
  pekerjaan VARCHAR(100),
  pendidikan VARCHAR(100),
  biography TEXT,
  photo_url LONGTEXT,

  -- NO generation field!
  -- NO isRoot field!
  -- NO anak array field!

  FOREIGN KEY (ayah_id) REFERENCES persons(id),
  FOREIGN KEY (ibu_id) REFERENCES persons(id)
);
```

### Table: `marriages`

```sql
CREATE TABLE marriages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,

  suami_id INT NOT NULL,
  istri_id INT NOT NULL,

  tanggal_menikah DATE,
  tempat_menikah VARCHAR(100),
  tanggal_cerai DATE,
  tempat_cerai VARCHAR(100),

  status_perkawinan ENUM(
    'Menikah',
    'Cerai Hidup',
    'Cerai Mati',
    'Cerai Tercatat'
  ),

  FOREIGN KEY (suami_id) REFERENCES persons(id),
  FOREIGN KEY (istri_id) REFERENCES persons(id)
);
```

---

## 🎯 API Implementation

### Person Model - Generation Function

```javascript
class Person {
  /**
   * Check if person is root (no parents)
   */
  static isRoot(person) {
    return !person.ayah_id && !person.ibu_id;
  }

  /**
   * Calculate generation recursively
   */
  static async calculateGeneration(personId, personMap = null) {
    const person = personMap
      ? personMap.get(personId)
      : await this.findById(personId);

    if (!person) return 0;

    // Root: no parents = generation 1
    if (this.isRoot(person)) return 1;

    // Recursive: max parent generation + 1
    const fatherGen = person.ayah_id
      ? await this.calculateGeneration(person.ayah_id, personMap)
      : 0;
    const motherGen = person.ibu_id
      ? await this.calculateGeneration(person.ibu_id, personMap)
      : 0;

    return Math.max(fatherGen, motherGen) + 1;
  }

  /**
   * Get children (derived from ayahId/ibuId)
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
   * Get family tree with computed fields
   */
  static async getFamilyTreeWithMarriages(familyId) {
    const persons = await this.findByFamilyId(familyId);
    const [marriages] = await pool.execute(
      "SELECT * FROM marriages WHERE family_id = ?",
      [familyId]
    );

    const personMap = new Map();
    persons.forEach((person) => {
      personMap.set(person.id, {
        ...person,
        marriages: [],
        children: [], // Will be populated from query
        isRoot: this.isRoot(person),
      });
    });

    // Calculate generation for each
    for (const [id, person] of personMap.entries()) {
      person.generation = await this.calculateGeneration(id, personMap);
    }

    // Add marriages
    marriages.forEach((marriage) => {
      const suami = personMap.get(marriage.suami_id);
      const istri = personMap.get(marriage.istri_id);

      if (suami) {
        suami.marriages.push({ ...marriage, pasangan: istri });
      }
      if (istri) {
        istri.marriages.push({ ...marriage, pasangan: suami });
      }
    });

    // Derive children from ayah_id/ibu_id (NOT stored array!)
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
```

---

## 🎨 Frontend Usage

### Example 1: Display Person with Generation Label

```javascript
// Fetch tree data
const { data } = await api.get(`/api/families/${familyId}/tree`);

// Each person has computed generation
data.tree.forEach((person) => {
  console.log(`${person.nama_lengkap} - Gen ${person.generation}`);
  console.log(`Is Root: ${person.isRoot}`);

  // Children are derived, not stored
  console.log(`Children (${person.children.length}):`);
  person.children.forEach((child) => {
    console.log(`  - ${child.nama_lengkap}`);
  });
});
```

### Example 2: Check if Root

```javascript
function isRoot(person) {
  return !person.ayahId && !person.ibuId;
}

if (isRoot(person)) {
  console.log("This is a root person (patriarch/matriarch)");
}
```

### Example 3: Get All Children

```javascript
// Frontend can also derive children
function getChildren(personId, allPersons) {
  return allPersons.filter(
    (p) => p.ayahId === personId || p.ibuId === personId
  );
}

const children = getChildren(person.id, allPersons);
```

---

## ✅ Checklist Implementasi

- [x] ❌ Hapus field `isRoot` dari database
- [x] ❌ Hapus field `generation` dari database (calculated only)
- [x] ❌ Jangan simpan array `anak` di database
- [x] ✅ Buat function `isRoot()` untuk check parent null
- [x] ✅ Buat function `calculateGeneration()` recursive
- [x] ✅ Derive `children` dari query ayah_id/ibu_id
- [x] ✅ Return computed fields di API response
- [x] ✅ Update migration script
- [x] ✅ Update dokumentasi

---

## 🚀 Benefits

| Before                                         | After                                          |
| ---------------------------------------------- | ---------------------------------------------- |
| ❌ Generation disimpan manual, bisa tidak sync | ✅ Generation dihitung otomatis, selalu akurat |
| ❌ Array anak bisa dobel atau hilang           | ✅ Children derived dari parent IDs, konsisten |
| ❌ isRoot field redundant                      | ✅ isRoot computed on-the-fly                  |
| ❌ Data bisa tidak sinkron                     | ✅ Single source of truth (ayah_id/ibu_id)     |

---

**Created:** 7 January 2026  
**Version:** 2.0 (Revised)
