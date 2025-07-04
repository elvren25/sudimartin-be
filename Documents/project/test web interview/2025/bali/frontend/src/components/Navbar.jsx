import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on window resize (optional UX improvement)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="bg-blue-600 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold tracking-tight hover:text-purple-400 transition"
        >
          🛍️ Goeshop
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white lg:hidden focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-8 text-sm font-medium">
          <Link
            to="/"
            className="hover:text-purple-400 transition duration-200"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="hover:text-purple-400 transition duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hover:text-purple-400 transition duration-200"
          >
            Register
          </Link>
          <Link
            to="/checkout"
            className="hover:text-purple-400 transition duration-200"
          >
            🛒 Checkout
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden px-4 pb-4 space-y-2 bg-black border-t border-gray-700">
          <Link
            to="/"
            className="block text-sm hover:text-purple-400 transition"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/login"
            className="block text-sm hover:text-purple-400 transition"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block text-sm hover:text-purple-400 transition"
            onClick={() => setIsOpen(false)}
          >
            Register
          </Link>
          <Link
            to="/checkout"
            className="block text-sm hover:text-purple-400 transition"
            onClick={() => setIsOpen(false)}
          >
            🛒 Checkout
          </Link>
        </div>
      )}
    </nav>
  );
}
