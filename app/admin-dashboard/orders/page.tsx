"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Download, RefreshCw, Search, Filter, BarChart3, Calendar } from "lucide-react";
import { useUser } from "@/app/components/context/userContext";
import OrdersStatsCharts from "../components/OrdersStatsCharts";

interface OrderUser {
    _id: string;
    name: string;
    email: string;
}

interface OrderMovie {
    movieSnapshot: {
        id: number;
        title: string;
        coverImage: string;
        price: number;
        discountPrice: number | null;
    };
    quantity: number;
    purchasePrice: number;
}

interface Order {
    _id: string;
    shortId?: string;
    userId: OrderUser;
    movies: OrderMovie[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    couponSnapshot?: {
        code: string;
        discountAmount: number;
        isPercentage: boolean;
    };
    createdAt: string;
    totalItems?: number;
    totalMovies?: number;
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const { token } = useUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filtered, setFiltered] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStats, setShowStats] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin-orders-showStats');
            return saved ? JSON.parse(saved) : true;
        }
        return true;
    });

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Range filters
    const [minItems, setMinItems] = useState("");
    const [maxItems, setMaxItems] = useState("");
    const [minMovies, setMinMovies] = useState("");
    const [maxMovies, setMaxMovies] = useState("");
    const [minTotal, setMinTotal] = useState("");
    const [maxTotal, setMaxTotal] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/admin/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (data.success) {
                // Add calculated fields for client-side filtering
                const ordersWithCalculations = data.orders.map((order: Order) => ({
                    ...order,
                    totalItems: order.movies.reduce((sum, item) => sum + item.quantity, 0),
                    totalMovies: order.movies.length
                }));

                setOrders(ordersWithCalculations);
                setFiltered(ordersWithCalculations);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    // Client-side filtering
    useEffect(() => {
        let temp = [...orders];

        // Search filter
        if (search.trim()) {
            const cleanSearch = search.replace(/^#/, '').toLowerCase();
            temp = temp.filter(order =>
                order.userId.name.toLowerCase().includes(cleanSearch) ||
                order.userId.email.toLowerCase().includes(cleanSearch) ||
                (order.shortId && order.shortId.toLowerCase().includes(cleanSearch)) ||
                order._id.toLowerCase().includes(cleanSearch)
            );
        }

        // Status filter (coupon usage)
        if (statusFilter === "withCoupon") {
            temp = temp.filter(order => order.discount > 0);
        } else if (statusFilter === "withoutCoupon") {
            temp = temp.filter(order => order.discount === 0);
        }

        // Range filters
        if (minItems) {
            temp = temp.filter(order => (order.totalItems || 0) >= parseInt(minItems));
        }
        if (maxItems) {
            temp = temp.filter(order => (order.totalItems || 0) <= parseInt(maxItems));
        }
        if (minMovies) {
            temp = temp.filter(order => (order.totalMovies || 0) >= parseInt(minMovies));
        }
        if (maxMovies) {
            temp = temp.filter(order => (order.totalMovies || 0) <= parseInt(maxMovies));
        }
        if (minTotal) {
            temp = temp.filter(order => order.total >= parseFloat(minTotal));
        }
        if (maxTotal) {
            temp = temp.filter(order => order.total <= parseFloat(maxTotal));
        }
        if (startDate) {
            temp = temp.filter(order => new Date(order.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of the day
            temp = temp.filter(order => new Date(order.createdAt) <= end);
        }

        // Sort
        temp.sort((a, b) => {
            let aValue: any = a;
            let bValue: any = b;

            if (sortBy === "total") {
                aValue = a.total;
                bValue = b.total;
            } else if (sortBy === "items") {
                aValue = a.totalItems || 0;
                bValue = b.totalItems || 0;
            } else if (sortBy === "date") {
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
            } else if (sortBy === "customer") {
                aValue = a.userId.name.toLowerCase();
                bValue = b.userId.name.toLowerCase();
            }

            if (sortOrder === "desc") {
                return aValue < bValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        setFiltered(temp);
    }, [
        search, statusFilter, sortBy, sortOrder, orders,
        minItems, maxItems, minMovies, maxMovies, minTotal, maxTotal, startDate, endDate
    ]);

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setSortBy("createdAt");
        setSortOrder("desc");
        setMinItems("");
        setMaxItems("");
        setMinMovies("");
        setMaxMovies("");
        setMinTotal("");
        setMaxTotal("");
        setStartDate("");
        setEndDate("");
    };

    const viewOrderDetails = (orderId: string) => {
        router.push(`/admin-dashboard/orders/${orderId}`);
    };

    const exportOrders = () => {
        const csvContent = convertToCSV(filtered);
        downloadCSV(csvContent, "orders_export.csv");
        alert(`Exported ${filtered.length} orders`);
    };

    const convertToCSV = (orders: Order[]) => {
        const headers = ["Order ID", "Customer", "Email", "Items", "Movies", "Total", "Discount", "Date"];
        const rows = orders.map(order => [
            order.shortId ? `#${order.shortId.toUpperCase()}` : order._id.slice(-6).toUpperCase(),
            order.userId.name,
            order.userId.email,
            (order.totalItems || 0).toString(),
            (order.totalMovies || 0).toString(),
            `$${order.total.toFixed(2)}`,
            `$${order.discount.toFixed(2)}`,
            new Date(order.createdAt).toLocaleDateString()
        ]);

        return [headers, ...rows].map(row => row.join(",")).join("\n");
    };

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate stats from filtered data
    const totalRevenue = filtered.reduce((sum, order) => sum + order.total, 0);
    const totalOrdersCount = filtered.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const totalItemsSold = filtered.reduce((sum, order) => sum + (order.totalItems || 0), 0);
    const ordersWithCoupons = filtered.filter(order => order.discount > 0).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                Loading orders...
            </div>
        );
    }


    const toggleStats = () => {
        const newValue = !showStats;
        setShowStats(newValue);
        localStorage.setItem('admin-orders-showStats', JSON.stringify(newValue));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Orders Manager 📦</h1>
                <div className="flex gap-2">
                    <button
                        onClick={toggleStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <BarChart3 size={18} />
                        {showStats ? "Hide Stats" : "Show Stats"}
                    </button>
                    <button
                        onClick={exportOrders}
                        disabled={filtered.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Download size={18} /> Export ({filtered.length})
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>


            {showStats && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-medium text-blue-800">Total Orders</h3>
                            <p className="text-2xl font-bold text-blue-600">{totalOrdersCount}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
                            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="text-sm font-medium text-purple-800">Avg Order Value</h3>
                            <p className="text-2xl font-bold text-purple-600">${averageOrderValue.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h3 className="text-sm font-medium text-orange-800">Items Sold</h3>
                            <p className="text-2xl font-bold text-orange-600">{totalItemsSold}</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <OrdersStatsCharts />
                </>
            )}

            {/* Filters Section - Fixed height to prevent layout jumping */}
            <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Filter size={20} />
                        Filters
                    </h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>

                {/* Fixed height container with scroll */}
                <div className="max-h-48 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search orders, customers, emails..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Coupon Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Orders</option>
                                <option value="withCoupon">With Coupon</option>
                                <option value="withoutCoupon">Without Coupon</option>
                            </select>
                        </div>

                        {/* Items Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Items Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minItems}
                                    onChange={(e) => setMinItems(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxItems}
                                    onChange={(e) => setMaxItems(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Movies Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Movies Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minMovies}
                                    onChange={(e) => setMinMovies(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxMovies}
                                    onChange={(e) => setMaxMovies(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Total Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Range ($)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Min"
                                    value={minTotal}
                                    onChange={(e) => setMinTotal(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Max"
                                    value={maxTotal}
                                    onChange={(e) => setMaxTotal(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Range
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="date">Date</option>
                                    <option value="total">Total Amount</option>
                                    <option value="items">Item Count</option>
                                    <option value="customer">Customer Name</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-mono font-bold text-gray-900">
                                        #{order.shortId ? order.shortId.toUpperCase() : order._id.slice(-6).toUpperCase()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="font-medium text-gray-900">{order.userId.name}</div>
                                        <div className="text-sm text-gray-500">{order.userId.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {order.totalItems} items
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {order.totalMovies} movies
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                        ${order.total.toFixed(2)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {order.discount > 0 ? (
                                            <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-400">$0.00</span>
                                        )}
                                    </div>
                                    {order.couponSnapshot && (
                                        <div className="text-xs text-blue-600">
                                            {order.couponSnapshot.code}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                    <div className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => viewOrderDetails(order._id)}
                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                    >
                                        <Eye size={16} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                        <p className="text-center max-w-md">
                            {orders.length === 0
                                ? "No orders have been placed yet!"
                                : "Try adjusting your filters to see more results."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}