import { useState } from "react";
import axios from "axios";

export default function AdminAddUser() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5005/api/auth/register", form);
      alert("✅ User berhasil ditambahkan!");
      setForm({ username: "", email: "", password: "" });
    } catch (err) {
      alert("❌ Gagal menambahkan user.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4">👤 Tambah User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="username"
          onChange={handleChange}
          value={form.username}
          className="w-full p-2 border"
          placeholder="Username"
        />
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
          placeholder="Password"
        />
        <button className="bg-blue-600 w-full text-white p-2 rounded">
          Simpan
        </button>
      </form>
    </div>
  );
}
