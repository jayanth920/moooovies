"use client";

import { useEffect, useState } from "react";

type MovieItem = {
  movieId: number;
  quantity: number;
  movie: {
    id: number;
    title: string;
    coverImage: string;
    price: number;
    discountPrice: number | null;
  };
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; price: number } | null>(null);

  const TAX_RATE = 0.08; // 8% default tax

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart/current", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setCartItems(data.cart?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (movieId: number, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.movieId === movieId ? { ...item, quantity } : item
      )
    );
    setUpdating(movieId);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ movieId, quantity }),
      });
    } catch {
      fetchCart();
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (movieId: number) => {
    setUpdating(movieId);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ movieId }),
      });
      setCartItems((prev) => prev.filter((item) => item.movieId !== movieId));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const applyCoupon = async () => {
    try {
      // Replace this with your real API endpoint
      const res = await fetch(`/api/coupons/apply?code=${couponCode}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.valid) setAppliedCoupon({ code: data.coupon.code, price: data.coupon.price });
      else setAppliedCoupon(null);
    } catch {
      setAppliedCoupon(null);
    }
  };

  // Compute totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.movie.discountPrice ?? item.movie.price;
    return sum + price * item.quantity;
  }, 0);

  const discount = cartItems.reduce((sum, item) => {
    if (item.movie.discountPrice) {
      return sum + (item.movie.price - item.movie.discountPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const couponDiscount = appliedCoupon?.price || 0;
  const tax = (subtotal - discount - couponDiscount) * TAX_RATE;
  const total = subtotal - discount - couponDiscount + tax;

  if (loading) return <p className="p-8">Loading cart...</p>;
  if (!cartItems.length) return <p className="p-8">Your cart is empty.</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Cart 🛒</h1>

      <div className="flex flex-col gap-6">
        {cartItems.map((item) => {
          const price = item.movie.discountPrice ?? item.movie.price;
          return (
            <div key={item.movieId} className="flex items-center gap-4 border-b pb-4">
              <div className="flex items-center gap-4 flex-1">
                <img src={item.movie.coverImage} alt={item.movie.title} className="w-24 h-36 object-cover rounded" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold">{item.movie.title}</h2>
                  <p>
                    Price: ${price.toFixed(2)}
                    {item.movie.discountPrice && (
                      <span className="line-through text-gray-400 ml-2">${item.movie.price.toFixed(2)}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.movieId, item.quantity - 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      disabled={item.quantity <= 1 || updating === item.movieId}
                    >
                      -
                    </button>
                    <span className="min-w-[24px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.movieId, item.quantity + 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50 relative"
                      disabled={updating === item.movieId}
                    >
                      {updating === item.movieId ? (
                        <span className="animate-spin block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mx-auto"></span>
                      ) : (
                        "+"
                      )}
                    </button>
                    <button
                      onClick={() => removeItem(item.movieId)}
                      className="ml-2 text-red-600 hover:underline"
                      disabled={updating === item.movieId}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div className="font-semibold">${(price * item.quantity).toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Coupon input */}
      <div className="mt-6 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1"
        />
        <button
          onClick={applyCoupon}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Apply
        </button>
        {appliedCoupon && <span className="ml-2 text-green-700 font-semibold">Applied: {appliedCoupon.code}</span>}
      </div>

      {/* Price breakdown */}
      <div className="mt-6 border-t pt-4 flex flex-col gap-2">
        <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Discount:</span><span>-${discount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Coupon:</span><span>-${couponDiscount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax:</span><span>${tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${total.toFixed(2)}</span></div>
      </div>

      <div className="mt-6 text-right">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Place Order</button>
      </div>
    </div>
  );
}
