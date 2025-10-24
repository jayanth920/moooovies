'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavbar() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard Home", href: "/admin-dashboard", key: "dashboard" },
    { name: "Movies Manager", href: "/admin-dashboard/movies", key: "movies" },
    { name: "Users Manager", href: "/admin-dashboard/users", key: "users" },
    { name: "Orders Manager", href: "/admin-dashboard/orders", key: "orders" },
    { name: "Coupons Manager", href: "/admin-dashboard/coupons", key: "coupons" },
  ];

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/admin-dashboard") return "dashboard";
    
    // Check if current pathname starts with any tab href
    const activeTab = tabs.find(tab => 
      tab.key !== "dashboard" && pathname.startsWith(tab.href)
    );
    
    return activeTab?.key || "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1 rounded hover:bg-gray-700 transition-colors ${
              activeTab === tab.key ? "bg-gray-700 font-semibold" : ""
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </div>

      <div>
        <Link
          href="/"
          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Shop as User
        </Link>
      </div>
    </header>
  );
}