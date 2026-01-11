# 📡 API Documentation - Person & Marriage Endpoints

## Base URL

```
http://localhost:3000/api/families
```

---

## 🧑 Person Endpoints

### 1. Add Person to Family

```http
POST /api/families/:id/persons
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "namaDepan": "Ahmad",
  "namaBelakang": "Bin Ali",
  "gender": "Pria",
  "tanggalLahir": "1980-01-01",
  "tempatLahir": "Jakarta",
  "ayahId": null,
  "ibuId": null,
  "pekerjaan": "Petani",
  "photoUrl": "https://..."
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Person added successfully",
  "data": {
    "id": 1,
    "namaDepan": "Ahmad",
    "namaBelakang": "Bin Ali",
    "gender": "Pria",
    "generation": 1,
    "isRoot": true,
    "createdAt": "2026-01-07T..."
  }
}
```

---

### 2. Get All Persons in Family

```http
GET /api/families/:id/persons
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Persons retrieved successfully",
  "data": [
    {
      "id": 1,
      "namaDepan": "Ahmad",
      "namaBelakang": "Bin Ali",
      "namaLengkap": "Ahmad Bin Ali",
      "gender": "Pria",
      "ayahId": null,
      "ibuId": null,
      "isRoot": true,
      "tanggalLahir": "1980-01-01"
    },
    {
      "id": 2,
      "namaDepan": "Budi",
      "gender": "Pria",
      "ayahId": 1,
      "ibuId": null,
      "isRoot": false
    }
  ]
}
```

---

### 3. Get Specific Person with Full Details

```http
GET /api/families/:id/persons/:personId
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Person retrieved successfully",
  "data": {
    "id": 1,
    "namaLengkap": "Ahmad Bin Ali",
    "gender": "Pria",
    "tanggalLahir": "1980-01-01",
    "isRoot": true,
    "generation": 1,

    "ayah": null,
    "ibu": null,

    "children": [
      {
        "id": 2,
        "namaLengkap": "Budi Ahmad",
        "generation": 2
      }
    ],

    "siblings": [],

    "marriages": [
      {
        "id": 1,
        "pasangan": {
          "id": 3,
          "namaLengkap": "Siti Aminah"
        },
        "statusPerkawinan": "Menikah",
        "tanggalMenikah": "2000-05-15"
      }
    ]
  }
}
```

---

### 4. Update Person

```http
PUT /api/families/:id/persons/:personId
```

**Body:**

```json
{
  "namaDepan": "Ahmad Updated",
  "pekerjaan": "Dokter",
  "ayahId": 5,
  "ibuId": 6
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Person updated successfully",
  "data": {
    "id": 1,
    "namaDepan": "Ahmad Updated",
    "pekerjaan": "Dokter"
  }
}
```

---

### 5. Delete Person

```http
DELETE /api/families/:id/persons/:personId
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Person deleted successfully"
}
```

---

### 6. Get Children of Person

```http
GET /api/families/:id/persons/:personId/children
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Person children retrieved successfully",
  "data": [
    {
      "id": 10,
      "namaLengkap": "Andi",
      "gender": "Pria",
      "tanggalLahir": "2010-01-01"
    }
  ]
}
```

---

### 7. Get Marriages of Person

```http
GET /api/families/:id/persons/:personId/marriages
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Person marriages retrieved successfully",
  "data": [
    {
      "id": 1,
      "suamiId": 1,
      "istriId": 3,
      "namaSuami": "Ahmad Bin Ali",
      "namaIstri": "Siti Aminah",
      "statusPerkawinan": "Menikah",
      "tanggalMenikah": "2000-05-15",
      "tanggalCerai": null
    },
    {
      "id": 2,
      "suamiId": 1,
      "istriId": 4,
      "statusPerkawinan": "Cerai Tercatat",
      "tanggalCerai": "2019-12-12"
    }
  ]
}
```

---

## 💍 Marriage Endpoints

### 1. Create Marriage

```http
POST /api/families/:id/marriages
```

**Body:**

```json
{
  "suamiId": 1,
  "istriId": 3,
  "tanggalMenikah": "2000-05-15",
  "tempatMenikah": "Jakarta",
  "statusPerkawinan": "Menikah"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Marriage created successfully",
  "data": {
    "id": 1,
    "suamiId": 1,
    "istriId": 3,
    "statusPerkawinan": "Menikah",
    "tanggalMenikah": "2000-05-15"
  }
}
```

---

### 2. Get All Marriages in Family

```http
GET /api/families/:id/marriages
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Marriages retrieved successfully",
  "data": [
    {
      "id": 1,
      "suamiId": 1,
      "istriId": 3,
      "namaSuami": "Ahmad Bin Ali",
      "namaIstri": "Siti Aminah",
      "statusPerkawinan": "Menikah",
      "tanggalMenikah": "2000-05-15"
    }
  ]
}
```

---

### 3. Get Specific Marriage

