'use client';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Title);

interface Coupon {
  _id: string;
  code: string;
  price: number;
  isPercentage: boolean;
  minQuantity: number;
  minSubtotal: number;
  minOrderCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

interface CouponsStatsChartsProps {
  coupons: Coupon[];
}

export default function CouponsStatsCharts({ coupons }: CouponsStatsChartsProps) {
  // Calculate stats from existing coupons data (no API needed!)
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.active && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length;
  const expiredCoupons = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
  const inactiveCoupons = coupons.filter(c => !c.active).length;
  
  const percentageCoupons = coupons.filter(c => c.isPercentage).length;
  const fixedCoupons = coupons.filter(c => !c.isPercentage).length;

  // Status distribution for pie chart
  const statusData = {
    labels: ['Active', 'Expired', 'Inactive'],
    datasets: [
      {
        data: [activeCoupons, expiredCoupons, inactiveCoupons],
        backgroundColor: ['#10B981', '#EF4444', '#6B7280'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Type distribution for bar chart
  const typeData = {
    labels: ['Percentage', 'Fixed Amount'],
    datasets: [
      {
        label: 'Count',
        data: [percentageCoupons, fixedCoupons],
        backgroundColor: ['#3B82F6', '#8B5CF6'],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (coupons.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-500">
        No coupon data available yet
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Coupons</h3>
          <p className="text-2xl font-bold text-blue-600">{totalCoupons}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Active Coupons</h3>
          <p className="text-2xl font-bold text-green-600">{activeCoupons}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-sm font-medium text-red-800">Expired Coupons</h3>
          <p className="text-2xl font-bold text-red-600">{expiredCoupons}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Percentage Type</h3>
          <p className="text-2xl font-bold text-purple-600">{percentageCoupons}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Coupon Status Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <Pie data={statusData} options={pieOptions} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Discount Type Distribution
          </h3>
          <div style={{ height: '300px' }}>
            {/* Using Bar chart for type distribution */}
            {/* You might want to install react-chartjs-2 if not already */}
            {/* For now, let's show a simple count */}
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {percentageCoupons} : {fixedCoupons}
                </div>
                <div className="text-sm text-gray-600">
                  Percentage : Fixed Amount
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}