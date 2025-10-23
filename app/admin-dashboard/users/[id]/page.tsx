"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Shield, Activity, AlertTriangle, Trash2 } from "lucide-react";
import { useUser } from "@/app/components/context/userContext";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  active: boolean;
  createdAt: string;
  orders?: any[];
  ordersCount?: number;
  stats?: {
    totalSpent: number;
    averageOrder: number;
    lastOrder: string | null;
  };
}

export default function UserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user: currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "admin",
    active: true,
    password: "",
  });

  const [stats, setStats] = useState({
    totalSpent: 0,
    averageOrder: 0,
    lastOrder: null as string | null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
          setFormData({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            active: data.user.active,
            password: "", // Don't pre-fill password
          });

          // Use stats from backend
          if (data.user.stats) {
            setStats({
              totalSpent: data.user.stats.totalSpent,
              averageOrder: data.user.stats.averageOrder,
              lastOrder: data.user.stats.lastOrder,
            });
          } else {
            // Fallback if stats not available
            setStats({
              totalSpent: 0,
              averageOrder: 0,
              lastOrder: null,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        alert("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, token]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Authentication required");
      return;
    }

    setSaving(true);

    try {
      const userData = {
        ...formData,
        // Only include password if it's not empty
        ...(formData.password && { password: formData.password })
      };

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        alert("User updated successfully!");
        router.push("/admin-dashboard/users");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;

    if (!token) {
      alert("Authentication required");
      return;
    }

    // Check if trying to deactivate an admin
    if (user.role === "admin") {
      alert("Cannot deactivate admin accounts");
      return;
    }

    const action = user.active ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${id}/deactivate`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`User ${action}d successfully!`);
        router.push("/admin-dashboard/users");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    if (!token) {
      alert("Authentication required");
      return;
    }

    // Check if trying to delete an admin
    if (user.role === "admin") {
      alert("Cannot delete admin accounts");
      return;
    }

    // Check if trying to delete yourself
    if (currentUser?.id === user._id) {
      alert("Cannot delete your own account");
      return;
    }

    if (!confirm(`⚠️ DANGER: This will PERMANENTLY DELETE user "${user.name}" and ALL their data. This action cannot be undone! Are you absolutely sure?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${id}/delete`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert("User permanently deleted!");
        router.push("/admin-dashboard/users");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading user...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">User not found</div>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === user._id;
  const isAdminUser = user.role === "admin";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
              <User size={20} />
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
              <Activity size={20} />
              Statistics
            </h2>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-lg font-semibold text-gray-900">
                  {user.ordersCount || 0}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm text-gray-600">Total Spent</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${stats.totalSpent.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm text-gray-600">Average Order</div>
                <div className="text-lg font-semibold text-gray-900">
                  ${stats.averageOrder.toFixed(2)}
                </div>
              </div>

              {/* Last Order Date - Only show if exists */}
              {stats.lastOrder && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600">Last Order</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(stats.lastOrder).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm text-gray-600">Member Since</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

            </div>
          </div>

          {/* Security */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
              <Shield size={20} />
              Security
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reset Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter new password to reset, or leave empty to keep current password
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Danger Zone
            </h2>

            {/* Deactivate/Activate Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                {user.active ? "Deactivate User" : "Activate User"}
              </h3>
              <p className="text-sm text-red-600 mb-3">
                {user.active
                  ? "Deactivated users cannot log in or place orders."
                  : "Activate this user to restore access."
                }
                {isAdminUser && " Admin accounts cannot be deactivated."}
              </p>

              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isAdminUser && user.active} // Only disable for active admins
                className={`w-full px-4 py-2 rounded-lg text-white ${user.active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
              >
                {user.active
                  ? (isAdminUser ? "Cannot Deactivate Admin" : "Deactivate User")
                  : "Activate User"
                }
              </button>
            </div>

            {/* Permanent Delete Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <Trash2 size={16} />
                Permanent Delete
              </h3>
              <p className="text-sm text-red-600 mb-3">
                Permanently delete this user and all their data. This action cannot be undone.
                {isAdminUser && " Admin accounts cannot be deleted."}
                {isCurrentUser && " You cannot delete your own account."}
              </p>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isAdminUser || isCurrentUser}
                className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {isAdminUser ? "Cannot Delete Admin"
                  : isCurrentUser ? "Cannot Delete Own Account"
                    : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin-dashboard/users")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}