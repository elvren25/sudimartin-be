# 📋 Database Refactoring: Person dan Marriage Tables

## 🎯 Tujuan Refactoring

Memisahkan data **person** (individu) dan **marriage** (pernikahan) ke dalam 2 tabel terpisah untuk menyelesaikan masalah:

### ❌ Problem Statement

**Sebelumnya:**

- Tabel `family_members` mencampur data pribadi dengan status pernikahan
- Ketika status istri **"Cerai"** → nama suami tidak muncul di KK (Kartu Keluarga)
- Ketika nama suami tidak ada → **tidak bisa menambahkan anak**
- Tidak bisa track multiple marriages (poligami atau menikah lagi setelah cerai)

**Sekarang:**

- ✅ Data person terpisah dari marriage
- ✅ Meskipun cerai, kedua orang tua tetap ada di database
- ✅ Anak bisa ditambahkan dengan referensi `ayah_id` dan `ibu_id` yang tetap valid
- ✅ Bisa track multiple marriages per person

---

## 📊 Struktur Database Baru

### 1. Tabel `persons`

Menyimpan data individu/person.

```sql
CREATE TABLE persons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  user_id INT,

  -- Personal Info
  nama_depan VARCHAR(100) NOT NULL,
  nama_belakang VARCHAR(100),
  nama_sapaan VARCHAR(100),
  nama_lengkap VARCHAR(255) GENERATED ALWAYS AS (...),
  gender ENUM('Pria', 'Wanita') NOT NULL,

  -- Birth/Death
  tanggal_lahir DATE,
  tempat_lahir VARCHAR(100),
  tanggal_meninggal DATE,
  tempat_meninggal VARCHAR(100),
  status_hidup ENUM('Hidup', 'Meninggal'),

  -- Parent References
  ayah_id INT,  -- Reference to father in persons table
  ibu_id INT,   -- Reference to mother in persons table

  -- Other fields...
  generation INT,
  pekerjaan VARCHAR(100),
  biography TEXT,
  photo_url LONGTEXT,

  FOREIGN KEY (ayah_id) REFERENCES persons(id),
  FOREIGN KEY (ibu_id) REFERENCES persons(id)
);
```

**Key Features:**

- ✅ Setiap person punya record sendiri
- ✅ `ayah_id` dan `ibu_id` selalu valid meskipun orangtua cerai
- ✅ Tidak ada field `status_menikah` (pindah ke tabel marriages)

### 2. Tabel `marriages`

Menyimpan data pernikahan sebagai relationship terpisah.

```sql
CREATE TABLE marriages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,

  -- Spouse References
  suami_id INT NOT NULL,  -- Reference to husband
  istri_id INT NOT NULL,  -- Reference to wife

  -- Marriage Info
  tanggal_menikah DATE,
  tempat_menikah VARCHAR(100),

  -- Divorce Info
  tanggal_cerai DATE,
  tempat_cerai VARCHAR(100),

  -- Status
  status_perkawinan ENUM(
    'Menikah',
    'Cerai Hidup',
    'Cerai Mati',
    'Cerai Tercatat',
    'Belum Kawin'
  ),

  FOREIGN KEY (suami_id) REFERENCES persons(id),
  FOREIGN KEY (istri_id) REFERENCES persons(id)
);
```

**Key Features:**

- ✅ Marriage adalah relationship terpisah
- ✅ Bisa ada multiple marriages per person (poligami, remarriage)
- ✅ Status cerai tersimpan di marriage, bukan di person
- ✅ Suami dan istri tetap ada di persons table meskipun cerai

---

## 🔄 Contoh Use Case: Cerai dengan Anak

### Sebelumnya (❌ Problem):

```
family_members:
  id=1, nama="Budi", gender="Pria", status_menikah="Cerai Tercatat"
  id=2, nama="Siti", gender="Wanita", status_menikah="Cerai Tercatat"
  id=3, nama="Andi", gender="Pria", ayah_id=1, ibu_id=2  ← ERROR jika Budi tidak ada di KK!
```

