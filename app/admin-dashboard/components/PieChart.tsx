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
  data: any[];
}

export default function PieChart({ data }: PieChartProps) {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Count',
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color || 'rgba(99, 102, 241, 0.7)'),
        borderColor: data.map(item => item.color?.replace('0.7', '1') || 'rgba(99, 102, 241, 1)'),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}