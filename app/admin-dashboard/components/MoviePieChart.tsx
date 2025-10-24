'use client';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: Array<{
    movieId: string;
    title: string;
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export default function MoviePieChart({ data }: PieChartProps) {
  // Transform the data for the pie chart
  const chartData = {
    labels: data.map(item => item.title),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.totalRevenue),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#7CFFB2', '#F465C5'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#7CFFB2', '#F465C5'
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}