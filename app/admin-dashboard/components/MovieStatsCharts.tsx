'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/app/components/context/userContext';
import BarChart from './BarChart';
import MoviePieChart from './MoviePieChart';

interface MovieStat {
  movieId: string;
  title: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
}

interface OverallStat {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface StatsData {
  movieStats: MovieStat[];
  overall: OverallStat;
}

export default function MovieStatsCharts() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, loading: userLoading } = useUser();

  useEffect(() => {
    // Only fetch stats when we have a confirmed admin user
    if (!userLoading && user?.role === 'admin' && token) {
      fetchStats();
    } else if (!userLoading && user && user.role !== 'admin') {
      // User is logged in but not admin - show error immediately
      setError('Admin privileges required');
      setStatsLoading(false);
    } else if (!userLoading && !user) {
      // No user logged in
      setError('Authentication required');
      setStatsLoading(false);
    }
  }, [userLoading, user, token]);

  // useEffect(() => {
  //   if (stats) {
  //     console.log("Stats data received:", stats);
  //     console.log("Movie stats array:", stats.movieStats);
  //     console.log("Overall stats:", stats.overall);
  //   }
  // }, [stats]);

  const fetchStats = async () => {
    setStatsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/statistics/movies', {
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
      console.log("DATA",data)

      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const retryFetch = () => {
    fetchStats();
  };

  // Transform data for PieChart
  const pieChartData = stats?.movieStats.slice(0, 5).map((item, index) => ({
    label: item.title,
    value: item.totalRevenue,
    color: [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)'
    ][index]
  }));


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
  if (!stats || stats.movieStats.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg">No order data available yet</div>
      </div>
    );
  }

  // Success - show charts
  return (
    <div className="mb-8">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.overall.totalOrders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            ${stats.overall.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Avg Order Value</h3>
          <p className="text-2xl font-bold text-purple-600">
            ${stats.overall.averageOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border h-[31rem] w-full">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Most Ordered Movies (Quantity)
          </h3>
          <div className="h-80">
            <BarChart data={stats.movieStats.slice(0, 8)} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border w-fit">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Revenue Distribution
          </h3>
          <div className="h-96 w-90">
            <MoviePieChart data={stats.movieStats.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}