```http
GET /api/families/:id/marriages/:marriageId
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Marriage retrieved successfully",
  "data": {
    "id": 1,
    "suamiId": 1,
    "istriId": 3,
    "statusPerkawinan": "Menikah",
    "tanggalMenikah": "2000-05-15",
    "children": [
      {
        "id": 10,
        "namaLengkap": "Andi Ahmad",
        "ayahId": 1,
        "ibuId": 3
      }
    ]
  }
}
```

---

### 4. Update Marriage

```http
PUT /api/families/:id/marriages/:marriageId
```

**Body:**

```json
{
  "tempatMenikah": "Bandung",
  "catatan": "Updated marriage info"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Marriage updated successfully",
  "data": {
    "id": 1,
    "tempatMenikah": "Bandung",
    "catatan": "Updated marriage info"
  }
}
```

---

### 5. Update Marriage Status (Divorce)

```http
PUT /api/families/:id/marriages/:marriageId/status
```

**Body:**

```json
{
  "statusPerkawinan": "Cerai Tercatat",
  "tanggalCerai": "2019-12-12",
  "tempatCerai": "Jakarta"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Marriage status updated successfully",
  "data": {
    "id": 1,
    "statusPerkawinan": "Cerai Tercatat",
    "tanggalCerai": "2019-12-12",
    "tempatCerai": "Jakarta"
  }
}
```

**Available Status:**

- `Menikah`
- `Cerai Hidup`
- `Cerai Mati`
- `Cerai Tercatat`
- `Belum Kawin`

---

### 6. Delete Marriage

```http
DELETE /api/families/:id/marriages/:marriageId
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Marriage deleted successfully"
}
```

---

## 🌲 Family Tree Endpoint

### Get Complete Family Tree

```http
GET /api/families/:id/tree
```

**Description:** Returns complete family tree with persons, marriages, and computed fields (generation, isRoot, children).

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Family tree retrieved successfully",
  "data": {
    "family": {
      "id": 1,
      "namaKeluarga": "Keluarga Ahmad",
      "privacyType": "private"
    },
    "tree": [
      {
        "id": 1,
        "namaLengkap": "Ahmad Bin Ali",
        "gender": "Pria",
        "generation": 1,
        "isRoot": true,

        "marriages": [
          {
            "id": 1,
            "statusPerkawinan": "Menikah",
            "pasangan": {
              "id": 3,
              "namaLengkap": "Siti Aminah"
            }
          },
          {
            "id": 2,
            "statusPerkawinan": "Cerai Tercatat",
            "tanggalCerai": "2019-12-12",
            "pasangan": {
              "id": 4,
              "namaLengkap": "Zarifah"
            }
          }
        ],

        "children": [
          {
            "id": 10,
            "namaLengkap": "Andi Ahmad",
            "generation": 2,
            "ayahId": 1,
            "ibuId": 3
          },
          {
            "id": 11,
            "namaLengkap": "Azmya Zarifah",
            "generation": 2,
            "ayahId": 1,
            "ibuId": 4
          }
        ]
      }
    ]
  }
}
```

**Key Features:**

- ✅ `generation` calculated dynamically (not stored)
- ✅ `isRoot` computed from ayahId/ibuId
- ✅ `children` derived from ayahId/ibuId query (not stored array)
- ✅ `marriages` includes divorced marriages
- ✅ Children visible even if parents divorced

---

## 🔧 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "nama_depan and gender are required"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You do not have permission to add persons to this family"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Family not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to add person",
  "error": "Database connection error"
}
```

---

## 📝 Important Notes

1. **Generation is Computed, Not Stored**

   - Generation calculated dynamically from parent hierarchy
   - Root = 1, Children = max(parent gen) + 1

2. **Children are Derived, Not Stored**

   - Query: `WHERE ayahId = :id OR ibuId = :id`
   - Always consistent and up-to-date

3. **Divorced Couples**

   - ✅ Both persons still exist in database
   - ✅ Can add children even after divorce
   - ✅ Marriage status tracked separately

4. **Multiple Marriages**
   - ✅ One person can have multiple marriages
   - ✅ Supports poligami and remarriage

---

## 🧪 Testing Examples

### Test 1: Add Root Person

```bash
curl -X POST http://localhost:3000/api/families/1/persons \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "namaDepan": "Ahmad",
    "gender": "Pria"
  }'
```

### Test 2: Add Child

```bash
curl -X POST http://localhost:3000/api/families/1/persons \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "namaDepan": "Budi",
    "gender": "Pria",
    "ayahId": 1,
    "ibuId": 3
  }'
```

### Test 3: Create Marriage

```bash
curl -X POST http://localhost:3000/api/families/1/marriages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "suamiId": 1,
    "istriId": 3,
    "statusPerkawinan": "Menikah"
  }'
```

### Test 4: Divorce

```bash
curl -X PUT http://localhost:3000/api/families/1/marriages/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "statusPerkawinan": "Cerai Tercatat",
    "tanggalCerai": "2019-12-12"
  }'
```

### Test 5: Get Full Tree

```bash
curl -X GET http://localhost:3000/api/families/1/tree \
  -H "Authorization: Bearer <token>"
```

---

**Version:** 2.0  
**Updated:** 7 January 2026
