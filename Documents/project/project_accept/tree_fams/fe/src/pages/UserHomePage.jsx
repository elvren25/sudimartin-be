import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, Home } from "lucide-react";
import { getApiUrl, getFetchOptions } from "../config/api";

const UserHomePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch public families
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
        throw new Error(data.message || "Gagal mengambil data keluarga");
      }

      // Filter public families
      const publicFamilies = (data.data || []).filter(
        (f) => f.privacy_type === "public" || f.privacy_type === "PUBLIC"
      );
      setFamilies(publicFamilies);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching families:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFamily = (familyId) => {
    navigate(`/family-view/${familyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Home size={32} />
            <h1 className="text-4xl font-bold">Silsilah Keluarga</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Jelajahi silsilah keluarga yang tersedia untuk dilihat
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Memuat data keluarga...</p>
          </div>
        ) : families.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🌳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Belum Ada Keluarga Publik
            </h2>
            <p className="text-gray-600">
              Saat ini tidak ada silsilah keluarga yang tersedia untuk dilihat.
              Silakan cek kembali nanti.
            </p>
          </div>
        ) : (
          /* Families Grid */
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Keluarga Tersedia
              </h2>
              <p className="text-gray-600">
                Total {families.length} silsilah keluarga
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {families.map((family) => (
                <div
                  key={family.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  {/* Family Header/Photo */}
                  {family.photo_url ? (
                    <img
                      src={family.photo_url}
                      alt={family.nama_keluarga}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">
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
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        🌍 Publik
                      </span>
                    </div>

                    {/* Member Count */}
                    <div className="text-sm text-gray-500 mb-4">
                      <span className="font-semibold text-gray-700">
                        {family.member_count || 0}
                      </span>{" "}
                      anggota
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => handleViewFamily(family.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                    >
                      <Eye size={16} />
                      Lihat Tree
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserHomePage;
