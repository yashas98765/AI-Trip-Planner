import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import { FaRupeeSign, FaHotel, FaCar, FaUtensils, FaTicketAlt } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend);

const SmartBudgetBreakdown = ({ itinerary, onUpdateBreakdown }) => {
  // Auto-calculate budget breakdown from itinerary
  const calculateBudgetBreakdown = () => {
    if (!itinerary || !itinerary.days) {
      return {
        accommodation: 0,
        transport: 0,
        food: 0,
        activities: 0,
      };
    }

    const breakdown = {
      accommodation: 0,
      transport: 0,
      food: 0,
      activities: 0,
    };

    // Process each day's activities and extract costs
    itinerary.days.forEach(day => {
      if (!day.activities) return;

      day.activities.forEach(activity => {
        const activityType = activity.type?.toLowerCase() || '';
        // Use actual cost from activity if available, otherwise use estimatedCost
        const cost = activity.cost?.amount || activity.estimatedCost || 0;

        if (activityType.includes('accommodation') || activityType.includes('hotel')) {
          breakdown.accommodation += cost;
        } else if (activityType.includes('transport') || activityType.includes('flight') || activityType.includes('train') || activityType.includes('travel')) {
          breakdown.transport += cost;
        } else if (activityType.includes('restaurant') || activityType.includes('food') || activityType.includes('meal') || activityType.includes('dining')) {
          breakdown.food += cost;
        } else if (activityType.includes('attraction') || activityType.includes('activity') || activityType.includes('sightseeing') || activityType.includes('visit')) {
          breakdown.activities += cost;
        } else if (cost > 0) {
          // If type not specified but has cost, add to activities
          breakdown.activities += cost;
        }
      });
    });

    // If breakdown is all zeros, provide estimates based on itinerary total cost
    const totalFromBreakdown = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    if (totalFromBreakdown === 0 && itinerary.totalCost?.amount) {
      const total = itinerary.totalCost.amount;
      breakdown.accommodation = total * 0.35;
      breakdown.transport = total * 0.25;
      breakdown.food = total * 0.25;
      breakdown.activities = total * 0.15;
    } else if (totalFromBreakdown === 0) {
      // Fallback estimates based on days
      const days = itinerary.days.length;
      breakdown.accommodation = days * 3000;
      breakdown.transport = 5000;
      breakdown.food = days * 1000;
      breakdown.activities = days * 500;
    }

    return breakdown;
  };

  const breakdown = calculateBudgetBreakdown();
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  const chartData = {
    labels: ['Accommodation', 'Transport', 'Food', 'Activities'],
    datasets: [
      {
        label: 'Budget (₹)',
        data: [
          breakdown.accommodation,
          breakdown.transport,
          breakdown.food,
          breakdown.activities,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Orange
          'rgba(139, 92, 246, 0.8)',   // Purple
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
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
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const categories = [
    { name: 'Accommodation', amount: breakdown.accommodation, icon: FaHotel, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Transport', amount: breakdown.transport, icon: FaCar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { name: 'Food', amount: breakdown.food, icon: FaUtensils, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { name: 'Activities', amount: breakdown.activities, icon: FaTicketAlt, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <FaRupeeSign className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Budget Breakdown</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Auto-calculated from your itinerary</p>
        </div>
      </div>

      {/* Total Budget */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Total Cost</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <FaRupeeSign className="text-2xl" />
          {total.toLocaleString()}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {categories.map((category) => (
          <div
            key={category.name}
            className={`${category.bg} rounded-lg p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <category.icon className={`h-5 w-5 ${category.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.name}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
              <FaRupeeSign className="text-base" />
              {category.amount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {((category.amount / total) * 100).toFixed(1)}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <Pie data={chartData} options={chartOptions} />
      </div>

      {/* Note */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 This is an estimated breakdown based on your itinerary. Actual costs may vary.
        </p>
      </div>
    </motion.div>
  );
};

export default SmartBudgetBreakdown;
