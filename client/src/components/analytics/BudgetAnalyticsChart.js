import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { motion } from 'framer-motion';
import { FaChartPie, FaChartBar } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const BudgetAnalyticsChart = ({ trips = [], viewType = 'pie' }) => {
  // Calculate total expenses by category from itinerary activities
  const calculateExpenseBreakdown = () => {
    const breakdown = {
      accommodation: 0,
      transport: 0,
      food: 0,
      activities: 0,
      other: 0,
    };

    trips.forEach(trip => {
      // Check if trip has itinerary with days and activities
      if (trip.itinerary && trip.itinerary.days) {
        trip.itinerary.days.forEach(day => {
          if (day.activities) {
            day.activities.forEach(activity => {
              const cost = activity.cost?.amount || 0;
              const type = activity.type?.toLowerCase() || '';

              if (type.includes('accommodation') || type.includes('hotel')) {
                breakdown.accommodation += cost;
              } else if (type.includes('transport') || type.includes('flight') || type.includes('train')) {
                breakdown.transport += cost;
              } else if (type.includes('restaurant') || type.includes('food') || type.includes('meal')) {
                breakdown.food += cost;
              } else if (type.includes('attraction') || type.includes('activity')) {
                breakdown.activities += cost;
              } else {
                breakdown.other += cost;
              }
            });
          }
        });
      } else if (trip.preferences?.budget) {
        // Fallback: estimate from budget if no detailed itinerary
        const budget = trip.preferences.budget.max || trip.preferences.budget.min || 0;
        breakdown.accommodation += budget * 0.35;
        breakdown.transport += budget * 0.25;
        breakdown.food += budget * 0.25;
        breakdown.activities += budget * 0.15;
      }
    });

    return breakdown;
  };

  // Calculate trip-wise spending
  const getTripWiseData = () => {
    return trips.slice(0, 10).map(trip => {
      const totalCost = trip.itinerary?.totalCost?.amount || 
                       trip.preferences?.budget?.max || 
                       trip.preferences?.budget?.min || 0;
      const destination = trip.destination?.city || trip.title || 'Unnamed Trip';
      
      return {
        name: destination,
        amount: totalCost,
      };
    });
  };

  const expenseBreakdown = calculateExpenseBreakdown();
  const tripWiseData = getTripWiseData();

  // Pie Chart Data
  const pieData = {
    labels: ['Accommodation', 'Transport', 'Food', 'Activities', 'Other'],
    datasets: [
      {
        label: 'Expenses',
        data: [
          expenseBreakdown.accommodation,
          expenseBreakdown.transport,
          expenseBreakdown.food,
          expenseBreakdown.activities,
          expenseBreakdown.other,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Orange
          'rgba(139, 92, 246, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Bar Chart Data
  const barData = {
    labels: tripWiseData.map(trip => trip.name),
    datasets: [
      {
        label: 'Trip Budget (₹)',
        data: tripWiseData.map(trip => trip.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Budget: ₹${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const totalExpenses = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0);

  if (trips.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-gray-400 dark:text-gray-500">
          <FaChartPie className="h-12 w-12 mx-auto mb-3" />
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
          {viewType === 'pie' ? (
            <FaChartPie className="h-6 w-6 text-blue-600" />
          ) : (
            <FaChartBar className="h-6 w-6 text-blue-600" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {viewType === 'pie' ? 'Expense Breakdown' : 'Past Trips Budget'}
            </h3>
            {viewType === 'pie' && totalExpenses > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: ₹{totalExpenses.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-80">
        {viewType === 'pie' ? (
          <Pie data={pieData} options={pieOptions} />
        ) : (
          <Bar data={barData} options={barOptions} />
        )}
      </div>
    </motion.div>
  );
};

export default BudgetAnalyticsChart;
