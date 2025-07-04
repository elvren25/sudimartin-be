import { useState } from "react";
import AddProduct from "./product/AddProduct";
import ProductList from "./product/ProductList";
import AdminCheckoutList from "./checkout/AdminCheckoutList";
import AdminUserList from "./user/AdminUserList";
import AdminAddUser from "./user/AdminAddUser";

import { Menu, X } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("productList");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-gray-100">
      {/* Mobile Navbar */}
      <div className="sm:hidden flex justify-between items-center bg-blue-900 text-white p-4 shadow fixed w-full top-0 z-50">
        <h1 className="text-lg font-bold">📊 Admin Panel</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 transition-transform duration-300
          fixed sm:static top-16 sm:top-0 left-0 z-40
          w-64 bg-blue-900 text-white sm:min-h-screen p-6 shadow-lg
        `}
      >
        <h1 className="mt-10 text-2xl font-bold mb-8 hidden sm:block">
          📊 Admin Panel
        </h1>
        <nav className="flex flex-col space-y-2">
          <button
            onClick={() => {
              setActiveTab("productList");
              setSidebarOpen(false);
            }}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "productList" ? "bg-blue-700" : "hover:bg-blue-800"
            }`}
          >
            📦 Daftar Produk
          </button>
          <button
            onClick={() => {
              setActiveTab("addProduct");
              setSidebarOpen(false);
            }}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "addProduct" ? "bg-blue-700" : "hover:bg-blue-800"
            }`}
          >
            ➕ Tambah Produk
          </button>

          <hr className="my-2 border-blue-600" />

          <button
            onClick={() => {
              setActiveTab("checkoutList");
              setSidebarOpen(false);
            }}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "checkoutList" ? "bg-blue-700" : "hover:bg-blue-800"
            }`}
          >
            📋 Daftar Checkout
          </button>

          <hr className="my-2 border-blue-600" />

          <button
            onClick={() => {
              setActiveTab("userList");
              setSidebarOpen(false);
            }}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "userList" ? "bg-blue-700" : "hover:bg-blue-800"
            }`}
          >
            👥 Daftar User
          </button>
          <button
            onClick={() => {
              setActiveTab("addUser");
              setSidebarOpen(false);
            }}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "addUser" ? "bg-blue-700" : "hover:bg-blue-800"
            }`}
          >
            ➕ Tambah User
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mt-20 sm:mt-0 p-4 sm:p-8">
        {activeTab === "productList" && <ProductList />}
        {activeTab === "addProduct" && <AddProduct />}
        {activeTab === "checkoutList" && <AdminCheckoutList />}
        {activeTab === "userList" && <AdminUserList />}
        {activeTab === "addUser" && <AdminAddUser />}
      </main>
    </div>
  );
}
