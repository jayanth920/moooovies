"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "./context/userContext";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) return null; // prevent flicker while loading

  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      {/* Left side links */}
      <div className="flex space-x-6">
        <button onClick={() => router.push("/")} className="hover:text-blue-400">
          Home
        </button>
        <button onClick={() => router.push("/movies")} className="hover:text-blue-400">
          Movies
        </button>
        <button onClick={() => router.push("/cart")} className="hover:text-blue-400">
          Cart
        </button>
        <button onClick={() => router.push("/orders")} className="hover:text-blue-400">
          Orders
        </button>
      </div>

      {/* Right side - Profile or Login */}
      {user ? (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <span>Profile</span>
            <ChevronDown size={16} className="ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border text-gray-800">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/profile");
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                View / Edit Profile
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          LOGIN
        </button>
      )}
    </nav>
  );
}
