import { useState } from "react";
import axios from "axios";

export default function AddProduct() {
  const [form, setForm] = useState({
    title: "",
    sku: "",
    description: "",
    qty: 1,
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const fileList = Array.from(e.target.files);
    const allowedTypes = [
      "image/webp",
      "image/avif",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    const validFiles = fileList.filter((file) =>
      allowedTypes.includes(file.type)
    );

    if (validFiles.length !== fileList.length) {
      alert("❌ Hanya file gambar .webp, .avif, .jpg, .jpeg, dan .png!");
      return;
    }

    if (images.length + validFiles.length > 5) {
      alert("❌ Maksimal upload 5 gambar!");
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
      for (const img of images) {
        formData.append("images", img);
      }

      await axios.post("http://localhost:5005/api/products/add", formData);
      alert("✅ Produk berhasil ditambahkan!");

      // Reset form
      setForm({ title: "", sku: "", description: "", qty: 1 });
      setImages([]);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal tambah produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-md shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">🧩 Tambah Produk</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Nama Produk"
          required
        />
        <input
          name="sku"
          value={form.sku}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="SKU"
        />
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Deskripsi"
        />
        <input
          name="qty"
          type="number"
          min="1"
          value={form.qty}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Jumlah Stok"
        />

        {/* Tombol Tambah Gambar */}
        {images.length < 5 && (
          <label className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded cursor-pointer">
            ➕ Tambah Gambar
            <input
              type="file"
              accept="image/webp,image/avif,image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}

        {/* Preview Gambar */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${index}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Mengunggah..." : "Upload Produk"}
        </button>
      </form>
    </div>
  );
}
