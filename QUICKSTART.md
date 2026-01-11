# 🚀 Quick Start - Person & Marriage Implementation

## ⚡ TL;DR

Database sudah direfactor dengan 2 tabel terpisah:

- **`persons`** - data individu
- **`marriages`** - data pernikahan

**✅ Solusi:** Meskipun cerai, kedua orangtua tetap ada → **bisa tambah anak!**

---

## 📦 Installation

### 1. Run Migration

```bash
cd be
node src/database/migrate-to-persons-marriages.js
```

**Output:**

```
🚀 Starting migration...
✅ Tables created successfully
✅ Migrated 50 persons
✅ Created 20 marriages
✅ Updated 30 parent references
✅ MIGRATION COMPLETED!
```

### 2. Backend sudah siap!

Routes sudah di-register di `be/src/index.js`:

```javascript
app.use("/api/families", personRoutes);
```

### 3. Test API

```bash
# Get complete tree
curl http://localhost:5200/api/families/1/tree

# Add person
curl -X POST http://localhost:5200/api/families/1/persons \
  -H "Content-Type: application/json" \
  -d '{"namaDepan":"Ahmad","gender":"Pria"}'
```

---

## 🎯 Key Concepts

### ❌ Yang TIDAK Disimpan di Database:

1. **`isRoot`** - Computed: `!ayahId && !ibuId`
2. **`generation`** - Calculated recursive dari parents
3. **`anak` array** - Derived dari query `WHERE ayahId = :id OR ibuId = :id`

### ✅ Yang Disimpan di Database:

1. **`ayah_id`** - Reference ke father (persons table)
2. **`ibu_id`** - Reference ke mother (persons table)
3. **`suami_id, istri_id`** - References di marriages table

---

## 📡 API Usage

### Frontend: Get Tree with Computed Fields

```javascript
// Fetch tree
const response = await fetch("/api/families/1/tree");
const { tree } = await response.json();

// Each person has computed fields:
tree.forEach((person) => {
  console.log(person.namaLengkap);
  console.log("Generation:", person.generation); // ✅ Computed
  console.log("Is Root:", person.isRoot); // ✅ Computed
  console.log("Children:", person.children); // ✅ Derived
  console.log("Marriages:", person.marriages); // ✅ From marriages table
});
```

### Add Child to Divorced Couple

```javascript
// ✅ This works! Even if parents are divorced
await fetch("/api/families/1/persons", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    namaDepan: "Andi",
    gender: "Pria",
    ayahId: 1, // Budi (divorced)
    ibuId: 2, // Siti (divorced)
  }),
});

// ✅ Result: Andi successfully added!
// Parents still exist in persons table
```

### Create Marriage

```javascript
await fetch("/api/families/1/marriages", {
  method: "POST",
  body: JSON.stringify({
    suamiId: 1,
    istriId: 2,
    statusPerkawinan: "Menikah",
    tanggalMenikah: "2000-05-15",
  }),
});
```

### Update Marriage to Divorced

```javascript
await fetch("/api/families/1/marriages/1/status", {
  method: "PUT",
  body: JSON.stringify({
    statusPerkawinan: "Cerai Tercatat",
    tanggalCerai: "2019-12-12",
  }),
});

// ✅ Result: Marriage status updated
// ✅ Both persons still exist
// ✅ Children still valid!
```

---

## 🎨 Frontend Helpers

### Use Helper Functions

```javascript
import {
  isRoot,
  getGeneration,
  getChildren,
  enrichPersonsWithComputedFields,
} from "./utils/familyTreeHelpers";

// Enrich raw data
const enriched = enrichPersonsWithComputedFields(rawPersons);

// Now you have:
enriched.forEach((person) => {
  console.log(person.generation); // Computed
  console.log(person.isRoot); // Computed
  console.log(person.children); // Derived
  console.log(person.generationLabel); // "Gen 1", "Gen 2"
});
```

### Display Tree Node

```jsx
function PersonCard({ person, personMap }) {
  const gen = getGeneration(person, personMap);
  const children = getChildren(person.id, allPersons);

  return (
    <div className="person-card">
      <h3>{person.namaLengkap}</h3>
      <span className="badge">Gen {gen}</span>

      {isRoot(person) && <span className="badge-root">👑 Root</span>}

      <p>Children: {children.length}</p>

      {person.marriages?.map((m) => (
        <div key={m.id}>
          <span>{m.statusPerkawinan}</span>
          <span>{m.pasangan?.namaLengkap}</span>
          {m.tanggalCerai && (
            <span className="text-red">Cerai: {m.tanggalCerai}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Benefits

| Before                          | After               |
| ------------------------------- | ------------------- |
| Suami cerai → hilang dari KK    | ✅ Person tetap ada |
| Tidak bisa tambah anak          | ✅ Bisa tambah anak |
| Generation manual               | ✅ Auto calculated  |
| Array anak tidak sync           | ✅ Always derived   |
| Tidak support multiple marriage | ✅ Support poligami |

---

## 📚 Documentation Files

1. **[DATABASE_REFACTORING_GUIDE.md](DATABASE_REFACTORING_GUIDE.md)**  
   Overview lengkap refactoring

2. **[DATABASE_REVISIONS.md](DATABASE_REVISIONS.md)**  
   Field yang dihapus dan revisi

3. **[API_ENDPOINTS.md](API_ENDPOINTS.md)**  
   Dokumentasi lengkap API endpoints

4. **[REVISI_SUMMARY.md](REVISI_SUMMARY.md)**  
   Summary semua perubahan

5. **Helper Functions:**

   - `fe/src/utils/familyTreeHelpers.js`
   - `fe/src/components/FamilyTreeExample.jsx`

6. **Backend Models:**

   - `be/src/models/Person.js`
   - `be/src/models/Marriage.js`

7. **Migration:**
   - `be/src/database/migrations/2026-01-07_refactor_person_marriage.sql`
   - `be/src/database/migrate-to-persons-marriages.js`

---

## ✅ Checklist

- [x] Migration SQL created
- [x] Migration script created
- [x] Person model with generation calculation
- [x] Marriage model with divorce support
- [x] API routes updated
- [x] Frontend helpers created
- [x] Example component created
- [x] Documentation completed
- [x] Backend index.js updated

---

## 🐛 Common Issues

### Issue: "Cannot find module './models/Person'"

**Solution:**

```bash
# Make sure files exist:
ls be/src/models/Person.js
ls be/src/models/Marriage.js
```

### Issue: "persons table doesn't exist"

**Solution:**

```bash
# Run migration:
node be/src/database/migrate-to-persons-marriages.js
```

### Issue: "Generation always returns 0"

**Solution:**
Make sure to pass `personMap` to `getGeneration()`:

```javascript
const personMap = buildPersonMap(allPersons);
const gen = getGeneration(person, personMap);
```

---

## 🎉 Done!

Struktur database sudah proper:

- ✅ Person terpisah dari marriage
- ✅ Cerai tidak menghilangkan orangtua
- ✅ Generation calculated otomatis
- ✅ Children derived dari query
- ✅ Support multiple marriages

**Masalah sudah solved! 🚀**

---

**Updated:** 7 January 2026  
**Status:** ✅ Ready to Use
