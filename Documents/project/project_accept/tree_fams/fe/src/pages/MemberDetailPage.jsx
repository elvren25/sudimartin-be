import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Edit2, Trash2, Heart, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AddMemberForm from "../components/AddMemberForm";
import { getApiUrl, getFetchOptions } from "../config/api";

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [familyId, setFamilyId] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [relationshipMode, setRelationshipMode] = useState(null); // 'pasangan' or 'anak'
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchMember();
  }, [id, token]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError("");

      // Get member from any family (search all families)
      const familiesRes = await fetch(getApiUrl("/families"), {
        ...getFetchOptions(token),
      });

      if (!familiesRes.ok) throw new Error("Gagal mengambil data keluarga");

      const familiesData = await familiesRes.json();
      const families = familiesData.data || [];

      // Search member in all families
      for (const family of families) {
        const membersRes = await fetch(
          getApiUrl(`/families/${family.id}/members`),
          {
            ...getFetchOptions(token),
          }
        );

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const foundMember = membersData.data?.find((m) => m.id == id);
          if (foundMember) {
            setMember(foundMember);
            setFamilyId(family.id);
            setAllMembers(membersData.data || []);
            return;
          }
        }
      }

      setError("Member tidak ditemukan");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ChevronLeft size={20} />
          Kembali
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          {error || "Member tidak ditemukan"}
        </div>
      </div>
    );
  }

  const getGenderIcon = (gender) => {
    if (!gender) return null;
    return gender.toLowerCase() === "m" ||
      gender.toLowerCase() === "pria" ||
      gender.toLowerCase() === "laki-laki"
      ? "♂"
      : "♀";
  };

  // Get spouse info - simplified logic
  const getSpouse = () => {
    // First check if member's status_menikah is "Menikah"
    if (!member.status_menikah || member.status_menikah !== "Menikah") {
      return null;
    }

    // Find spouse in same generation
    const spouse = allMembers.find(
      (m) =>
        m.id !== member.id &&
        m.generation === member.generation &&
        m.status_menikah === "Menikah"
    );

    return spouse || null;
  };

  // Get parents
  const getParents = () => {
    const parentGen = member.generation - 1;
    return allMembers.filter(
      (m) => m.generation === parentGen && m.hubungan_keluarga === "Orang Tua"
    );
  };

  // Get children
  const getChildren = () => {
    const childGen = member.generation + 1;
    return allMembers.filter((m) => m.generation === childGen);
  };

  // Handle add spouse
  const handleAddSpouse = () => {
    setRelationshipMode("pasangan");
    setShowAddMember(true);
    // Store current member in sessionStorage for AddMemberForm
    sessionStorage.setItem(
      "addRelationTo",
      JSON.stringify({
        parentId: member.id,
        type: "pasangan",
        generation: member.generation,
      })
    );
  };

  // Handle add child
  const handleAddChild = () => {
    setRelationshipMode("anak");
    setShowAddMember(true);
    sessionStorage.removeItem("addRelationTo");
  };

  // Handle edit member
  const handleEditMember = () => {
    setIsEditMode(true);
    setShowAddMember(true);
    setRelationshipMode(null);
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
      return;
    }

    try {
      const response = await fetch(
        getApiUrl(`/families/${familyId}/members/${member.id}`),
        {
          method: "DELETE",
          ...getFetchOptions(token),
        }
      );

      if (!response.ok) throw new Error("Gagal menghapus anggota");

      alert("Anggota berhasil dihapus");
      navigate(-1);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowAddMember(false);
    setRelationshipMode(null);
    setIsEditMode(false);
    sessionStorage.removeItem("addRelationTo");
    // Refresh member data
    fetchMember();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Show AddMemberForm modal if needed */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <AddMemberForm
              familyId={familyId}
              editingMember={isEditMode ? member : null}
              onClose={handleCloseForm}
              onMemberAdded={handleCloseForm}
              parentForChild={relationshipMode === "anak" ? member : null}
            />
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ChevronLeft size={20} />
        Kembali
      </button>

      {/* Main Content */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 ${
          member.status === "Meninggal" ? "grayscale opacity-85" : ""
        }`}
      >
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div
            className={`rounded-xl shadow-lg p-6 ${
              member.status === "Meninggal"
                ? "bg-gray-100 border-2 border-gray-300"
                : "bg-white"
            }`}
          >
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.nama_depan}
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-300 shadow-md"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center shadow-md text-6xl text-white border-4 border-blue-300">
                  {getGenderIcon(member.gender)}
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
              {member.nama_depan}
              {member.nama_belakang && ` ${member.nama_belakang}`}
            </h1>

            {/* Status Badges */}
            <div className="flex justify-center gap-2 mt-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  member.status === "Meninggal"
                    ? "bg-gray-200 text-gray-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {member.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                Gen {member.generation + 1}
              </span>
            </div>

            {/* Quick Info */}
            <div className="mt-6 space-y-3 text-sm border-t pt-4">
              {member.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-semibold">
                    {getGenderIcon(member.gender)} {member.gender}
                  </span>
                </div>
              )}
              {member.status_menikah && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status Pernikahan:</span>
                  <span className="font-semibold">{member.status_menikah}</span>
                </div>
              )}
              {member.pekerjaan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pekerjaan:</span>
                  <span className="font-semibold">{member.pekerjaan}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleEditMember}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Edit2 size={18} />
                Edit
              </button>
              <button
                onClick={handleDeleteMember}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={18} />
                Hapus
              </button>
              <button
                onClick={handleAddSpouse}
                className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Heart size={18} />
                {getSpouse() ? "Lihat Pasangan" : "Tambah Pasangan"}
              </button>
              <button
                onClick={handleAddChild}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus size={18} />
                Tambah Anak
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <div
            className={`rounded-xl shadow-lg p-6 md:p-8 ${
              member.status === "Meninggal"
                ? "bg-gray-100 border-2 border-gray-300"
                : "bg-white"
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Informasi Lengkap
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Nama Lengkap
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {member.nama_depan}
                  {member.nama_belakang && ` ${member.nama_belakang}`}
                </p>
              </div>

              {/* Nama Sapaan */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Nama Sapaan
                </label>
                <p className="text-lg text-gray-800 font-semibold">
                  {member.nama_sapaan || "-"}
                </p>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Tanggal Lahir
                </label>
                <p className="text-lg text-gray-800">
                  {member.tanggal_lahir
                    ? new Date(member.tanggal_lahir).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "-"}
                </p>
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Tempat Lahir
                </label>
                <p className="text-lg text-gray-800">
                  {member.tempat_lahir || "-"}
                </p>
              </div>

              {/* Status Hidup */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Status Hidup
                </label>
                <p
                  className={`text-lg font-semibold ${
                    member.status === "Meninggal"
                      ? "text-gray-500"
                      : "text-green-600"
                  }`}
                >
                  {member.status}
                </p>
              </div>

              {/* Tanggal Wafat */}
              {member.status === "Meninggal" && member.tanggal_wafat && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    Tanggal Wafat
                  </label>
                  <p className="text-lg text-gray-800">
                    {new Date(member.tanggal_wafat).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              {/* Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Pekerjaan
                </label>
                <p className="text-lg text-gray-800">
                  {member.pekerjaan || "-"}
                </p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Gender
                </label>
                <p className="text-lg text-gray-800">
                  {getGenderIcon(member.gender)} {member.gender || "-"}
                </p>
              </div>

              {/* Status Pernikahan */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Status Pernikahan
                </label>
                <p className="text-lg text-gray-800">
                  {member.status_menikah || "-"}
                </p>
              </div>

              {/* Hubungan Keluarga */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Hubungan Keluarga
                </label>
                <p className="text-lg text-gray-800">
                  {member.hubungan_keluarga || "-"}
                </p>
              </div>

              {/* Generasi */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                  Generasi
                </label>
                <p className="text-lg text-gray-800">
                  Generasi {member.generation + 1}
                </p>
              </div>
            </div>

            {/* Relationship Section */}
            <div className="mt-8 pt-8 border-t">
              {/* Pasangan Section */}
              {getSpouse() && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    💒 Pasangan
                  </h3>
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <button
                      onClick={() => navigate(`/member/${getSpouse().id}`)}
                      className="w-full text-left hover:opacity-75 transition"
                    >
                      <div className="flex items-center gap-4">
                        {getSpouse().photo_url ? (
                          <img
                            src={getSpouse().photo_url}
                            alt={getSpouse().nama_depan}
                            className="w-16 h-16 rounded-full object-cover border-2 border-pink-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center text-2xl text-white border-2 border-pink-300">
                            {getGenderIcon(getSpouse().gender)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800">
                            {getSpouse().nama_depan}
                            {getSpouse().nama_belakang &&
                              ` ${getSpouse().nama_belakang}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getGenderIcon(getSpouse().gender)}{" "}
                            {getSpouse().gender}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Orang Tua (Parents) Section */}
              {getParents().length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    👨‍👩‍👧 Anak dari
                  </h3>
                  <div className="space-y-3">
                    {getParents().map((parent) => (
                      <button
                        key={parent.id}
                        onClick={() => navigate(`/member/${parent.id}`)}
                        className="w-full text-left hover:opacity-75 transition"
                      >
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-4">
                          {parent.photo_url ? (
                            <img
                              src={parent.photo_url}
                              alt={parent.nama_depan}
                              className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-2xl text-white border-2 border-blue-300">
                              {getGenderIcon(parent.gender)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800">
                              {parent.nama_depan}
                              {parent.nama_belakang &&
                                ` ${parent.nama_belakang}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getGenderIcon(parent.gender)} {parent.gender}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Anak (Children) Section */}
              {getChildren().length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    👶 Anak ({getChildren().length})
                  </h3>
                  <div className="space-y-3">
                    {getChildren().map((child) => (
                      <button
                        key={child.id}
                        onClick={() => navigate(`/member/${child.id}`)}
                        className="w-full text-left hover:opacity-75 transition"
                      >
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center gap-4">
                          {child.photo_url ? (
                            <img
                              src={child.photo_url}
                              alt={child.nama_depan}
                              className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-2xl text-white border-2 border-green-300">
                              {getGenderIcon(child.gender)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800">
                              {child.nama_depan}
                              {child.nama_belakang && ` ${child.nama_belakang}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getGenderIcon(child.gender)} {child.gender}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