Jika Budi tidak muncul di KK karena cerai, tidak bisa tambahkan Andi sebagai anak.

### Sekarang (✅ Solution):

```sql
-- Persons table (tetap ada meskipun cerai)
persons:
  id=1, nama="Budi", gender="Pria"       ← Tetap ada di database
  id=2, nama="Siti", gender="Wanita"     ← Tetap ada di database
  id=3, nama="Andi", gender="Pria", ayah_id=1, ibu_id=2  ← Anak bisa ditambahkan!

-- Marriages table (track status pernikahan)
marriages:
  id=1, suami_id=1, istri_id=2, status_perkawinan="Cerai Tercatat",
  tanggal_cerai="2019-12-12"
```

**✅ Benefit:**

- Budi dan Siti tetap ada sebagai persons
- Status cerai tercatat di marriages table
- Andi bisa ditambahkan dengan referensi ayah_id=1, ibu_id=2
- Bahkan jika Budi tidak tampil di KK, tetap bisa tambahkan anak!

---

## 🛠️ Migration Process

### 1. Run Migration SQL

File: `be/src/database/migrations/2026-01-07_refactor_person_marriage.sql`

```bash
# Execute di database
mysql -u username -p database_name < be/src/database/migrations/2026-01-07_refactor_person_marriage.sql
```

### 2. Run Data Migration Script

File: `be/src/database/migrate-to-persons-marriages.js`

```bash
cd be
node src/database/migrate-to-persons-marriages.js
```

Script ini akan:

- ✅ Backup `family_members` ke `family_members_backup`
- ✅ Migrate semua data ke `persons` table
- ✅ Extract marriages dari members yang menikah
- ✅ Update parent references (ayah_id, ibu_id)
- ✅ Update relationships table

---

## 📡 API Endpoints Baru

### Person Endpoints

```javascript
// Add person
POST   /api/families/:id/persons
Body: { nama_depan, gender, tanggal_lahir, ayah_id, ibu_id, ... }

// Get all persons in family
GET    /api/families/:id/persons

// Get specific person with full details
GET    /api/families/:id/persons/:personId
Response: { ...person, ayah, ibu, children, siblings, marriages }

// Update person
PUT    /api/families/:id/persons/:personId

// Delete person
DELETE /api/families/:id/persons/:personId

// Get person's children
GET    /api/families/:id/persons/:personId/children

// Get person's marriages
GET    /api/families/:id/persons/:personId/marriages
```

### Marriage Endpoints

```javascript
// Create marriage
POST   /api/families/:id/marriages
Body: { suami_id, istri_id, tanggal_menikah, status_perkawinan }

// Get all marriages in family
GET    /api/families/:id/marriages

// Get specific marriage with children
GET    /api/families/:id/marriages/:marriageId

// Update marriage
PUT    /api/families/:id/marriages/:marriageId

// Update marriage status (divorce)
PUT    /api/families/:id/marriages/:marriageId/status
Body: { status_perkawinan: "Cerai Tercatat", tanggal_cerai, tempat_cerai }

// Delete marriage
DELETE /api/families/:id/marriages/:marriageId
```

### Family Tree Endpoint

```javascript
// Get complete family tree (persons + marriages combined)
GET    /api/families/:id/tree
Response: {
  family: { ... },
  tree: [
    {
      ...person_data,
      marriages: [
        { ...marriage_data, pasangan: {...} }
      ],
      children: [ {...}, {...} ]
    }
  ]
}
```

---

## 🎨 Frontend Integration

### Contoh: Menambahkan Anak dari Pasangan Cerai

