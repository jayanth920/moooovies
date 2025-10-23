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

type CartTotals = {
  subtotal: number;
  couponDiscount: number;
  tax: number;
  total: number;
  appliedCoupon: { code: string; description: string; discountAmount: number } | null;
  totalQuantity: number;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<MovieItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"valid" | "invalid" | "checking" | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // ---------------- Fetch Cart ----------------
  const fetchCart = async (coupon?: string) => {
    setLoading(true);
    try {
      const url = coupon ? `/api/cart/current?coupon=${coupon}` : "/api/cart/current";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      setCartItems(data.cart?.items || []);
      if (data.totals) {
        setTotals({
          subtotal: data.totals.subtotal,
          couponDiscount: data.totals.discountAmount,
          tax: data.totals.tax,
          total: data.totals.total,
          appliedCoupon: data.totals.appliedCoupon,
          totalQuantity: data.totals.totalQuantity,
        });
      } else {
        setTotals(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ---------------- Quantity Updates ----------------
  const updateQuantity = async (movieId: number, quantity: number) => {
    if (quantity < 1) return;
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
      await fetchCart(couponCode);
    } catch {
      await fetchCart(couponCode);
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
      await fetchCart(couponCode);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // ---------------- Apply Coupon ----------------
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus("checking");

    setLoading(true);
    try {
      const url = `/api/cart/current?coupon=${couponCode}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      setCartItems(data.cart?.items || []);
      let newTotals = null;
      if (data.totals) {
        newTotals = {
          subtotal: data.totals.subtotal,
          couponDiscount: data.totals.discountAmount,
          tax: data.totals.tax,
          total: data.totals.total,
          appliedCoupon: data.totals.appliedCoupon,
          totalQuantity: data.totals.totalQuantity,
        };
        setTotals(newTotals);
      } else {
        setTotals(null);
      }

      if (newTotals?.appliedCoupon?.code === couponCode.toUpperCase()) {
        setCouponStatus("valid");
      } else {
        setCouponStatus("invalid");
      }
    } catch (err) {
      console.error(err);
      setCouponStatus("invalid");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Place Order ----------------

  const placeOrder = async () => {
    if (!totals || !cartItems.length) return;
    setPlacingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          movies: cartItems.map((item) => ({
            movieId: item.movieId,
            quantity: item.quantity,
            price: item.movie.discountPrice ?? item.movie.price
          })),
          coupon: couponStatus === "valid" ? couponCode : undefined
        })
      });

      // Check if response is OK before parsing JSON
      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to place order";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If can't parse JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Now safely parse the JSON
      const data = await res.json();
      console.log("DATA", data);

      if (data.success) {
        // Open success modal
        setOrderModalOpen(true);
        // Clear cart and totals on frontend (backend already emptied)
        setCartItems([]);
        setTotals(null);
        setCouponCode("");
        setCouponStatus(null);
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      console.error("Order error:", err);
      alert(err instanceof Error ? err.message : "Failed to place order, try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ---------------- Render ----------------
  if (loading && !cartItems.length) {
    // Only show full loading screen on first load
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (!cartItems.length && !orderModalOpen) return <p className="p-8">Your cart is empty.</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Cart 🛒</h1>

      {/* Cart Items */}
      <div className="flex flex-col gap-6">
        {cartItems.map((item) => {
          const price = item.movie.discountPrice ?? item.movie.price;
          return (
            <div key={item.movieId}
              className="flex items-center gap-4 border-b pb-4 transition-opacity duration-200"
              style={{ opacity: updating === item.movieId ? 0.6 : 1 }}>
              <div className="flex items-center gap-4 flex-1">
                <img src={item.movie.coverImage} alt={item.movie.title} className="w-24 h-36 object-cover rounded" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold">{item.movie.title}</h2>
                  <p>Price: ${price.toFixed(2)}
                    {item.movie.discountPrice && (
                      <span className="line-through text-gray-400 ml-2">${item.movie.price.toFixed(2)}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.movieId, item.quantity - 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      disabled={item.quantity <= 1 || updating === item.movieId}>-</button>
                    <span className="min-w-[24px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.movieId, item.quantity + 1)}
                      className="px-2 py-1 border rounded disabled:opacity-50 relative"
                      disabled={updating === item.movieId}>
                      +
                    </button>
                    {updating === item.movieId && (
                      <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                    )}
                    <button onClick={() => removeItem(item.movieId)}
                      className="ml-2 text-red-600 hover:underline"
                      disabled={updating === item.movieId}>Remove</button>
                  </div>
                </div>
              </div>
              <div className="font-semibold">${(price * item.quantity).toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Coupon Input */}
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 flex-1" />
          <button onClick={applyCoupon} disabled={couponStatus === "checking"}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-70">
            {couponStatus === "checking" ? (
              <span className="animate-spin block w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"></span>
            ) : "Apply"}
          </button>
        </div>
        {couponStatus === "valid" && totals?.appliedCoupon && (
          <p className="text-green-600 text-sm font-medium">
            ✅ Coupon <b>{totals.appliedCoupon.code}</b> applied! You saved ${totals.couponDiscount.toFixed(2)}.
          </p>
        )}
        {couponStatus === "invalid" && (
          <p className="text-red-600 text-sm font-medium">❌ Not applicable or expired coupon. Please try another.</p>
        )}
      </div>

      {/* Price Breakdown */}
      {totals && (
        <div className="mt-6 border-t pt-4 flex flex-col gap-2 text-gray-800">
          <div className="flex justify-between"><span>Subtotal:</span><span>${totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Coupon Discount:</span><span>-${totals.couponDiscount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax (8.25 %):</span><span>${totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${totals.total.toFixed(2)}</span></div>
        </div>
      )}

      {/* Place Order */}
      <div className="mt-6 text-right">
        <button onClick={placeOrder} disabled={placingOrder}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          {placingOrder ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {orderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🎉 Order Placed!</h2>
            <p className="mb-4">
              Your order has been successfully placed. The digital movies will be delivered to your registered email within a few minutes.
            </p>
            <p className="mb-4">
              ✅ Check the summary of your latest order <a href="/orders" className="text-blue-600 underline font-medium">here</a>.
            </p>
            <button
              onClick={() => {
                setOrderModalOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
