// Login.jsx
import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await axios.post("http://localhost:5005/api/auth/login", {
        email,
        password,
      });
      alert("✅ Login berhasil!");
    } catch {
      alert("❌ Gagal login.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">🔐 Login</h2>
      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 mb-2"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 mb-4"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} className="w-full bg-black text-white py-2">
        Login
      </button>
    </div>
  );
}
