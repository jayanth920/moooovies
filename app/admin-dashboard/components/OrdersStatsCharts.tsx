'use client';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/app/components/context/userContext';
import BarChart from './BarChart';
import PieChart from './PieChart';

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

interface CouponUsage {
    code: string;
    count: number;
    totalDiscount: number;
}

interface OrderStats {
    monthlyRevenue: MonthlyRevenue[];
    couponUsage: CouponUsage[];
}

export default function OrdersStatsCharts() {
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, token, loading: userLoading } = useUser();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!userLoading && user?.role === 'admin' && token && !hasFetched.current) {
            hasFetched.current = true;
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
            const response = await fetch('/api/admin/orders/stats', {
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
            setStats(data.stats);
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

    if (userLoading || (user?.role === 'admin' && statsLoading)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">
                    {userLoading ? 'Loading user...' : 'Loading statistics...'}
                </div>
            </div>
        );
    }

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

    if (!stats || (!stats.monthlyRevenue?.length && !stats.couponUsage?.length)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-lg">No order statistics available yet</div>
            </div>
        );
    }

// Prepare data for charts
const revenueChartData = stats.monthlyRevenue?.map(item => ({
  label: item.month,
  value: item.revenue
})) || [];

// Use fixed colors 
const couponChartData = stats.couponUsage?.slice(0, 5).map((item, index) => {
  const fixedColors = [
    'rgba(139, 92, 246, 0.7)',  // purple
    'rgba(59, 130, 246, 0.7)',  // blue  
    'rgba(16, 185, 129, 0.7)',  // green
    'rgba(245, 158, 11, 0.7)',  // amber
    'rgba(239, 68, 68, 0.7)',   // red
  ];
  
  return {
    label: item.code,
    value: item.count,
    color: fixedColors[index % fixedColors.length]
  };
}) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Revenue Chart */}
            {revenueChartData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Monthly Revenue
                    </h3>
                    <div className="h-64">
                        <BarChart
                            data={revenueChartData}
                            label="Revenue ($)"
                            backgroundColor="rgba(59, 130, 246, 0.7)"
                        />
                    </div>
                </div>
            )}

            {/* Coupon Usage Chart */}
            {couponChartData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Top Coupons
                    </h3>
                    <div className="h-64">
                        <PieChart data={couponChartData} />
                    </div>
                </div>
            )}
        </div>
    );
}