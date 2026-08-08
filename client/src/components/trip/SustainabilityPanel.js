import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaLeaf,
  FaTrain,
  FaBus,
  FaBicycle,
  FaWalking,
  FaPlane,
  FaCar,
  FaHotel,
  FaHome,
  FaTree,
  FaRecycle,
  FaSeedling,
  FaLightbulb,
  FaWater,
  FaSun,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

const SustainabilityPanel = ({ trip }) => {
  const [showTips, setShowTips] = useState(false);

  // Calculate carbon footprint (rough estimates in kg CO2)
  const calculateCarbonFootprint = () => {
    let totalCarbon = 0;
    const transport = trip.transport || trip.transportation || 'car';
    const duration = trip.duration || 7;
    const destination = (trip.destination || '').toLowerCase();

    // Transport emissions (per person per day)
    const transportEmissions = {
      flight: 150, // International/long distance
      domesticFlight: 90,
      train: 10,
      bus: 15,
      car: 50,
      bike: 0,
      walk: 0,
    };

    // Check if international destination
    const internationalDests = ['thailand', 'singapore', 'dubai', 'bali', 'maldives', 'nepal', 'bhutan', 'sri lanka'];
    const isInternational = internationalDests.some(dest => destination.includes(dest));

    // Calculate transport emissions
    if (transport === 'flight') {
      totalCarbon += isInternational ? transportEmissions.flight * duration : transportEmissions.domesticFlight * duration;
    } else {
      totalCarbon += (transportEmissions[transport] || transportEmissions.car) * duration;
    }

    // Accommodation emissions (per night)
    const accommodationType = trip.accommodation || trip.accommodationType || 'hotel';
    const accommodationEmissions = {
      hotel: 20,
      resort: 30,
      hostel: 10,
      homestay: 8,
      eco: 5,
      camping: 2,
    };
    totalCarbon += (accommodationEmissions[accommodationType] || 20) * duration;

    // Activity emissions (rough estimate)
    const activities = trip.activities || [];
    const highCarbonActivities = ['jet ski', 'atv', 'helicopter', 'motor', 'cruise'];
    const activityEmissions = activities.filter(activity => 
      highCarbonActivities.some(keyword => activity.toLowerCase().includes(keyword))
    ).length * 30;
    totalCarbon += activityEmissions;

    return Math.round(totalCarbon);
  };

  // Calculate sustainability score (0-100)
  const calculateSustainabilityMetrics = () => {
    let score = 50;
    const factors = [];

    const transport = trip.transport || trip.transportation || 'car';
    const accommodation = trip.accommodation || trip.accommodationType || 'hotel';
    const destination = (trip.destination || '').toLowerCase();

    // Transport score
    if (['train', 'bus', 'bike', 'walk'].includes(transport)) {
      score += 20;
      factors.push({ type: 'positive', text: `Eco-friendly ${transport} transport`, icon: FaTrain });
    } else if (transport === 'flight') {
      score -= 15;
      factors.push({ type: 'negative', text: 'Air travel has high carbon impact', icon: FaPlane });
    } else if (transport === 'car') {
      score -= 5;
      factors.push({ type: 'neutral', text: 'Consider carpooling or public transport', icon: FaCar });
    }

    // Accommodation score
    if (['eco', 'homestay', 'camping'].includes(accommodation)) {
      score += 15;
      factors.push({ type: 'positive', text: 'Eco-friendly accommodation choice', icon: FaHome });
    } else if (['resort', 'luxury'].includes(accommodation)) {
      score -= 10;
      factors.push({ type: 'negative', text: 'Resorts typically have higher environmental impact', icon: FaHotel });
    }

    // Nature-based destinations
    const natureDests = ['kerala', 'coorg', 'munnar', 'wayanad', 'rishikesh', 'manali', 'spiti', 'meghalaya'];
    if (natureDests.some(dest => destination.includes(dest))) {
      score += 10;
      factors.push({ type: 'positive', text: 'Nature-based destination supports conservation', icon: FaTree });
    }

    // Urban destinations (potential for eco-activities)
    const urbanDests = ['mumbai', 'delhi', 'bangalore', 'chennai'];
    if (urbanDests.some(dest => destination.includes(dest))) {
      factors.push({ type: 'neutral', text: 'Urban areas offer public transport options', icon: FaBus });
    }

    // Check for eco-activities in interests
    const interests = trip.interests || [];
    if (interests.includes('nature') || interests.includes('wildlife') || interests.includes('hiking')) {
      score += 10;
      factors.push({ type: 'positive', text: 'Nature-focused activities promote awareness', icon: FaSeedling });
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      carbonFootprint: calculateCarbonFootprint(),
    };
  };

  const metrics = calculateSustainabilityMetrics();

  // Get sustainability rating
  const getSustainabilityRating = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', emoji: '🌟' };
    if (score >= 65) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', emoji: '👍' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', emoji: '😊' };
    if (score >= 35) return { label: 'Needs Improvement', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', emoji: '⚠️' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', emoji: '❌' };
  };

  const rating = getSustainabilityRating(metrics.score);

  // Get carbon equivalent comparisons
  const getCarbonComparison = (kg) => {
    const treesNeeded = Math.round(kg / 20); // 1 tree absorbs ~20kg CO2/year
    const kmDriven = Math.round(kg / 0.12); // Average car emits 0.12kg CO2/km
    return { treesNeeded, kmDriven };
  };

  const carbonComparison = getCarbonComparison(metrics.carbonFootprint);

  // Eco-friendly recommendations
  const recommendations = [
    {
      icon: FaTrain,
      title: 'Choose Green Transport',
      description: 'Use trains and buses instead of flights when possible. They emit up to 75% less CO2.',
      impact: 'High',
    },
    {
      icon: FaHome,
      title: 'Stay Local',
      description: 'Choose homestays or eco-certified accommodations that support local communities.',
      impact: 'Medium',
    },
    {
      icon: FaRecycle,
      title: 'Reduce Waste',
      description: 'Carry reusable water bottles, bags, and avoid single-use plastics during your trip.',
      impact: 'Medium',
    },
    {
      icon: FaSeedling,
      title: 'Support Conservation',
      description: 'Participate in eco-tours and activities that contribute to local conservation efforts.',
      impact: 'High',
    },
    {
      icon: FaWater,
      title: 'Conserve Resources',
      description: 'Be mindful of water and energy usage in accommodations, especially in water-scarce areas.',
      impact: 'Medium',
    },
    {
      icon: FaSun,
      title: 'Travel Off-Peak',
      description: 'Visit during off-season to reduce overtourism and enjoy better prices.',
      impact: 'Low',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaLeaf className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Sustainability Score</h2>
              <p className="text-green-100 text-sm">Environmental impact analysis</p>
            </div>
          </div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FaInfoCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="text-green-500"
                  initial={{ strokeDashoffset: 352 }}
                  animate={{ strokeDashoffset: 352 - (352 * metrics.score) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ strokeDasharray: 352 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.score}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">/ 100</span>
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center space-x-2 px-4 py-2 ${rating.bgColor} rounded-full`}>
            <span className="text-2xl">{rating.emoji}</span>
            <span className={`font-semibold ${rating.color}`}>{rating.label}</span>
          </div>
        </div>

        {/* Carbon Footprint */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Carbon Footprint
            </h3>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.carbonFootprint} kg CO₂
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <FaTree className="h-4 w-4 text-green-600" />
              <span>Equivalent to {carbonComparison.treesNeeded} trees needed for 1 year to offset</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaCar className="h-4 w-4 text-blue-600" />
              <span>Same as driving {carbonComparison.kmDriven} km in a car</span>
            </div>
          </div>
        </div>

        {/* Factors */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Impact Factors
          </h3>
          <div className="space-y-2">
            {metrics.factors.map((factor, index) => {
              const Icon = factor.icon;
              const colorMap = {
                positive: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                negative: 'text-red-600 bg-red-100 dark:bg-red-900/30',
                neutral: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
              };
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className={`p-2 ${colorMap[factor.type]} rounded-lg`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {factor.text}
                  </span>
                  {factor.type === 'positive' && <FaCheckCircle className="h-4 w-4 text-green-600" />}
                  {factor.type === 'negative' && <FaExclamationTriangle className="h-4 w-4 text-red-600" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              <FaLightbulb className="inline h-5 w-5 text-yellow-500 mr-2" />
              Eco-Friendly Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                const impactColors = {
                  High: 'bg-green-500',
                  Medium: 'bg-yellow-500',
                  Low: 'bg-gray-500',
                };
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-start space-x-3 mb-2">
                      <div className="p-2 bg-green-500 text-white rounded-lg">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          {rec.title}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 ${impactColors[rec.impact]} text-white text-xs rounded-full mb-2`}>
                          {rec.impact} Impact
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-11">
                      {rec.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-start space-x-3">
            <FaSeedling className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                Offset Your Carbon Footprint
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Consider donating to carbon offset programs or tree planting initiatives to neutralize your trip's impact.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors">
                  Plant {carbonComparison.treesNeeded} Trees
                </button>
                <button className="px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg border border-gray-300 dark:border-gray-600 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SustainabilityPanel;
