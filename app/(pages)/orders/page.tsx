"use client";

import { useEffect, useState } from "react";

type MovieItem = {
  movieSnapshot: {
    id?: number;
    _id?: string; 
    title: string;
    coverImage: string;
    price: number;
    discountPrice: number | null;
    description?: string;
    genre?: string[];
  };
  quantity: number;
  purchasePrice: number;
};

type Order = {
  _id: string;
  movies: MovieItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponSnapshot?: {
    code: string;
    description: string;
    discountAmount: number;
    isPercentage: boolean;
    originalDiscountValue: number;
  } | null;
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
      console.log("Orders data:", data); // Debug log
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

  // Helper function to get unique key for each movie item
  const getMovieKey = (movieSnapshot: any, index: number) => {
    // Use _id if available, otherwise use id, otherwise use index
    return movieSnapshot._id || movieSnapshot.id || index;
  };

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
              {order.movies.map((item, idx) => (
                <div key={getMovieKey(item.movieSnapshot, idx)} className="flex items-center gap-4">
                  <img 
                    src={item.movieSnapshot.coverImage} 
                    alt={item.movieSnapshot.title} 
                    className="w-16 h-24 object-cover rounded" 
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.movieSnapshot.title}</p>
                    <p className="text-gray-600 text-sm">
                      Quantity: {item.quantity} | Price: ${item.purchasePrice.toFixed(2)}
                    </p>
                    {/* Show original price if there was a discount */}
                    {item.movieSnapshot.discountPrice && (
                      <p className="text-gray-500 text-xs">
                        Original: ${item.movieSnapshot.price.toFixed(2)}
                      </p>
                    )}
                    {/* Debug info - remove in production */}
                    <p className="text-xs text-gray-400">
                      ID: {item.movieSnapshot._id || item.movieSnapshot.id || 'No ID'}
                    </p>
                  </div>
                  <div className="font-semibold">
                    ${(item.purchasePrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
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

            {/* Coupon Information */}
            {order.couponSnapshot && (
              <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Coupon Applied: <b>{order.couponSnapshot.code}</b>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {order.couponSnapshot.description} • 
                  {order.couponSnapshot.isPercentage ? 
                    ` ${order.couponSnapshot.originalDiscountValue}% off` : 
                    ` $${order.couponSnapshot.originalDiscountValue} off`
                  }
                </p>
                <p className="text-xs text-blue-600">
                  You saved: <b>${order.couponSnapshot.discountAmount.toFixed(2)}</b>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}