import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AdminEditUser() {
  const { id } = useParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    axios.get(`http://localhost:5005/api/auth/${id}`).then((res) => {
      const { email } = res.data;
      setForm({ email, password: "" }); // kosongkan password
    });
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToUpdate = {
        email: form.email,
      };

      // Kirim password hanya jika diisi
      if (form.password.trim() !== "") {
        dataToUpdate.password = form.password;
      }

      await axios.put(`http://localhost:5005/api/auth/${id}`, dataToUpdate);
      alert("✅ User berhasil diupdate!");
      window.location.href = "/admin"; // kembali ke dashboard admin
    } catch (err) {
      console.error(err);
      alert("❌ Gagal update user");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4">✏️ Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          onChange={handleChange}
          value={form.email}
          className="w-full p-2 border"
          placeholder="Email"
        />
        <input
          type="password"
          name="password"
          onChange={handleChange}
          value={form.password}
          className="w-full p-2 border"
          placeholder="Password (isi jika ingin diubah)"
        />
        <button
          type="submit"
          className="bg-green-600 w-full text-white p-2 rounded hover:bg-green-700"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
