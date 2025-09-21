'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  description: string;
}

interface ChartProps {
  chartData: ChartData;
  className?: string;
}

export function Chart({ chartData, className = '' }: ChartProps) {
  const { type, title, data, description } = chartData;

  // Convert data to Chart.js format
  const chartConfig = {
    labels: data.map(item => item.label),
    datasets: [{
      label: title,
      data: data.map(item => item.value),
      backgroundColor: data.map(item => item.color || '#3B82F6'),
      borderColor: data.map(item => item.color || '#3B82F6'),
      borderWidth: type === 'pie' ? 0 : 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151', // gray-700
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: title,
        color: '#111827', // gray-900
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || context.parsed;
            return `${context.label}: $${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: type !== 'pie' ? {
      x: {
        grid: {
          color: '#E5E7EB', // gray-200
        },
        ticks: {
          color: '#374151', // gray-700
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#E5E7EB', // gray-200
        },
        ticks: {
          color: '#374151', // gray-700
          font: {
            size: 11
          },
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      }
    } : undefined
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartConfig} options={options} />;
      case 'bar':
        return <Bar data={chartConfig} options={options} />;
      case 'pie':
        return <Pie data={chartConfig} options={options} />;
      default:
        return <div className="text-gray-500 text-center py-8">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="mb-2">
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="h-64 w-full">
        {renderChart()}
      </div>
    </div>
  );
}

// Component for rendering multiple charts (comprehensive analysis)
interface ComprehensiveChartProps {
  analysisData: {
    monthlyTrend: ChartData;
    vendorBreakdown: ChartData;
    spendingDistribution: ChartData;
    summary: {
      totalSpending: number;
      totalTransactions: number;
      averageTransaction: number;
      topVendor: string;
      topVendorAmount: number;
    };
  };
  className?: string;
}

export function ComprehensiveChart({ analysisData, className = '' }: ComprehensiveChartProps) {
  const { monthlyTrend, vendorBreakdown, spendingDistribution, summary } = analysisData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Spending Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${summary.totalSpending.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Spending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.totalTransactions}</div>
            <div className="text-sm text-gray-600">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${summary.averageTransaction.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{summary.topVendor}</div>
            <div className="text-sm text-gray-600">Top Vendor (${summary.topVendorAmount.toFixed(2)})</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart chartData={monthlyTrend} />
        <Chart chartData={vendorBreakdown} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart chartData={spendingDistribution} />
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>• Your top spending category is <strong>{summary.topVendor}</strong> with ${summary.topVendorAmount.toFixed(2)}</p>
            <p>• Average transaction size is ${summary.averageTransaction.toFixed(2)}</p>
            <p>• You have {summary.totalTransactions} total transactions recorded</p>
            <p>• Monthly trends show your spending patterns over time</p>
          </div>
        </div>
      </div>
    </div>
  );
}