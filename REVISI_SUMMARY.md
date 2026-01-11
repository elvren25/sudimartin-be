# ✅ REVISI SELESAI - Database Person & Marriage

## 📋 Yang Sudah Dikerjakan

### 1. ❌ **Hapus Field yang Tidak Diperlukan**

#### a) Field `isRoot`

- ✅ **Dihapus dari database**
- ✅ **Diganti dengan function** `isRoot(person)` yang check `!ayahId && !ibuId`
- ✅ Computed saat fetch data, tidak disimpan

#### b) Field `generation`

- ✅ **Dihapus dari database table**
- ✅ **Diganti dengan recursive function** `calculateGeneration()`
- ✅ Computed dynamically dari parent hierarchy
- ✅ Root = 1, Children = max(parent gen) + 1

#### c) Array `anak`

- ✅ **TIDAK disimpan di database**
- ✅ **Derived dari query** `WHERE ayahId = :id OR ibuId = :id`
- ✅ Selalu konsisten dan up-to-date

---

## 📦 File yang Dibuat/Diupdate

### Backend

1. **Migration SQL** - [migrations/2026-01-07_refactor_person_marriage.sql](be/src/database/migrations/2026-01-07_refactor_person_marriage.sql)

   - ✅ Tabel `persons` tanpa field generation
   - ✅ Tabel `marriages` untuk track pernikahan
   - ✅ Parent references: `ayah_id`, `ibu_id`

2. **Person Model** - [models/Person.js](be/src/models/Person.js)

   - ✅ `isRoot(person)` - check if no parents
   - ✅ `calculateGeneration(personId, personMap)` - recursive calculation
   - ✅ `getChildren(personId)` - derive from ayah_id/ibu_id query
   - ✅ `getFamilyTreeWithMarriages()` - full tree dengan computed fields

3. **Marriage Model** - [models/Marriage.js](be/src/models/Marriage.js)

   - ✅ Handle multiple marriages per person
   - ✅ Track status: Menikah, Cerai Hidup, Cerai Mati, Cerai Tercatat
   - ✅ Support divorce dengan tanggal_cerai

4. **API Routes** - [routes/personRoutes.js](be/src/routes/personRoutes.js)

   - ✅ CRUD for persons
   - ✅ CRUD for marriages
   - ✅ `/api/families/:id/tree` - complete tree dengan computed fields
   - ✅ `/api/families/:id/persons/:personId/children` - derive children

5. **Migration Script** - [migrate-to-persons-marriages.js](be/src/database/migrate-to-persons-marriages.js)
   - ✅ Convert `family_members` → `persons` + `marriages`
   - ✅ Extract marriages dari status_menikah
   - ✅ Update parent references
   - ✅ Backup data lama

### Frontend

1. **Helper Functions** - [utils/familyTreeHelpers.js](fe/src/utils/familyTreeHelpers.js)

   ```javascript
   -isRoot(person) -
     getGeneration(person, personMap) -
     getChildren(personId, allPersons) -
     getParents(person, personMap) -
     getSiblings(person, allPersons) -
     enrichPersonsWithComputedFields(persons);
   ```

2. **Example Component** - [components/FamilyTreeExample.jsx](fe/src/components/FamilyTreeExample.jsx)
   - ✅ Display persons dengan generation label
   - ✅ Group by generation
   - ✅ Show children (derived)
   - ✅ Handle divorced couples

### Dokumentasi

1. **Main Guide** - [DATABASE_REFACTORING_GUIDE.md](DATABASE_REFACTORING_GUIDE.md)

   - Overview refactoring
   - Problem & solution
   - API endpoints
   - Migration process

2. **Revisions** - [DATABASE_REVISIONS.md](DATABASE_REVISIONS.md)
   - ✅ Daftar field yang dihapus
   - ✅ Struktur final
   - ✅ Implementation guide
   - ✅ Benefits

---

## 🎯 Solusi untuk Problem Statement

### ❌ Problem: Istri Cerai → Suami Hilang di KK → Tidak Bisa Tambah Anak

```
Before (SALAH):
family_members:
  - id=1, nama="Budi", status_menikah="Cerai" ❌ Hilang dari KK
  - id=2, nama="Siti", status_menikah="Cerai"
  - id=3, nama="Andi", ayah_id=1, ibu_id=2 ❌ ERROR! Budi tidak ada!
```

### ✅ Solution: Person Tetap Ada, Marriage Terpisah

```
After (BENAR):
persons:
  - id=1, nama="Budi" ✅ Tetap ada di database
  - id=2, nama="Siti" ✅ Tetap ada di database
  - id=3, nama="Andi", ayah_id=1, ibu_id=2 ✅ Bisa ditambahkan!

marriages:
  - id=1, suami_id=1, istri_id=2, status="Cerai Tercatat" ✅ Track divorce
```

