"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit3, Plus, Eye, EyeOff, Calendar, RefreshCw, BarChart3 } from "lucide-react";
import { useUser } from "@/app/components/context/userContext";
import CouponsStatsCharts from "../components/CouponsStatsCharts";

interface Coupon {
    _id: string;
    code: string;
    price: number;
    isPercentage: boolean;
    minQuantity: number;
    minSubtotal: number;
    minOrderCount: number;
    maxOrderCount: number | null;
    specificOrderCount: number | null;
    description: string;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AdminCouponsPage() {
    const router = useRouter();
    const { token } = useUser();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [filtered, setFiltered] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showStats, setShowStats] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin-coupons-showStats');
            return saved ? JSON.parse(saved) : true;
        }
        return true;
    });
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const fetchCoupons = async () => {
        try {
            const queryParams = new URLSearchParams({
                search,
                status: statusFilter,
                type: typeFilter,
                sortBy,
                sortOrder
            });

            const res = await fetch(`/api/admin/coupons?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();


            if (data.success) {
                setCoupons(data.coupons || []);
                setFiltered(data.coupons || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [statusFilter, typeFilter, sortBy, sortOrder]);

    useEffect(() => {
        let temp = [...coupons];
        if (search.trim()) {
            temp = temp.filter((c) =>
                c.code.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFiltered(temp);
    }, [search, coupons]);

    const deleteCoupon = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();

            if (data.success) {
                setCoupons(prev => prev.filter(c => c._id !== id));
            } else {
                alert(data.error || "Failed to delete coupon");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete coupon");
        }
    };



    const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: !currentStatus }),
            });
            const data = await res.json();

            if (data.success) {
                setCoupons(prev =>
                    prev.map(c => c._id === id ? { ...c, active: !currentStatus } : c)
                );
            } else {
                alert(data.error || "Failed to update coupon");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update coupon");
        }
    };

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const getStatusBadge = (coupon: Coupon) => {
        if (!coupon.active) {
            return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Inactive</span>;
        }
        if (isExpired(coupon.expiresAt)) {
            return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Expired</span>;
        }
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                Loading coupons...
            </div>
        );
    }


    const toggleStats = () => {
        const newValue = !showStats;
        setShowStats(newValue);
        localStorage.setItem('admin-coupons-showStats', JSON.stringify(newValue));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Coupons Manager 🎫</h1>
                <div className="flex gap-2">
                    <button
                        onClick={toggleStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <BarChart3 size={18} />
                        {showStats ? "Hide Stats" : "Show Stats"}
                    </button>
                    <button
                        onClick={fetchCoupons}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                    <button
                        onClick={() => router.push('/admin-dashboard/coupons/add')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Add Coupon
                    </button>
                </div>
            </div>

            {showStats && (
                <div className="mb-6">
                    <CouponsStatsCharts coupons={coupons} />
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search coupons..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive</option>
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Types</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="createdAt">Created Date</option>
                    <option value="code">Code</option>
                    <option value="price">Discount Value</option>
                </select>

                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Conditions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expires
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-mono font-bold text-gray-900">
                                        {coupon.code}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {coupon.description || "No description"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {coupon.isPercentage ? `${coupon.price}%` : `$${coupon.price}`}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs text-gray-500 space-y-1">
                                        {coupon.minQuantity > 1 && (
                                            <div>Min {coupon.minQuantity} items</div>
                                        )}
                                        {coupon.minSubtotal > 0 && (
                                            <div>Min ${coupon.minSubtotal}</div>
                                        )}
                                        {coupon.minOrderCount > 0 && (
                                            <div>After {coupon.minOrderCount} orders</div>
                                        )}
                                        {!coupon.minQuantity && !coupon.minSubtotal && !coupon.minOrderCount && (
                                            <div>No conditions</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {coupon.expiresAt ? (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(coupon.expiresAt).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            "Never"
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(coupon)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => toggleCouponStatus(coupon._id, coupon.active)}
                                        className={`${coupon.active
                                            ? "text-green-600 hover:text-green-900"
                                            : "text-orange-600 hover:text-orange-900"
                                            }`}
                                    >
                                        {coupon.active ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin-dashboard/coupons/${coupon._id}`)}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteCoupon(coupon._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <div className="text-6xl mb-4">🎫</div>
                        <h3 className="text-xl font-semibold mb-2">No coupons found</h3>
                        <p className="text-center max-w-md">
                            {coupons.length === 0
                                ? "Get started by creating your first coupon!"
                                : "Try adjusting your filters to see more results."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}