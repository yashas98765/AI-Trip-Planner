import React from 'react';
import { motion } from 'framer-motion';
import {
  FaSpa,
  FaMountain,
  FaDollarSign,
  FaLandmark,
  FaUtensils,
  FaLeaf,
  FaStar,
} from 'react-icons/fa';
import { calculateAllScores, getTripCompatibility } from '../../utils/tripScoreCalculator';

const TripScoreCard = ({ trip }) => {
  const scores = calculateAllScores(trip);
  const compatibility = getTripCompatibility(scores);

  const scoreItems = [
    {
      label: 'Relaxation Score',
      value: scores.relaxation,
      icon: FaSpa,
      color: 'blue',
      unit: '%',
    },
    {
      label: 'Adventure Level',
      value: scores.adventure.level,
      icon: FaMountain,
      color: 'orange',
      badge: scores.adventure.icon,
    },
    {
      label: 'Budget Fit',
      value: scores.budgetFit.fit,
      icon: FaDollarSign,
      color: scores.budgetFit.color,
      badge: scores.budgetFit.icon,
    },
    {
      label: 'Cultural Immersion',
      value: scores.culture,
      icon: FaLandmark,
      color: 'purple',
      unit: '%',
    },
    {
      label: 'Food Experience',
      value: scores.food,
      icon: FaUtensils,
      color: 'red',
      unit: '%',
    },
    {
      label: 'Sustainability',
      value: scores.sustainability,
      icon: FaLeaf,
      color: 'green',
      unit: '%',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[color] || colors.gray;
  };

  const getProgressColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      gray: 'bg-gray-500',
    };
    return colors[color] || colors.gray;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      {/* Overall Compatibility */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaStar className={`text-2xl text-${compatibility.color}-500`} />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trip Compatibility Score
          </h3>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl">{compatibility.emoji}</span>
          <span className={`text-xl font-semibold ${getColorClasses(compatibility.color)}`}>
            {compatibility.rating}
          </span>
        </div>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scoreItems.map((item, index) => {
          const Icon = item.icon;
          const showProgress = typeof item.value === 'number';
          
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`text-xl text-${item.color}-500`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </div>
              
              {showProgress ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.value}{item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${getProgressColor(item.color)}`}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                  {item.badge && (
                    <span className="text-2xl">{item.badge}</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          Quick Insights
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {scores.relaxation >= 70 && (
            <li>✨ Perfect trip for relaxation and unwinding</li>
          )}
          {scores.adventure.score >= 40 && (
            <li>🏔️ Great for adventure seekers and thrill-lovers</li>
          )}
          {scores.budgetFit.fit === 'Excellent' && (
            <li>💰 Excellent value for money - well within budget</li>
          )}
          {scores.culture >= 60 && (
            <li>🏛️ Rich cultural and historical experiences await</li>
          )}
          {scores.food >= 70 && (
            <li>🍜 Amazing culinary adventures included</li>
          )}
          {scores.sustainability >= 70 && (
            <li>🌱 Eco-friendly and sustainable travel choices</li>
          )}
          {scores.relaxation < 40 && scores.adventure.score < 30 && (
            <li>⚡ Fast-paced itinerary - consider adding rest time</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
};

export default TripScoreCard;