**✅ Result:**

- Budi dan Siti tetap ada sebagai persons
- Status cerai tercatat di marriages
- Anak bisa ditambahkan dengan referensi ayah_id=1, ibu_id=2
- Children derived dari ayah_id/ibu_id, bukan dari stored array

---

## 🔄 Cara Kerja Generation Calculation

### Root Person (Patriarch/Matriarch)

```javascript
// ayahId = null, ibuId = null
isRoot(person); // true
getGeneration(person); // 1
```

### Children (Gen 2)

```javascript
// ayahId = 1 (root), ibuId = 2 (root)
getGeneration(person)
  = max(
      getGeneration(ayah), // 1
      getGeneration(ibu)   // 1
    ) + 1
  = 2
```

### Grandchildren (Gen 3)

```javascript
// ayahId = 3 (gen 2), ibuId = 4 (gen 2)
getGeneration(person)
  = max(
      getGeneration(ayah), // 2
      getGeneration(ibu)   // 2
    ) + 1
  = 3
```

---

## 🎨 Frontend Usage Examples

### Example 1: Display with Generation

```javascript
import { enrichPersonsWithComputedFields } from "./utils/familyTreeHelpers";

const enriched = enrichPersonsWithComputedFields(rawPersons);

enriched.forEach((person) => {
  console.log(`${person.namaLengkap} - Gen ${person.generation}`);
  console.log(`Is Root: ${person.isRoot}`);
  console.log(`Children: ${person.children.length}`);
});
```

### Example 2: Add Child to Divorced Couple

```javascript
// ✅ Works! Even if divorced
await api.post(`/api/families/${familyId}/persons`, {
  namaDepan: "Andi",
  gender: "Pria",
  ayahId: budiId, // ✅ Budi still exists
  ibuId: sitiId, // ✅ Siti still exists
});
```

### Example 3: Display Tree Node

```javascript
function TreeNode({ person, personMap }) {
  const gen = getGeneration(person, personMap);
  const children = getChildren(person.id, allPersons);

  return (
    <div>
      <h4>{person.namaLengkap}</h4>
      <span>Gen {gen}</span>
      {isRoot(person) && <span>👑 Root</span>}
      <p>Children: {children.length}</p>
    </div>
  );
}
```

---

## ✅ Checklist Final

- [x] ❌ Hapus field `isRoot` dari database
- [x] ❌ Hapus field `generation` dari database
- [x] ❌ Jangan simpan array `anak`
- [x] ✅ Function `isRoot()` untuk check
- [x] ✅ Function `calculateGeneration()` recursive
- [x] ✅ Derive children dari ayah_id/ibu_id
- [x] ✅ Person model updated
- [x] ✅ Marriage model created
- [x] ✅ API routes updated
- [x] ✅ Migration SQL ready
- [x] ✅ Migration script ready
- [x] ✅ Frontend helpers created
- [x] ✅ Example component created
- [x] ✅ Dokumentasi lengkap

---

## 🚀 Next Steps

### 1. Run Migration

```bash
cd be
node src/database/migrate-to-persons-marriages.js
```

### 2. Update Backend Routes

```javascript
// be/src/index.js
app.use("/api/families", require("./src/routes/personRoutes"));
```

### 3. Update Frontend

```bash
# Copy helper functions
cp fe/src/utils/familyTreeHelpers.js <your-frontend>/utils/

# Use in components
import { enrichPersonsWithComputedFields } from './utils/familyTreeHelpers';
```

### 4. Test API

```bash
# Get tree with computed fields
GET /api/families/1/tree

# Add person
POST /api/families/1/persons

# Add marriage
POST /api/families/1/marriages

# Update marriage status (divorce)
PUT /api/families/1/marriages/1/status
```

---

## 📊 Benefits Summary

| Sebelum                            | Sesudah                                     |
| ---------------------------------- | ------------------------------------------- |
| ❌ Suami cerai hilang → anak error | ✅ Person tetap ada → anak bisa ditambahkan |
| ❌ Generation manual → bisa salah  | ✅ Generation calculated → selalu akurat    |
| ❌ Array anak → bisa dobel/hilang  | ✅ Children derived → konsisten             |
| ❌ isRoot field redundant          | ✅ isRoot computed on-the-fly               |
| ❌ Data tidak normalized           | ✅ Proper normalization                     |
| ❌ Tidak support multiple marriage | ✅ Support poligami & remarriage            |

---

**Status:** ✅ SELESAI  
**Date:** 7 January 2026  
**Version:** 2.0 (Revised)
