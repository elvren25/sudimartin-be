import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);

  useEffect(() => {
    const fetchCheckout = async () => {
      const res = await axios.get(`http://localhost:5005/api/checkout/${id}`);
      setCheckout(res.data);
    };
    fetchCheckout();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:5005/api/checkout/${id}`, checkout);
    alert("✅ Berhasil update checkout!");
    navigate("/admin");
  };

  if (!checkout) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-bold mb-4">✏️ Edit Checkout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label>Email</label>
        <input
          value={checkout.email}
          onChange={(e) => setCheckout({ ...checkout, email: e.target.value })}
          className="border p-2 w-full"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          💾 Simpan
        </button>
      </form>
    </div>
  );
}
