import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5005/api/auth");
    setUsers(res.data);
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus user ini?")) {
      await axios.delete(`http://localhost:5005/api/auth/${id}`);
      fetchUsers();
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-4 sm:p-6 shadow rounded">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">📋 Daftar User</h2>

      {/* Table for desktop */}
      <div className="hidden sm:block">
        <table className="w-full border text-sm table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id}>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() =>
                      (window.location.href = `/user/edit/${user._id}`)
                    }
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    🗑️ Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* List view for mobile */}
      <div className="sm:hidden space-y-4">
        {currentUsers.map((user) => (
          <div
            key={user._id}
            className="border rounded p-4 shadow-sm text-sm bg-gray-50"
          >
            <p className="mb-2">
              <span className="font-semibold text-gray-700">Email:</span>{" "}
              {user.email}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  (window.location.href = `/user/edit/${user._id}`)
                }
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(user._id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}
