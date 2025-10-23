'use client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: any[];
  label?: string;
  backgroundColor?: string;
}

export default function BarChart({ data, label = "Value", backgroundColor = "rgba(59, 130, 246, 0.7)" }: BarChartProps) {
  const chartData = {
    labels: data.map(item => item.label || item.title),
    datasets: [
      {
        label: label,
        data: data.map(item => item.count || item.value || item.totalQuantity || item.totalOrders || item.totalRevenue),
        backgroundColor: backgroundColor,
        borderColor: backgroundColor.replace('0.7', '1'),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: {
      duration: 0 // Disable animations
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}