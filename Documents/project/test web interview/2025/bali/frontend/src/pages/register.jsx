import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:5005/api/auth/register", {
        email,
        password,
      });
      alert("Registration successful");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Register</h2>
      <input
        className="border p-2 mb-2 block w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 mb-2 block w-full"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
      />
      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2"
      >
        Register
      </button>
    </div>
  );
}
