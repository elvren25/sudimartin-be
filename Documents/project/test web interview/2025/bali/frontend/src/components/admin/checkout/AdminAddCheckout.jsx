import { useState } from "react";
import axios from "axios";

export default function AdminAddCheckout({ setActiveTab }) {
  const [email, setEmail] = useState("");
  const [cartItem, setCartItem] = useState({
    productId: "",
    title: "",
    qty: 1,
    price: 0,
  });

  const handleCartChange = (e) => {
    const { name, value } = e.target;
    setCartItem({
      ...cartItem,
      [name]: name === "qty" || name === "price" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newCheckout = {
        email,
        cart: [cartItem], // array sesuai format backend
      };
      await axios.post("http://localhost:5005/api/checkout", newCheckout);
      alert("✅ Checkout berhasil ditambahkan!");
      setEmail("");
      setCartItem({
        productId: "",
        title: "",
        qty: 1,
        price: 0,
      });
      setActiveTab("checkoutList");
    } catch (err) {
      alert("❌ Gagal menambahkan checkout");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">🧾 Tambah Checkout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          className="w-full p-2 border"
          placeholder="Email"
        />
        <input
          name="productId"
          onChange={handleCartChange}
          value={cartItem.productId}
          className="w-full p-2 border"
          placeholder="Product ID"
        />
        <input
          name="title"
          onChange={handleCartChange}
          value={cartItem.title}
          className="w-full p-2 border"
          placeholder="Nama Produk"
        />
        <input
          name="qty"
          type="number"
          onChange={handleCartChange}
          value={cartItem.qty}
          className="w-full p-2 border"
          placeholder="Qty"
        />
        <input
          name="price"
          type="number"
          onChange={handleCartChange}
          value={cartItem.price}
          className="w-full p-2 border"
          placeholder="Harga"
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Simpan Checkout
        </button>
      </form>
    </div>
  );
}
