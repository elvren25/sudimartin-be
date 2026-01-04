import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Eye, LogOut } from "lucide-react";
import CreateFamilyForm from "../components/CreateFamilyForm";
import { getApiUrl, getFetchOptions } from "../config/api";

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch families
  useEffect(() => {
    if (token) {
      fetchFamilies();
    }
  }, [token]);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(getApiUrl("/families"), {
        ...getFetchOptions(token),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch families");
      }

      setFamilies(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching families:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFamily = (familyId) => {
    navigate(`/family/${familyId}`);
  };

  const handleDeleteFamily = async (familyId) => {
    if (!window.confirm("Yakin ingin menghapus keluarga ini?")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/families/${familyId}`), {
        method: "DELETE",
        ...getFetchOptions(token),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete family");
      }

      setFamilies(families.filter((f) => f.id !== familyId));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting family:", err);
    }
  };

  const handleFamilyCreated = (newFamily) => {
    setFamilies([newFamily, ...families]);
    setShowCreateForm(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola semua keluarga (silsilah)
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Create Family Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={20} />
            Buat Keluarga Baru
          </button>
        </div>

        {/* Families Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat keluarga...</p>
          </div>
        ) : families.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 text-lg">
              Belum ada keluarga yang dibuat
            </p>
            <p className="text-gray-500 mt-2">
              Klik tombol "Buat Keluarga Baru" untuk memulai
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => (
              <div
                key={family.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* Family Photo/Header */}
                {family.photo_url ? (
                  <img
                    src={family.photo_url}
                    alt={family.nama_keluarga}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {family.nama_keluarga.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Family Info */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {family.nama_keluarga}
                  </h3>

                  {family.deskripsi && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {family.deskripsi}
                    </p>
                  )}

                  {/* Privacy Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      {family.privacy_type === "public" ? "Publik" : "Pribadi"}
                    </span>
                  </div>

                  {/* Member Count */}
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-semibold text-gray-700">
                      {family.member_count || 0}
                    </span>{" "}
                    anggota
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewFamily(family.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      <Eye size={16} />
                      Lihat
                    </button>
                    <button
                      onClick={() => handleDeleteFamily(family.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Family Modal */}
      {showCreateForm && (
        <CreateFamilyForm
          onClose={() => setShowCreateForm(false)}
          onFamilyCreated={handleFamilyCreated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
