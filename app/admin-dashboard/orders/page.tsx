"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Eye, Download, RefreshCw, Search,
    Filter, DollarSign, Package,
    Users
} from "lucide-react";
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
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const { token } = useUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [showStats, setShowStats] = useState(true);


    // Filters
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [minItems, setMinItems] = useState("");
    const [maxItems, setMaxItems] = useState("");
    const [minMovies, setMinMovies] = useState("");
    const [maxMovies, setMaxMovies] = useState("");
    const [minTotal, setMinTotal] = useState("");
    const [maxTotal, setMaxTotal] = useState("");
    const [hasCoupon, setHasCoupon] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");


    // Simple fetch function - NO LOADING STATES
    const fetchOrders = async () => {
        if (!token) return;

        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (minItems) params.append("minItems", minItems);
            if (maxItems) params.append("maxItems", maxItems);
            if (minMovies) params.append("minMovies", minMovies);
            if (maxMovies) params.append("maxMovies", maxMovies);
            if (minTotal) params.append("minTotal", minTotal);
            if (maxTotal) params.append("maxTotal", maxTotal);
            if (hasCoupon) params.append("hasCoupon", hasCoupon);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            params.append("page", currentPage.toString());
            params.append("limit", "20");

            const res = await fetch(`/api/admin/orders?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (data.success) {
                setOrders(data.orders);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Initial load only
    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    // AUTO-REFRESH when filters change - with debouncing for search
    useEffect(() => {
        if (token) {
            const timeoutId = setTimeout(() => {
                fetchOrders();
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [
        token, search, minItems, maxItems, minMovies, maxMovies,
        minTotal, maxTotal, hasCoupon, startDate, endDate, currentPage
    ]);

    const clearFilters = () => {
        setSearch("");
        setMinItems("");
        setMaxItems("");
        setMinMovies("");
        setMaxMovies("");
        setMinTotal("");
        setMaxTotal("");
        setHasCoupon("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    };

    const viewOrderDetails = (orderId: string) => {
        router.push(`/admin-dashboard/orders/${orderId}`);
    };

    const exportOrders = () => {
        const csvContent = convertToCSV(orders);
        downloadCSV(csvContent, "orders_export.csv");
        alert(`Exported ${orders.length} orders`);
    };

    const convertToCSV = (orders: Order[]) => {
        const headers = ["Order ID", "Customer", "Email", "Items", "Movies", "Total", "Discount", "Date"];
        const rows = orders.map(order => [
            order._id.slice(-6).toUpperCase(),
            order.userId.name,
            order.userId.email,
            order.movies.reduce((sum, item) => sum + item.quantity, 0).toString(),
            order.movies.length.toString(),
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

    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrdersCount = orders.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const totalItemsSold = orders.reduce((sum, order) =>
        sum + order.movies.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const ordersWithCoupons = orders.filter(order => order.discount > 0).length;


    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Orders Manager 📦</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </button>
                    <button
                        onClick={exportOrders}
                        disabled={orders.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* ... your stats cards ... */}
            </div>

            {/* Charts Section - Conditionally Rendered */}
            {showStats && <OrdersStatsCharts />}

            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Filter size={20} />
                        Filters
                    </h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Clear All
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 items-center max-h-32 overflow-y-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search order ID (e.g., #4E71FB), customer name, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <input
                        type="number"
                        min="0"
                        placeholder="Min Items"
                        value={minItems}
                        onChange={(e) => setMinItems(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        min="0"
                        placeholder="Max Items"
                        value={maxItems}
                        onChange={(e) => setMaxItems(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        min="0"
                        placeholder="Min Movies"
                        value={minMovies}
                        onChange={(e) => setMinMovies(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        min="0"
                        placeholder="Max Movies"
                        value={maxMovies}
                        onChange={(e) => setMaxMovies(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Min Total"
                        value={minTotal}
                        onChange={(e) => setMinTotal(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Max Total"
                        value={maxTotal}
                        onChange={(e) => setMaxTotal(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={hasCoupon}
                        onChange={(e) => setHasCoupon(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Orders</option>
                        <option value="true">With Coupon</option>
                        <option value="false">Without Coupon</option>
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            {/* <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Clear Filters
                </button> */}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden min-h-[400px] flex flex-col">
                <div className="flex-1">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
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
                            {orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
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
                                            {order.movies.reduce((sum, item) => sum + item.quantity, 0)} items
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {order.movies.length} movies
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
                    {orders.length === 0 && (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {search || minItems || maxItems || minMovies || maxMovies || minTotal || maxTotal || hasCoupon || startDate || endDate
                                    ? "Try adjusting your search or filters."
                                    : "Get started by making some sales!"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination - Stays at bottom */}
                {pagination && pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t bg-gray-50 mt-auto">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                                {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                                {pagination.total} orders
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                                    disabled={currentPage === pagination.pages}
                                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}