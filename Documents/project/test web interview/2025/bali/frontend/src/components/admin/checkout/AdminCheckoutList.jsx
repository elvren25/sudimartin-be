import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminCheckoutList({ setActiveTab }) {
  const [checkouts, setCheckouts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const fetchCheckouts = async () => {
    const res = await axios.get("http://localhost:5005/api/checkout");
    setCheckouts(res.data.reverse()); // supaya terbaru di atas
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus checkout ini?")) {
      await axios.delete(`http://localhost:5005/api/checkout/${id}`);
      fetchCheckouts();
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, []);

  // Hitung pagination
  const totalPages = Math.ceil(checkouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = checkouts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-4 sm:p-6 shadow rounded">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">📋 Daftar Checkout</h2>

      {checkouts.length === 0 ? (
        <p className="text-gray-600">Tidak ada data.</p>
      ) : (
        <>
          <div className="space-y-6">
            {currentItems.map((c) => (
              <div
                key={c._id}
                className="border p-4 rounded shadow text-sm sm:text-base"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-bold break-all">{c.email}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => navigate(`/checkout/edit/${c._id}`)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
                <ul className="pl-4 list-disc text-xs sm:text-sm">
                  {c.cart.map((item, idx) => (
                    <li key={idx}>
                      {item.title} - {item.qty}x Rp
                      {item.price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 text-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
        </>
      )}
    </div>
  );
}
