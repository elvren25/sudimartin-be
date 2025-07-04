import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Checkout() {
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});

  useEffect(() => {
    axios.get("http://localhost:5005/api/products").then((res) => {
      setProducts(res.data);
    });

    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(savedCart);
  }, []);

  const handleInputChange = (index, field, value) => {
    const updatedCart = [...cart];
    if (field === "qty") {
      updatedCart[index].qty = Number(value);
    }
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleRemoveItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      alert("⚠️ Anda harus login terlebih dahulu untuk checkout.");
      setShowAuthForm(true);
      return;
    }

    if (!email || cart.length === 0) {
      alert("Mohon lengkapi data checkout.");
      return;
    }

    setLoading(true);

    const enrichedCart = cart.map((item) => {
      const product = products.find((p) => p._id === item.productId);
      return {
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        title: product?.title || "Produk",
      };
    });

    try {
      const res = await axios.post("http://localhost:5005/api/checkout", {
        email,
        cart: enrichedCart,
      });

      alert("✅ Checkout sukses & email terkirim!");
      setOrderId(res.data.checkout._id);
      setCart([]);
      localStorage.removeItem("cart");
    } catch (error) {
      alert("❌ Gagal checkout. Pastikan data produk lengkap.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      const url = `http://localhost:5005/api/auth/${authMode}`;
      await axios.post(url, {
        email: authEmail,
        password: authPassword,
      });

      setIsAuthenticated(true);
      setEmail(authEmail);
      setShowAuthForm(false);
      alert(`✅ ${authMode} sukses! Silakan lanjutkan checkout.`);
    } catch {
      alert("❌ Gagal login/register");
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-[100px] p-4 md:p-6 bg-white rounded shadow-lg">
      {!orderId && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            🛒 Checkout
          </h2>

          {cart.map((item, index) => {
            const product = products.find((p) => p._id === item.productId);
            const imageUrls =
              product?.images?.map((img) => `http://localhost:5005/${img}`) ||
              [];
            const selectedIndex = selectedImages[item.productId] || 0;

            return (
              <div
                key={index}
                className="bg-white shadow-sm rounded-lg border p-4 mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  <div className="md:col-span-1">
                    <img
                      src={imageUrls[selectedIndex]}
                      alt="produk"
                      className="rounded-md border w-24 h-24 object-cover mb-2"
                    />
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {imageUrls.map((src, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={src}
                          onClick={() =>
                            setSelectedImages((prev) => ({
                              ...prev,
                              [item.productId]: imgIndex,
                            }))
                          }
                          className={`w-10 h-10 rounded object-cover border cursor-pointer ${
                            imgIndex === selectedIndex
                              ? "border-green-600 ring-2 ring-green-400"
                              : "border-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">
                        {item.title || product?.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {product?.description || "Tidak ada deskripsi"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Harga
                        </label>
                        <div className="font-semibold text-green-600">
                          Rp {item.price}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="w-20 border rounded px-2 py-1"
                          value={item.qty}
                          onChange={(e) =>
                            handleInputChange(index, "qty", e.target.value)
                          }
                        />
                      </div>

                      <div className="ml-auto">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-sm text-red-500 hover:text-red-600 hover:underline"
                        >
                          ❌ Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleCheckout}
            className={`mt-4 w-full text-white py-3 rounded-xl font-semibold transition duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-md"
            }`}
            disabled={loading}
          >
            {loading ? "⏳ Memproses Checkout..." : "🛒 Checkout Sekarang"}
          </button>

          {loading && (
            <p className="text-center text-sm text-gray-600 mt-3">
              ⏳ Sedang memproses pesanan dan mengirim email...
            </p>
          )}
        </>
      )}

      {orderId && (
        <div className="mt-6 p-4 border border-green-300 bg-green-50 rounded text-center">
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            ✅ Pesanan Anda telah diterima!
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            ID Pesanan: <code className="font-mono">{orderId}</code>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/checkout-history/${orderId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📄 Lihat Riwayat
            </a>
            <a
              href="/"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      )}

      {showAuthForm && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-700 text-center">
              {authMode === "login" ? "🔐 Masuk" : "📝 Daftar"} ke Akun Anda
            </h3>

            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />

            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />

            <button
              onClick={handleAuth}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
            >
              {authMode === "login" ? "Masuk" : "Daftar"}
            </button>

            <p className="text-sm mt-3 text-center">
              {authMode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
                className="text-green-600 hover:underline font-medium"
              >
                {authMode === "login" ? "Daftar" : "Masuk"}
              </button>
            </p>

            {/* Optional: Tombol Tutup */}
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black"
            >
              ✖
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
