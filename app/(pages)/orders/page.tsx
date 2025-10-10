"use client";

import { useEffect, useState } from "react";

type MovieItem = {
    movieId: {
        title: string;
        coverImage: string;
    };
    quantity: number;
    price: number;
};

type Order = {
    _id: string;
    movies: MovieItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    coupon?: { code: string; description: string } | null; // can be null
    createdAt: string;
};


export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orders/user", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) return <p className="p-8">Loading orders...</p>;
    if (!orders.length) return <p className="p-8">You have no past orders.</p>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Your Past Orders 📦</h1>
            <div className="flex flex-col gap-8">
                {orders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4 shadow-sm bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg">Order #{order._id.slice(-6).toUpperCase()}</h2>
                            <span className="text-gray-500 text-sm">
                                {new Date(order.createdAt).toLocaleString()}
                            </span>
                        </div>

                        {/* Movies List */}
                        <div className="flex flex-col gap-2 mb-4">
                            {order.movies.map((item, idx) => {
                                if (!item.movieId) return null; // skip deleted movies
                                return (
                                    <div key={idx} className="flex items-center gap-4">
                                        <img src={item.movieId.coverImage} alt={item.movieId.title} className="w-16 h-24 object-cover rounded" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.movieId.title}</p>
                                            <p className="text-gray-600 text-sm">
                                                Quantity: {item.quantity} | Price: ${item.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t pt-2 text-gray-800 flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Coupon Discount:</span>
                                    <span>-${order.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>${order.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {order.coupon && (
                            <p className="mt-2 text-sm text-blue-600">
                                Coupon applied: <b>{order.coupon.code}</b> — {order.coupon.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
