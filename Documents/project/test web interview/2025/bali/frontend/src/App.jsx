import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/register";
import Products from "./pages/Products";
import AddProduct from "./components/admin/product/AddProduct";
import Checkout from "./pages/Checkout";
import CheckoutHistory from "./pages/CheckoutHistory";

import AdminDashboard from "./components/admin/adminDashboard";
import AdminEditUser from "./components/admin/user/AdminEditUser";
import EditProduct from "./components/admin/product/EditProduct";
import EditCheckout from "./components/admin/Checkout/EditCheckout";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* 👤 User Akses */}
        <Route path="/" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout-history/:id" element={<CheckoutHistory />} />

        {/* 🛠 Admin Akses */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user/edit/:id" element={<AdminEditUser />} />
        <Route path="/product/edit/:id" element={<EditProduct />} />
        <Route path="/checkout/edit/:id" element={<EditCheckout />} />

        {/* ✅ Tambahkan fallback route jika masih ada yang pakai /edit/:id */}
        <Route path="/edit/:id" element={<EditProduct />} />
      </Routes>
    </BrowserRouter>
  );
}
