import React from 'react';
import { motion } from 'framer-motion';
import {
  FaMapMarkedAlt,
  FaRoad,
  FaClock,
  FaDollarSign,
  FaCity,
  FaHotel,
  FaRoute,
  FaChartLine,
  FaMoon,
  FaSun,
  FaUtensils,
} from 'react-icons/fa';

const TravelInsightsDashboard = ({ trip }) => {
  // Calculate insights from trip data
  const calculateInsights = () => {
    const itinerary = trip.itinerary || [];
    const duration = trip.duration || itinerary.length;
    
    // Calculate total distance
    let totalDistance = 0;
    if (trip.totalDistance) {
      totalDistance = trip.totalDistance;
    } else {
      // Estimate based on destination type
      const destination = (trip.destination?.city || trip.destination || '').toLowerCase();
      if (/international|foreign/.test(destination)) totalDistance = 3000;
      else if (/leh|ladakh|kashmir/.test(destination)) totalDistance = 1500;
      else if (/goa|kerala|andaman/.test(destination)) totalDistance = 2000;
      else totalDistance = 800;
    }

    // Calculate cities/places
    const cities = new Set();
    itinerary.forEach(day => {
      if (day.location || day.place || day.city) {
        cities.add(day.location || day.place || day.city);
      }
      if (day.activities) {
        day.activities.forEach(activity => {
          if (activity.location) cities.add(activity.location);
        });
      }
    });

    // Calculate travel hours
    const avgTravelHoursPerDay = trip.transportation === 'flight' ? 3 : 
                                  trip.transportation === 'train' ? 6 :
                                  trip.transportation === 'car' ? 8 : 5;
    const totalTravelHours = Math.round(avgTravelHoursPerDay * (duration * 0.3));

    // Calculate accommodations
    const accommodations = duration - 1; // nights

    // Budget usage
    const getBudgetValue = () => {
      if (!trip.budget) return 50000;
      if (typeof trip.budget === 'number') return trip.budget;
      if (trip.budget.max) return trip.budget.max;
      if (trip.budget.min) return trip.budget.min;
      return 50000;
    };
    
    const budget = getBudgetValue();
    const estimatedCost = trip.totalCost || trip.estimatedCost || budget * 0.85;
    const budgetUsage = isNaN(budget) || budget === 0 ? 0 : Math.round((estimatedCost / budget) * 100);

    // Day vs Night activities
    let dayActivities = 0;
    let nightActivities = 0;
    let foodExperiences = 0;

    itinerary.forEach(day => {
      if (day.activities) {
        day.activities.forEach(activity => {
          const activityText = (activity.activity || activity).toLowerCase();
          if (/night|evening|sunset|dinner|club|bar/.test(activityText)) {
            nightActivities++;
          } else {
            dayActivities++;
          }
          if (/food|restaurant|cafe|dining|cuisine|breakfast|lunch|dinner/.test(activityText)) {
            foodExperiences++;
          }
        });
      }
    });

    const activityBalance = dayActivities > nightActivities * 2 ? 'Day-focused' :
                           nightActivities > dayActivities * 2 ? 'Night-focused' :
                           'Balanced';

    return {
      totalDistance,
      citiesVisited: Math.max(cities.size, 1),
      totalTravelHours,
      accommodations,
      budgetUsage,
      budget,
      estimatedCost,
      dayActivities,
      nightActivities,
      activityBalance,
      foodExperiences,
      avgActivitiesPerDay: Math.round((dayActivities + nightActivities) / duration),
    };
  };

  const insights = calculateInsights();

  const formatDistance = (km) => {
    if (km >= 1000) return `${(km / 1000).toFixed(1)}K km`;
    return `${km} km`;
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const getBudgetColor = (usage) => {
    if (usage <= 80) return 'green';
    if (usage <= 95) return 'yellow';
    return 'red';
  };

  const getActivityBalanceEmoji = (balance) => {
    if (balance === 'Day-focused') return '☀️';
    if (balance === 'Night-focused') return '🌙';
    return '⚖️';
  };

  const stats = [
    {
      label: 'Total Distance',
      value: formatDistance(insights.totalDistance),
      icon: FaRoad,
      color: 'blue',
      subtext: 'Estimated travel distance',
    },
    {
      label: 'Cities Visited',
      value: insights.citiesVisited,
      icon: FaCity,
      color: 'purple',
      subtext: `${insights.citiesVisited} unique location${insights.citiesVisited > 1 ? 's' : ''}`,
    },
    {
      label: 'Travel Hours',
      value: `${insights.totalTravelHours}h`,
      icon: FaClock,
      color: 'orange',
      subtext: 'Total time in transit',
    },
    {
      label: 'Accommodations',
      value: `${insights.accommodations} nights`,
      icon: FaHotel,
      color: 'green',
      subtext: 'Hotel stays included',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <FaChartLine className="text-3xl text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Travel Insights Dashboard</h2>
            <p className="text-blue-100 text-sm">Comprehensive trip analytics & statistics</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/30 dark:to-${stat.color}-800/30 rounded-lg p-4 border-2 border-${stat.color}-200 dark:border-${stat.color}-700`}
            >
              <Icon className={`text-2xl text-${stat.color}-600 dark:text-${stat.color}-400 mb-2`} />
              <div className={`text-3xl font-bold text-${stat.color}-900 dark:text-${stat.color}-100 mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {stat.subtext}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Budget Usage */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-6 pb-6"
      >
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaDollarSign className="text-2xl text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Usage</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {insights.budgetUsage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {formatCurrency(insights.estimatedCost)} / {formatCurrency(insights.budget)}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(insights.budgetUsage, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full bg-gradient-to-r ${
                getBudgetColor(insights.budgetUsage) === 'green' ? 'from-green-400 to-green-600' :
                getBudgetColor(insights.budgetUsage) === 'yellow' ? 'from-yellow-400 to-yellow-600' :
                'from-red-400 to-red-600'
              } flex items-center justify-center`}
            >
              {insights.budgetUsage > 15 && (
                <span className="text-xs font-bold text-white">
                  {insights.budgetUsage}% Used
                </span>
              )}
            </motion.div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {insights.budgetUsage <= 80 && '✅ Well within budget!'}
            {insights.budgetUsage > 80 && insights.budgetUsage <= 95 && '⚠️ Close to budget limit'}
            {insights.budgetUsage > 95 && '❌ Over budget - consider adjustments'}
          </div>
        </div>
      </motion.div>

      {/* Activity Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-6 pb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activity Balance */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-2 mb-2">
              {insights.activityBalance === 'Day-focused' ? <FaSun className="text-2xl text-yellow-500" /> : 
               insights.activityBalance === 'Night-focused' ? <FaMoon className="text-2xl text-indigo-500" /> :
               <FaRoute className="text-2xl text-purple-500" />}
              <h4 className="font-bold text-gray-900 dark:text-white">Activity Balance</h4>
            </div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-1">
              {getActivityBalanceEmoji(insights.activityBalance)} {insights.activityBalance}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {insights.dayActivities} day • {insights.nightActivities} night activities
            </div>
          </div>

          {/* Food Experiences */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-2 mb-2">
              <FaUtensils className="text-2xl text-orange-600 dark:text-orange-400" />
              <h4 className="font-bold text-gray-900 dark:text-white">Food Experiences</h4>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
              {insights.foodExperiences} meals
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Culinary adventures included
            </div>
          </div>

          {/* Activities Per Day */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <FaMapMarkedAlt className="text-2xl text-green-600 dark:text-green-400" />
              <h4 className="font-bold text-gray-900 dark:text-white">Trip Pace</h4>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
              {insights.avgActivitiesPerDay} per day
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {insights.avgActivitiesPerDay <= 2 ? 'Relaxed pace 🌴' :
               insights.avgActivitiesPerDay <= 4 ? 'Moderate pace 🚶' :
               'Fast-paced ⚡'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-b-xl border-t border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
          📊 <strong>Trip Summary:</strong> A {insights.activityBalance.toLowerCase()} {trip.duration || (trip.itinerary?.length || 7)}-day journey covering{' '}
          {formatDistance(insights.totalDistance)} across {insights.citiesVisited} destination{insights.citiesVisited > 1 ? 's' : ''}
        </p>
      </div>
    </motion.div>
  );
};

export default TravelInsightsDashboard;