```javascript
// 1. Get persons (suami dan istri tetap ada meskipun cerai)
const persons = await api.get(`/api/families/${familyId}/persons`);

// Budi (id=1) dan Siti (id=2) tetap ada di list
const budi = persons.find((p) => p.nama_depan === "Budi");
const siti = persons.find((p) => p.nama_depan === "Siti");

// 2. Check marriage status
const marriages = await api.get(`/api/families/${familyId}/marriages`);
const theirMarriage = marriages.find(
  (m) => m.suami_id === budi.id && m.istri_id === siti.id
);
// theirMarriage.status_perkawinan === "Cerai Tercatat"

// 3. Tambahkan anak (tetap bisa meskipun cerai!)
await api.post(`/api/families/${familyId}/persons`, {
  nama_depan: "Andi",
  gender: "Pria",
  tanggal_lahir: "2010-05-15",
  ayah_id: budi.id, // ✅ Valid karena Budi tetap ada
  ibu_id: siti.id, // ✅ Valid karena Siti tetap ada
  generation: budi.generation + 1,
});
```

### Contoh: Display Family Tree

```javascript
// Get complete tree data
const { data } = await api.get(`/api/families/${familyId}/tree`);

// data.tree contains persons with marriages and children
data.tree.forEach((person) => {
  console.log(`Person: ${person.nama_lengkap}`);

  // Show marriages
  person.marriages.forEach((marriage) => {
    console.log(
      `  - ${marriage.status_perkawinan} dengan ${marriage.pasangan.nama_lengkap}`
    );
    if (marriage.tanggal_cerai) {
      console.log(`    Cerai: ${marriage.tanggal_cerai}`);
    }
  });

  // Show children (tetap ada meskipun cerai)
  person.children.forEach((child) => {
    console.log(`  - Anak: ${child.nama_lengkap}`);
  });
});
```

---

## ✅ Benefits Summary

| Sebelum                                                   | Sesudah                                                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| ❌ Suami cerai hilang dari KK → tidak bisa tambahkan anak | ✅ Person tetap ada meskipun cerai, anak bisa ditambahkan |
| ❌ Status menikah tercampur dengan data pribadi           | ✅ Marriage terpisah sebagai relationship                 |
| ❌ Tidak bisa track multiple marriages                    | ✅ Bisa track poligami dan remarriage                     |
| ❌ Data tidak normalized                                  | ✅ Database normalized dan proper                         |
| ❌ Sulit handle edge cases                                | ✅ Handle semua edge cases dengan proper                  |

---

## 🔧 Models yang Tersedia

### Person Model

- `Person.create(personData)`
- `Person.findById(personId)`
- `Person.findByFamilyId(familyId)`
- `Person.getChildren(personId)`
- `Person.getParents(personId)`
- `Person.getSiblings(personId)`
- `Person.update(personId, data)`
- `Person.delete(personId)`
- `Person.getFamilyTreeWithMarriages(familyId)` ← Complete tree!

### Marriage Model

- `Marriage.create(marriageData)`
- `Marriage.findById(marriageId)`
- `Marriage.findByFamilyId(familyId)`
- `Marriage.findByPersonId(personId)`
- `Marriage.findActiveMarriage(personId)`
- `Marriage.getChildren(marriageId)`
- `Marriage.updateStatus(marriageId, status, divorceData)`
- `Marriage.delete(marriageId)`
- `Marriage.exists(familyId, suamiId, istriId)`

---

## 📝 Notes

1. **Old table `family_members`**: Tetap ada sebagai backup, bisa di-rename atau di-drop setelah verifikasi
2. **Relationships table**: Sudah di-update untuk referensi ke persons table
3. **Frontend**: Perlu update untuk menggunakan endpoint baru `/persons` dan `/marriages`
4. **Backward compatibility**: API lama (`/members`) masih bisa digunakan jika belum migrate frontend

---

## 🚀 Next Steps

1. ✅ Run migration SQL
2. ✅ Run migration script
3. ⏳ Test API endpoints baru
4. ⏳ Update frontend untuk gunakan endpoint baru
5. ⏳ Verify semua fitur berjalan dengan baik
6. ⏳ Drop/rename old table jika sudah yakin

---

**Dibuat oleh:** GitHub Copilot  
**Tanggal:** 7 Januari 2026  
**Versi:** 1.0
