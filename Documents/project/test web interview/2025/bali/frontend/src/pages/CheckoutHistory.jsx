import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CheckoutHistory() {
  const { id } = useParams();
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:5005/api/checkout/${id}`)
      .then((res) => {
        setCheckout(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal ambil data checkout:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center text-gray-600">
        ⏳ Memuat data pesanan...
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center text-red-500">
        ❌ Checkout tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📄 Detail Pesanan
      </h2>

      <p className="text-sm text-gray-600 mb-2">
        <strong>Email:</strong> {checkout.email}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        <strong>ID Pesanan:</strong> <code>{checkout._id}</code>
      </p>

      <ul className="space-y-4">
        {checkout.cart.map((item, i) => (
          <li
            key={i}
            className="p-4 bg-gray-50 border rounded-md shadow-sm flex justify-between"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-600">Qty: {item.qty}</p>
            </div>
            <p className="text-right text-gray-800 font-bold">
              Rp{item.price.toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
