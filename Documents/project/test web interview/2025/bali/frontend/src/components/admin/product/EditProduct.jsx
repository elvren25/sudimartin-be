import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    sku: "",
    description: "",
    qty: 1,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreview, setNewPreview] = useState([]);
  const [showRedirectOptions, setShowRedirectOptions] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5005/api/products/${id}`).then((res) => {
      const { title, sku, description, qty, images } = res.data;
      setForm({ title, sku, description, qty });
      setExistingImages(images || []);
    });
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - existingImages.length;

    const selectedFiles = files.slice(0, remainingSlots);

    // Replace image baru sebelumnya dengan yang baru
    setNewImages(selectedFiles);
    setNewPreview(selectedFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }

    newImages.forEach((img) => {
      formData.append("images", img);
    });

    try {
      await axios.put(`http://localhost:5005/api/products/${id}`, formData);
      setShowRedirectOptions(true);
    } catch (error) {
      console.error(error);
      alert("❌ Gagal update produk.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-md shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">📝 Edit Produk</h2>

      {!showRedirectOptions ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            onChange={handleChange}
            value={form.title}
            className="border p-2 w-full"
            placeholder="Nama Produk"
            required
          />
          <input
            name="sku"
            onChange={handleChange}
            value={form.sku}
            className="border p-2 w-full"
            placeholder="SKU"
          />
          <input
            name="description"
            onChange={handleChange}
            value={form.description}
            className="border p-2 w-full"
            placeholder="Deskripsi"
          />
          <input
            name="qty"
            type="number"
            min="1"
            onChange={handleChange}
            value={form.qty}
            className="border p-2 w-full"
            placeholder="Jumlah"
          />

          {/* Gambar Lama */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">📸 Gambar Lama:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {existingImages.map((img, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5005/${img}`}
                    alt={`img-${index}`}
                    className="h-24 w-full object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload Gambar Baru */}
          <div>
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                handleImageChange(e);
                e.target.value = null; // ✅ reset input agar onChange tetap dipicu walau file sama
              }}
              className="hidden"
            />

            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-block text-sm text-blue-600 border border-dashed border-blue-400 p-3 w-full text-center rounded hover:bg-blue-50"
            >
              ➕ Klik di sini untuk Tambah Gambar Baru
              <br />
              <span className="text-xs text-gray-500">
                (Maks total 5 gambar termasuk gambar lama)
              </span>
            </label>
          </div>

          {/* Preview Gambar Baru */}
          {newPreview.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mt-2 mb-1">
                📷 Preview Gambar Baru:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {newPreview.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`new-${i}`}
                    className="h-24 w-full object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          <button className="bg-green-600 text-white py-2 px-4 rounded w-full hover:bg-green-700">
            Simpan Perubahan
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-green-600 font-semibold">
            ✅ Produk berhasil diperbarui!
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔧 Kembali ke Admin
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              🏠 Lihat di Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
