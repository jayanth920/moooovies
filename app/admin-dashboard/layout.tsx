"use client";

import { useUser } from "@/app/components/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminNavbar from "./components/AdminNavbar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // wait until context finishes loading
        if (!user) return;   // wait for user data to load

        if (user.role !== "admin") {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) return <p className="p-8 text-center">Loading...</p>;
    if (user && user.role !== "admin") return <p className="p-8 text-center">Redirecting...</p>;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Admin Navbar */}
            <AdminNavbar />

            {/* Admin content */}
            <main className="flex-1 p-8 bg-gray-50">{children}</main>
        </div>
    );
}
