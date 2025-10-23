"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Package, DollarSign, Calendar } from "lucide-react";
import { useUser } from "@/app/components/context/userContext";

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
    description?: string;
    genre?: string[];
  };
  quantity: number;
  purchasePrice: number;
}

interface Order {
  _id: string;
  userId: OrderUser;
  movies: OrderMovie[];
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
  };
  createdAt: string;
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) return;

      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();

        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        alert("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          Back to Orders
        </button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar size={16} />
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${order.total.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <p className="text-gray-900">{order.userId.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-gray-900">{order.userId.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <p className="text-gray-900 font-mono text-sm">
                  {order.userId._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={20} />
              Order Items ({order.movies.length})
            </h3>
            <div className="space-y-4">
              {order.movies.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img 
                    src={item.movieSnapshot.coverImage} 
                    alt={item.movieSnapshot.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{item.movieSnapshot.title}</h4>
                    {item.movieSnapshot.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {item.movieSnapshot.description}
                      </p>
                    )}
                    {item.movieSnapshot.genre && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.movieSnapshot.genre.map((genre, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold">{item.quantity}</span>
                    </div>
                    <div className="text-lg font-semibold">
                      ${item.purchasePrice.toFixed(2)} each
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      ${(item.purchasePrice * item.quantity).toFixed(2)}
                    </div>
                    {item.movieSnapshot.discountPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        Original: ${item.movieSnapshot.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              Price Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold">${order.tax.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Coupon Information */}
          {order.couponSnapshot && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Coupon Applied</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Code:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                    {order.couponSnapshot.code}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-gray-600 text-sm mt-1">
                    {order.couponSnapshot.description}
                  </p>
                </div>
                <div className="flex justify-between">
                  <span>Discount Type:</span>
                  <span className="font-semibold">
                    {order.couponSnapshot.isPercentage ? 'Percentage' : 'Fixed Amount'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Original Value:</span>
                  <span className="font-semibold">
                    {order.couponSnapshot.isPercentage ? 
                      `${order.couponSnapshot.originalDiscountValue}%` : 
                      `$${order.couponSnapshot.originalDiscountValue}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Amount Saved:</span>
                  <span>${order.couponSnapshot.discountAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Order Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-semibold">
                  {order.movies.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unique Movies:</span>
                <span className="font-semibold">{order.movies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-semibold">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Time:</span>
                <span className="font-semibold">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}