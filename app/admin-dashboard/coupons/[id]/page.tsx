"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/app/components/context/userContext";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

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
}

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    price: 0,
    isPercentage: false,
    minQuantity: 1,
    minSubtotal: 0,
    minOrderCount: 0,
    maxOrderCount: null as number | null,
    specificOrderCount: null as number | null,
    description: "",
    expiresAt: "",
    active: true,
  });

  useEffect(() => {
    if (params.id && token) {
      fetchCoupon();
    }
  }, [params.id, token]);

  const fetchCoupon = async () => {
    try {
      const res = await fetch(`/api/admin/coupons/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (data.success) {
        setCoupon(data.coupon);
        setFormData({
          code: data.coupon.code,
          price: data.coupon.price,
          isPercentage: data.coupon.isPercentage,
          minQuantity: data.coupon.minQuantity,
          minSubtotal: data.coupon.minSubtotal,
          minOrderCount: data.coupon.minOrderCount,
          maxOrderCount: data.coupon.maxOrderCount,
          specificOrderCount: data.coupon.specificOrderCount,
          description: data.coupon.description,
          expiresAt: data.coupon.expiresAt ? new Date(data.coupon.expiresAt).toISOString().split('T')[0] : "",
          active: data.coupon.active,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/coupons/${params.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/admin-dashboard/coupons');
      } else {
        alert(data.error || "Failed to update coupon");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? (value === '' ? '' : Number(value)) : 
               value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        Coupon not found
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Edit Coupon</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SUMMER25"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <select
              name="isPercentage"
              value={formData.isPercentage.toString()}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">Fixed Amount ($)</option>
              <option value="true">Percentage (%)</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Value *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step={formData.isPercentage ? "1" : "0.01"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.isPercentage ? "25" : "10.00"}
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <input
              type="date"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Quantity
            </label>
            <input
              type="number"
              name="minQuantity"
              value={formData.minQuantity}
              onChange={handleChange}
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Subtotal ($)
            </label>
            <input
              type="number"
              name="minSubtotal"
              value={formData.minSubtotal}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Count
            </label>
            <input
              type="number"
              name="minOrderCount"
              value={formData.minOrderCount}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Active Coupon
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the coupon purpose..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}