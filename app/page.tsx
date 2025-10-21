"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "./components/context/userContext";
import { ChevronDown } from "lucide-react";
import Navbar from "./components/Navbar";

export default function Home() {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="font-sans min-h-screen flex flex-col">
      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-6">Moooovies 🎬</h1>
        {user && (
          <p className="text-lg text-gray-700">
            Welcome back, <span className="font-semibold">{user.name}</span>!
          </p>
        )}
      </main>
    </div>
    </>
  );
}
