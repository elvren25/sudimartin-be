import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import AddMemberForm from "../components/AddMemberForm";
import ProFamilyTreeVisualization from "../components/ProFamilyTreeVisualization";
import { ChevronLeft, Plus } from "lucide-react";
import { getApiUrl, getFetchOptions } from "../config/api";

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { familyId } = useParams();
  const { user, token } = useAuth();
  const { setCurrentFamily } = useWorkspace();

  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [parentForChild, setParentForChild] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch family and members on mount
  useEffect(() => {
    if (familyId && token) {
      fetchFamilyData();
    }
  }, [familyId, token]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch family details
      const familyRes = await fetch(getApiUrl(`/families/${familyId}`), {
        ...getFetchOptions(token),
      });

      if (!familyRes.ok) {
        throw new Error("Failed to fetch family");
      }

      const familyData = await familyRes.json();
      setFamily(familyData.data);
      setCurrentFamily(familyData.data);

      // Fetch family members
      const membersRes = await fetch(
        getApiUrl(`/families/${familyId}/members`),
        {
          ...getFetchOptions(token),
        }
      );

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching family data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = () => {
    fetchFamilyData(); // Refresh data after adding member
    setShowAddMember(false);
    setEditingMember(null);
    setParentForChild(null);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setShowAddMember(true);
  };

  const handleDelete = async (member) => {
    setDeleteConfirm(member.id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(
        getApiUrl(`/families/${familyId}/members/${deleteConfirm}`),
        {
          method: "DELETE",
          ...getFetchOptions(token),
        }
      );

      if (res.ok) {
        handleMemberAdded(); // Refresh data
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Gagal menghapus anggota");
    }
  };

  const handleAddChild = (parentMember) => {
    // Determine if adding spouse or child based on status
    const isAddingSpouse = parentMember.status_menikah !== "Menikah";

    if (isAddingSpouse) {
      // Add Pasangan - set relationship and marriage status
      setParentForChild(null);
      setEditingMember(null);
      // We'll pass a special flag to AddMemberForm
      setShowAddMember(true);
      // Store parent info in state for AddMemberForm to use
      sessionStorage.setItem(
        "addRelationTo",
        JSON.stringify({
          parentId: parentMember.id,
          type: "pasangan",
          generation: parentMember.generation,
        })
      );
    } else {
      // Add Anak - set parent and relationship
      setParentForChild(parentMember);
      setEditingMember(null);
      setShowAddMember(true);
      sessionStorage.removeItem("addRelationTo");
    }
  };

  const handleBack = () => {
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || "Keluarga tidak ditemukan"}</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
          >
            <ChevronLeft size={20} />
            Kembali
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {family.nama_keluarga}
            </h1>
            {family.deskripsi && (
              <p className="text-gray-600 mt-1">{family.deskripsi}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Plus size={20} />
          Tambah Anggota
        </button>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              Belum ada anggota keluarga
            </p>
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tambah Anggota Pertama
            </button>
          </div>
        ) : (
          <ProFamilyTreeVisualization
            members={members}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onAddSpouse={handleAddChild}
          />
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {showAddMember && (
        <AddMemberForm
          familyId={familyId}
          editingMember={editingMember}
          parentForChild={parentForChild}
          onClose={() => {
            setShowAddMember(false);
            setEditingMember(null);
            setParentForChild(null);
          }}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Hapus Anggota Keluarga?
            </h3>
            <p className="text-gray-600 mb-6">
              Tindakan ini tidak dapat dibatalkan. Anggota dan semua data
              terkait akan dihapus.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;
