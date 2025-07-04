import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5005/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("❌ Gagal mengambil produk:", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus produk ini?")) {
      try {
        await axios.delete(`http://localhost:5005/api/products/${id}`);
        fetchProducts(); // refresh setelah hapus
      } catch (err) {
        alert("❌ Gagal menghapus produk.");
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-10 bg-white shadow rounded">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">📦 Daftar Produk</h2>

      {/* ✅ Desktop Table */}
      <div className="hidden sm:block">
        <table className="w-full table-auto border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Gambar</th>
              <th className="p-2 border text-left">Nama Produk</th>
              <th className="p-2 border text-left">SKU</th>
              <th className="p-2 border text-center">Qty</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((p) => (
              <tr key={p._id}>
                <td className="border p-2">
                  <div className="flex items-center flex-wrap gap-1">
                    {(p.images || []).slice(0, 5).map((img, i) => (
                      <img
                        key={i}
                        src={`http://localhost:5005/${img}`}
                        alt={`img-${i}`}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    ))}
                    {p.images?.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({p.images.length} gambar)
                      </span>
                    )}
                  </div>
                </td>
                <td className="border p-2">{p.title}</td>
                <td className="border p-2">{p.sku || "-"}</td>
                <td className="border p-2 text-center">{p.qty}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => navigate(`/product/edit/${p._id}`)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    🗑️ Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {currentProducts.map((p) => (
          <div key={p._id} className="border rounded p-4 shadow text-sm">
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.images || []).slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={`http://localhost:5005/${img}`}
                  alt={`img-${i}`}
                  className="h-16 w-16 object-cover rounded border"
                />
              ))}
            </div>
            <p>
              <span className="font-semibold">Nama:</span> {p.title}
            </p>
            <p>
              <span className="font-semibold">SKU:</span> {p.sku || "-"}
            </p>
            <p>
              <span className="font-semibold">Qty:</span> {p.qty}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => navigate(`/product/edit/${p._id}`)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(p._id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            ⬅️ Sebelumnya
          </button>

          <p className="text-gray-700">
            Halaman {currentPage} dari {totalPages}
          </p>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Berikutnya ➡️
          </button>
        </div>
      )}
    </div>
  );
}
