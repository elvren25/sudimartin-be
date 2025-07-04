import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  // ✅ Ekstrak keyword kategori dari title
  const extractKeyword = (title) => title.toLowerCase().split(" ")[0];

  const uniqueCategories = [
    "all",
    ...new Set(products.map((p) => extractKeyword(p.title))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || extractKeyword(p.title) === category;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    axios.get("http://localhost:5005/api/products").then((res) => {
      setProducts(res.data);
    });

    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleAddToCart = (product) => {
    const existingIndex = cart.findIndex(
      (item) => item.productId === product._id
    );

    let updatedCart;
    if (existingIndex !== -1) {
      cart[existingIndex].qty += 1;
      updatedCart = [...cart];
    } else {
      const cartItem = {
        productId: product._id,
        title: product.title,
        qty: 1,
        price: product.price ?? 100000,
      };
      updatedCart = [...cart, cartItem];
    }

    saveCart(updatedCart);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleQtyChange = (index, delta) => {
    const updated = [...cart];
    updated[index].qty += delta;
    if (updated[index].qty <= 0) {
      updated.splice(index, 1);
    }
    saveCart(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="mt-20 relative max-w-7xl mx-auto p-4">
      {/* Notifikasi */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-3xl shadow-lg z-50"
          >
            ✅ Item berhasil ditambahkan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="🔍 Cari produk..."
          className="w-full sm:w-1/4 p-2 border rounded-3xl shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="appearance-none w-1/9 px-4 py-2 border border-gray-300 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {uniqueCategories.map((title, i) => (
            <option key={i} value={title}>
              {title === "all" ? "Semua Kategori" : title}
            </option>
          ))}
        </select>
      </div>

      {/* Cart Button */}
      <div className="fixed top-28 right-5 z-40">
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          🛒 <span>Keranjang</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </button>

        {/* Cart Dropdown */}
        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-lg p-4 z-50"
            >
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">Keranjang kosong</p>
              ) : (
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                  {cart.map((item, index) => (
                    <li key={index} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.qty} | Rp{item.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQtyChange(index, -1)}
                            className="px-2 bg-gray-200 rounded text-sm"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQtyChange(index, 1)}
                            className="px-2 bg-gray-200 rounded text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 text-sm"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {cart.length > 0 && (
                <button
                  onClick={() => navigate("/checkout")}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  🚀 Lanjut Checkout
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
        Produk
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProducts.map((prod) => (
          <ProductCard
            key={prod._id}
            prod={prod}
            handleAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ prod, handleAddToCart }) {
  const images = prod.images || [];
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const handleNext = () => setSlideIndex((prev) => (prev + 1) % images.length);
  const handlePrev = () =>
    setSlideIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <motion.div
        className="bg-white rounded-xl shadow-md p-3 hover:shadow-xl transition text-sm"
        whileHover={{ scale: 1.03 }}
      >
        <div className="mb-2">
          {images.length > 0 ? (
            <img
              src={`http://localhost:5005/${images[mainImageIndex]}`}
              alt={prod.title}
              className="object-cover w-full h-32 sm:h-36 rounded-md"
            />
          ) : (
            <div className="bg-gray-100 w-full h-32 sm:h-36 rounded-md flex items-center justify-center text-gray-400">
              Tidak ada gambar
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1 mb-2 overflow-x-auto">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={`http://localhost:5005/${img}`}
                alt={`Thumb ${idx + 1}`}
                onClick={() => setMainImageIndex(idx)}
                className={`w-10 h-10 object-cover rounded cursor-pointer border ${
                  idx === mainImageIndex
                    ? "border-purple-500"
                    : "border-gray-300"
                }`}
              />
            ))}
          </div>
        )}
        <h3 className="font-semibold mt-2 truncate">{prod.title}</h3>
        <p className="text-xs text-gray-500 truncate">{prod.description}</p>
        <p className="text-xs text-gray-600">SKU: {prod.sku}</p>
        <p className="text-xs text-gray-600 mb-2">Stok: {prod.qty}</p>
        <button
          onClick={() => handleAddToCart(prod)}
          className="w-full bg-purple-600 text-white py-1.5 rounded hover:bg-purple-700 text-xs"
        >
          ➕ Tambah ke Keranjang
        </button>
        <button
          onClick={() => {
            setSlideIndex(0);
            setShowModal(true);
          }}
          className="w-full mt-2 bg-gray-200 text-gray-800 py-1.5 rounded hover:bg-gray-300 text-xs"
        >
          🔍 Lihat Detail
        </button>
      </motion.div>

      {/* Modal Detail */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)} // ❌ Close on background click
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg max-w-3xl w-full relative p-4"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} // ✅ Prevent closing when clicking inside modal
            >
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-xl font-bold"
                onClick={() => setShowModal(false)}
              >
                ❌
              </button>
              <div className="relative">
                <img
                  src={`http://localhost:5005/${images[slideIndex]}`}
                  alt={`Detail ${slideIndex}`}
                  className="w-full h-[400px] sm:h-[500px] object-contain rounded"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute top-1/2 left-2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-2 rounded-full shadow"
                    >
                      ⬅️
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute top-1/2 right-2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-black p-2 rounded-full shadow"
                    >
                      ➡️
                    </button>
                  </>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-lg font-bold">{prod.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{prod.description}</p>
                <p className="text-sm mt-2">SKU: {prod.sku}</p>
                <p className="text-sm">Stok: {prod.qty}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
