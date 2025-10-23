'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/app/components/context/userContext';
import BarChart from './BarChart';
import PieChart from './PieChart';

interface UserGrowthStat {
  _id: {
    year: number;
    month: number;
  };
  count: number;
}

interface RoleStat {
  _id: string;
  count: number;
}

interface StatusStat {
  _id: boolean;
  count: number;
}

interface TopUser {
  userId: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

interface OverallStats {
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  totalOrders: number;
}

interface StatsData {
  userGrowth: UserGrowthStat[];
  roleStats: RoleStat[];
  statusStats: StatusStat[];
  topUsers: TopUser[];
  overall: OverallStats;
}

export default function UserStatsCharts() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user?.role === 'admin' && token) {
      fetchStats();
    } else if (!userLoading && user && user.role !== 'admin') {
      setError('Admin privileges required');
      setStatsLoading(false);
    } else if (!userLoading && !user) {
      setError('Authentication required');
      setStatsLoading(false);
    }
  }, [userLoading, user, token]);

  const fetchStats = async () => {
    setStatsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized access - Admin privileges required');
        }
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      console.log("USER STATS DATA", data);
      setStats(data.statistics);
    } catch (err: any) {
      console.error('Error fetching user stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const retryFetch = () => {
    fetchStats();
  };

  // Format user growth data for chart
  const getUserGrowthData = () => {
    if (!stats?.userGrowth) return [];
    
    return stats.userGrowth.map(item => {
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: item.count
      };
    });
  };

  // Format role data for pie chart
  const getRoleData = () => {
    if (!stats?.roleStats) return [];
    
    return stats.roleStats.map(item => ({
      label: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: item._id === 'admin' ? 'rgba(139, 92, 246, 0.7)' : 'rgba(59, 130, 246, 0.7)'
    }));
  };

  // Format status data for pie chart
  const getStatusData = () => {
    if (!stats?.statusStats) return [];
    
    return stats.statusStats.map(item => ({
      label: item._id ? 'Active' : 'Inactive',
      value: item.count,
      color: item._id ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
    }));
  };

  // Show loading while checking user auth OR fetching stats
  if (userLoading || (user?.role === 'admin' && statsLoading)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">
          {userLoading ? 'Loading user...' : 'Loading statistics...'}
        </div>
      </div>
    );
  }

  // Show error if not admin or other errors
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="text-red-600 text-lg text-center">{error}</div>
        {user?.role === 'admin' && (
          <button
            onClick={retryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Show message if no data but user is admin
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg">No user data available yet</div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.overall.totalUsers}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Active Users</h3>
          <p className="text-2xl font-bold text-green-600">{stats.overall.activeUsers}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Admins</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.overall.totalAdmins}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800">Total Orders</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.overall.totalOrders}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow border lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            User Growth (Last 12 Months)
          </h3>
          <BarChart 
            data={getUserGrowthData()} 
            label="New Users"
            backgroundColor="rgba(59, 130, 246, 0.7)"
          />
        </div>
        
        {/* Role Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Role Distribution
          </h3>
          <PieChart data={getRoleData()} />
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Status Distribution
          </h3>
          <PieChart data={getStatusData()} />
        </div>

        {/* Top Users by Orders */}
        <div className="bg-white p-6 rounded-lg shadow border lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Top Users by Orders
          </h3>
          <div className="space-y-3">
            {stats.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{user.totalOrders} orders</div>
                  <div className="text-sm text-gray-500">${user.totalSpent.toFixed(2)} spent</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}