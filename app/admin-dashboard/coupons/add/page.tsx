"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/components/context/userContext";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function AddCouponPage() {
  const router = useRouter();
  const { token } = useUser();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
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
        alert(data.error || "Failed to create coupon");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create coupon");
    } finally {
      setLoading(false);
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Create New Coupon</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code */}
          <div className="md:col-span-2">
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
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Code will be automatically converted to uppercase
            </p>
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
              max={formData.isPercentage ? "100" : "1000"}
              step={formData.isPercentage ? "1" : "0.01"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.isPercentage ? "25" : "10.00"}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.isPercentage ? "Percentage (0-100%)" : "Fixed amount in dollars"}
            </p>
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
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
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

        {/* Conditions Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Conditions (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Minimum Quantity */}
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
              <p className="text-xs text-gray-500 mt-1">Minimum items in cart</p>
            </div>

            {/* Minimum Subtotal */}
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
              <p className="text-xs text-gray-500 mt-1">Minimum cart subtotal</p>
            </div>

            {/* Minimum Order Count */}
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
              <p className="text-xs text-gray-500 mt-1">User's previous orders</p>
            </div>
          </div>

          {/* Advanced Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Maximum Order Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Order Count
              </label>
              <input
                type="number"
                name="maxOrderCount"
                value={formData.maxOrderCount || ""}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="No limit"
              />
              <p className="text-xs text-gray-500 mt-1">Max user orders (optional)</p>
            </div>

            {/* Specific Order Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Order Count
              </label>
              <input
                type="number"
                name="specificOrderCount"
                value={formData.specificOrderCount || ""}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any order count"
              />
              <p className="text-xs text-gray-500 mt-1">Exact order number (optional)</p>
            </div>
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
            placeholder="Describe the coupon purpose, target audience, or special instructions..."
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be shown to users when they apply the coupon
          </p>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-2">Coupon Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Code:</strong> {formData.code.toUpperCase() || "CODE"}</p>
            <p><strong>Discount:</strong> {formData.isPercentage ? `${formData.price}% off` : `$${formData.price} off`}</p>
            {formData.minQuantity > 1 && <p><strong>Requires:</strong> {formData.minQuantity}+ items</p>}
            {formData.minSubtotal > 0 && <p><strong>Minimum:</strong> ${formData.minSubtotal}</p>}
            {formData.minOrderCount > 0 && <p><strong>For customers with:</strong> {formData.minOrderCount}+ orders</p>}
            {formData.expiresAt && <p><strong>Expires:</strong> {new Date(formData.expiresAt).toLocaleDateString()}</p>}
            <p><strong>Status:</strong> <span className={formData.active ? "text-green-600" : "text-red-600"}>
              {formData.active ? "Active" : "Inactive"}
            </span></p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
            {loading ? "Creating..." : "Create Coupon"}
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