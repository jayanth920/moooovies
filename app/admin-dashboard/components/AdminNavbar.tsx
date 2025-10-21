"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminNavbar() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const tabs = [
    { name: "Dashboard Home", href: "/admin-dashboard", key: "dashboard" },
    { name: "Movies Manager", href: "/admin-dashboard/movies", key: "movies" },
    { name: "Users Manager", href: "/admin-dashboard/users", key: "users" },
    { name: "Orders Manager", href: "/admin-dashboard/orders", key: "orders" },
    { name: "Coupons Manager", href: "/admin-dashboard/coupons", key: "coupons" },
  ];

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1 rounded hover:bg-gray-700 ${
              activeTab === tab.key ? "bg-gray-700 font-semibold" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </Link>
        ))}
      </div>

      <div>
        <Link
          href="/"
          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
        >
          Shop as User
        </Link>
      </div>
    </header>
  );
}
