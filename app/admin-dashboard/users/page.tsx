"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, Edit3, Plus, BarChart3, Download, RefreshCw, 
  Users, UserCheck, UserX, Shield, ShieldOff, Filter
} from "lucide-react";
import UserStatsCharts from "../components/UserStatsCharts";
import { useUser } from "@/app/components/context/userContext";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  active: boolean;
  orders: any[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { token } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: {
          
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store'
      });
      const data = await res.json();
      console.log("DATA", data)
      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [search, roleFilter, statusFilter, sortBy, sortOrder, token]);

  // Single toggle function for Select All / Deselect All
  const toggleSelectAll = () => {
    if (selected.length === filteredUsers.length) {
      setSelected([]);
    } else {
      setSelected(filteredUsers.map((user) => user._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selected.length === 0) {
      alert("No users selected");
      return;
    }

    if (!token) {
      alert("Authentication required");
      return;
    }

    // Confirmation messages
    const confirmMessages: { [key: string]: string } = {
      "change-role": `Are you sure you want to change role to ${data?.role} for ${selected.length} users?`,
      "change-status": `Are you sure you want to ${data?.active ? 'activate' : 'deactivate'} ${selected.length} users?`,
      "delete": `⚠️ DANGER: This will PERMANENTLY DELETE ${selected.length} users and ALL their data. This action cannot be undone! Are you absolutely sure?`
    };

    const message = confirmMessages[action] || `Are you sure you want to perform ${action} on ${selected.length} users?`;
    if (!confirm(message)) return;

    try {
      const response = await fetch("/api/admin/users/bulk-actions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, userIds: selected, data }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show detailed results
        if (result.results.failed.length > 0) {
          const errorMessages = result.results.failed.map((f: any) => 
            `User ${f.userId}: ${f.error}`
          ).join('\n');
          
          alert(`Operation completed with some errors:\n${errorMessages}`);
        }
        
        if (result.results.success.length > 0) {
          const successMessage = `Successfully processed ${result.results.success.length} users`;
          
          // Show combined message or separate based on results
          if (result.results.failed.length === 0) {
            alert(successMessage);
          } else {
            alert(`${successMessage}\n\nFailed for ${result.results.failed.length} users`);
          }
          
          // Refresh user list
          fetchUsers();
          setSelected([]);
        } else if (result.results.failed.length > 0) {
          alert('Operation failed for all selected users');
        }
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error in bulk action:', err);
      alert('Failed to process bulk action');
    }
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      alert("No users selected");
      return;
    }

    if (!token) {
      alert("Authentication required");
      return;
    }

    try {
      const response = await fetch("/api/admin/users/bulk-actions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: "export", 
          userIds: selected 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Create and download CSV
        const csvContent = convertToCSV(result.data);
        downloadCSV(csvContent, "users_export.csv");
        alert(`Exported ${result.data.length} users`);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to export users");
    }
  };

  const convertToCSV = (users: User[]) => {
    const headers = ["Name", "Email", "Role", "Status", "Orders", "Created Date"];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.role,
      user.active ? "Active" : "Inactive",
      user.orders?.length.toString() || "0",
      new Date(user.createdAt).toLocaleDateString()
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

  // Individual user actions (kept for single user operations)
  // const handleDeactivateUser = async (userId: string, userName: string) => {
  //   if (!confirm(`Are you sure you want to deactivate ${userName}? They will not be able to log in but their data will be preserved.`)) return;

  //   if (!token) {
  //     alert("Authentication required");
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
  //       method: "POST",
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //       },
  //     });

  //     const result = await response.json();
      
  //     if (result.success) {
  //       alert("User deactivated successfully!");
  //       fetchUsers();
  //     } else {
  //       alert(result.error);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to deactivate user");
  //   }
  // };

  const handlePermanentDelete = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ DANGER: This will PERMANENTLY DELETE user "${userName}" and ALL their data. This action cannot be undone! Are you absolutely sure?`)) return;

    if (!token) {
      alert("Authentication required");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        alert("User permanently deleted!");
        fetchUsers();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        Loading users...
      </div>
    );
  }

return (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Users Manager 👥</h1>
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/admin-dashboard/users/add')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Add User
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <BarChart3 size={18} /> 
          {showStats ? "Hide Stats" : "Show Stats"}
        </button>
        <button
          onClick={toggleSelectAll}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {selected.length === filteredUsers.length ? "Deselect All" : "Select All"}
        </button>
        <button
          onClick={handleExport}
          disabled={selected.length === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Download size={18} /> Export ({selected.length})
        </button>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>
    </div>

    {/* Statistics Charts */}
    {showStats && <UserStatsCharts />}

    {/* Bulk Actions - UPDATED WITH NEW BULK API */}
    {selected.length > 0 && (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-blue-800 text-lg">
              {selected.length} user(s) selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Change Roles */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-800">
                Change Roles:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("change-role", { role: "user" })}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors flex items-center gap-1"
                >
                  <UserCheck size={14} /> User
                </button>
                <button
                  onClick={() => handleBulkAction("change-role", { role: "admin" })}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors flex items-center gap-1"
                >
                  <Shield size={14} /> Admin
                </button>
              </div>
            </div>

            {/* Change Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-800">
                Change Status:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("change-status", { active: true })}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors flex items-center gap-1"
                >
                  <UserCheck size={14} /> Activate
                </button>
                <button
                  onClick={() => handleBulkAction("change-status", { active: false })}
                  className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm transition-colors flex items-center gap-1"
                >
                  <UserX size={14} /> Deactivate
                </button>
              </div>
            </div>

            {/* Delete Actions */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-blue-800">
                Delete Actions:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 text-sm transition-colors flex items-center gap-1 justify-center"
                >
                  <Trash2 size={14} /> Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Filters - Fixed container */}
    <div className="mb-6 bg-white p-4 rounded-lg shadow border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h3>
        <button
          onClick={() => {
            setSearch("");
            setRoleFilter("");
            setStatusFilter("");
            setSortBy("createdAt");
            setSortOrder("desc");
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Clear All
        </button>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center max-h-32 overflow-y-auto">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="createdAt">Sort By</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="createdAt">Created Date</option>
          <option value="orders">Orders Count</option>
        </select>
        
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>

    {/* Users Table - Fixed container that grows/shrinks with content */}
    <div className="bg-white rounded-lg shadow overflow-hidden min-h-[400px] flex flex-col">
      <div className="flex-1">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selected.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selected.includes(user._id)}
                    onChange={() => toggleSelect(user._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "admin" 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {user.role === "admin" ? <Shield className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.active 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.orders?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin-dashboard/users/${user._id}`)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(user._id, user.name)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {users.length === 0 
                ? "Get started by creating a new user." 
                : "Try adjusting your search or filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);
}