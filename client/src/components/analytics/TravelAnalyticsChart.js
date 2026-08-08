import React, { useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { motion } from 'framer-motion';
import { FaChartLine, FaMapMarkedAlt, FaCalendarAlt } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const TravelAnalyticsChart = ({ trips = [] }) => {
  const [viewType, setViewType] = useState('timeline'); // timeline or destinations

  // Get trips over time
  const getTripsTimeline = () => {
    // Generate last 12 months
    const monthlyData = {};
    const now = new Date();
    
    // Initialize all 12 months with zero values
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthYear] = {
        count: 0,
        spending: 0,
      };
    }
    
    // Fill in actual trip data
    trips.forEach(trip => {
      const date = new Date(trip.createdAt || trip.startDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].count += 1;
        const tripCost = trip.itinerary?.totalCost?.amount || 
                        trip.preferences?.budget?.max || 
                        trip.preferences?.budget?.min || 0;
        monthlyData[monthYear].spending += tripCost;
      }
    });

    return Object.keys(monthlyData).map(key => ({
      month: key,
      ...monthlyData[key],
    }));
  };

  // Get all destinations
  const getTopDestinations = () => {
    const destinationCount = {};
    
    trips.forEach(trip => {
      const dest = trip.destination?.city || trip.title || 'Unknown';
      destinationCount[dest] = (destinationCount[dest] || 0) + 1;
    });

    return Object.entries(destinationCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  };

  // Generate dynamic colors for destinations
  const generateColors = (count) => {
    const baseColors = [
      { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
      { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
      { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 1)' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)' },
      { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' },
      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
      { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgba(251, 146, 60, 1)' },
      { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)' },
      { bg: 'rgba(244, 114, 182, 0.8)', border: 'rgba(244, 114, 182, 1)' },
      { bg: 'rgba(14, 165, 233, 0.8)', border: 'rgba(14, 165, 233, 1)' },
      { bg: 'rgba(132, 204, 22, 0.8)', border: 'rgba(132, 204, 22, 1)' },
    ];
    
    const colors = { backgrounds: [], borders: [] };
    for (let i = 0; i < count; i++) {
      const color = baseColors[i % baseColors.length];
      colors.backgrounds.push(color.bg);
      colors.borders.push(color.border);
    }
    return colors;
  };

  const timelineData = getTripsTimeline();
  const topDestinations = getTopDestinations();
  const colors = generateColors(topDestinations.length);

  // Timeline Chart Data
  const lineData = {
    labels: timelineData.map(d => d.month),
    datasets: [
      {
        label: 'Trips Count',
        data: timelineData.map(d => d.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Spending (₹)',
        data: timelineData.map(d => d.spending),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  // Destinations Pie Chart Data
  const doughnutData = {
    labels: topDestinations.map(d => d.name),
    datasets: [
      {
        label: 'Trips',
        data: topDestinations.map(d => d.count),
        backgroundColor: colors.backgrounds,
        borderColor: colors.borders,
        borderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Spending (₹)') {
                label += '₹' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Trips',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Spending (₹)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} trips (${percentage}%)`;
          },
        },
      },
    },
  };

  if (trips.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-gray-400 dark:text-gray-500">
          <FaChartLine className="h-12 w-12 mx-auto mb-3" />
          <p className="text-sm">No trip data available for analytics</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {viewType === 'timeline' ? (
            <FaCalendarAlt className="h-6 w-6 text-blue-600" />
          ) : (
            <FaMapMarkedAlt className="h-6 w-6 text-blue-600" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {viewType === 'timeline' ? 'Travel Timeline' : 'Top Destinations'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {viewType === 'timeline' ? 'Last 12 months' : 'Most visited places'}
            </p>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('timeline')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewType('destinations')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'destinations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Destinations
          </button>
        </div>
      </div>

      <div className="h-80">
        {viewType === 'timeline' ? (
          <Line data={lineData} options={lineOptions} />
        ) : (
          <Doughnut data={doughnutData} options={doughnutOptions} />
        )}
      </div>
    </motion.div>
  );
};

export default TravelAnalyticsChart;
