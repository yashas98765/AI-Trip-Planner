import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaMagic,
  FaHeart,
  FaChartLine,
  FaMapMarkedAlt,
  FaRupeeSign,
  FaCalendarAlt,
  FaSpinner,
  FaPlus,
} from 'react-icons/fa';
import { aiAPI, tripAPI } from '../../services/api';

// Helper functions outside component to avoid dependency issues
const getSimilarDestinations = (favorites) => {
  const similarityMap = {
    'Goa': ['Pondicherry', 'Kerala', 'Andaman', 'Gokarna'],
    'Kerala': ['Coorg', 'Munnar', 'Wayanad', 'Ooty'],
    'Rajasthan': ['Gujarat', 'Madhya Pradesh', 'Agra', 'Delhi'],
    'Himachal Pradesh': ['Uttarakhand', 'Kashmir', 'Sikkim', 'Arunachal Pradesh'],
    'Delhi': ['Agra', 'Jaipur', 'Chandigarh', 'Amritsar'],
  };

  const similar = new Set();
  favorites.forEach(fav => {
    const key = Object.keys(similarityMap).find(k => fav.includes(k));
    if (key && similarityMap[key]) {
      similarityMap[key].forEach(dest => similar.add(dest));
    }
  });

  return Array.from(similar).slice(0, 4);
};

const getDurationBasedDestinations = (days) => {
  if (days <= 3) {
    return ['Pondicherry', 'Jaipur', 'Agra', 'Mussoorie'];
  } else if (days <= 7) {
    return ['Goa', 'Kerala', 'Rajasthan', 'Himachal Pradesh'];
  } else {
    return ['Kashmir', 'Ladakh', 'Northeast India', 'South India Tour'];
  }
};

const analyzeUserPattern = (trips) => {
  if (!trips || trips.length === 0) {
    return {
      avgBudget: 0,
      favoriteDestinations: [],
      preferredDuration: 0,
      travelStyle: 'explorer',
      budgetRange: 'medium',
    };
  }

  // Calculate average budget from actual trip costs
  const budgets = trips.map(t => {
    return t.itinerary?.totalCost?.amount || 
           t.preferences?.budget?.max || 
           t.preferences?.budget?.min || 0;
  }).filter(b => b > 0);
  const avgBudget = budgets.length > 0 ? budgets.reduce((a, b) => a + b, 0) / budgets.length : 0;

  // Find favorite destinations
  const destCount = {};
  trips.forEach(trip => {
    const dest = trip.destination?.city || trip.title || '';
    if (dest) {
      destCount[dest] = (destCount[dest] || 0) + 1;
    }
  });
  const favoriteDestinations = Object.entries(destCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dest]) => dest);

  // Calculate preferred duration
  const durations = trips.map(t => {
    if (t.startDate && t.endDate) {
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    return t.preferences?.duration || 0;
  }).filter(d => d > 0);
  const preferredDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 3;

  // Determine budget range
  let budgetRange = 'medium';
  if (avgBudget < 10000) budgetRange = 'budget';
  else if (avgBudget > 50000) budgetRange = 'luxury';

  // Determine travel style (based on trip frequency and destinations)
  let travelStyle = 'explorer';
  if (trips.length > 10) travelStyle = 'frequent traveler';
  if (favoriteDestinations.some(d => d.toLowerCase().includes('beach'))) travelStyle = 'beach lover';
  if (favoriteDestinations.some(d => d.toLowerCase().includes('mountain') || d.toLowerCase().includes('hill'))) {
    travelStyle = 'mountain enthusiast';
  }

  return {
    avgBudget,
    favoriteDestinations,
    preferredDuration,
    travelStyle,
    budgetRange,
  };
};

const generatePersonalizedRecommendations = async (profile, pastTrips) => {
  const recommendations = [];

  // Budget-based recommendations
  if (profile.avgBudget > 0) {
    if (profile.budgetRange === 'budget') {
      recommendations.push({
        id: 'budget-1',
        title: 'Affordable Weekend Getaways',
        description: `Based on your average budget of ₹${Math.round(profile.avgBudget).toLocaleString()}, perfect for you!`,
        destinations: ['Pondicherry', 'Coorg', 'Rishikesh', 'Udaipur'],
        estimatedCost: profile.avgBudget,
        duration: profile.preferredDuration,
        icon: FaRupeeSign,
        color: 'from-green-500 to-emerald-600',
      });
    } else if (profile.budgetRange === 'luxury') {
      recommendations.push({
        id: 'luxury-1',
        title: 'Premium Luxury Experiences',
        description: `Curated luxury destinations matching your ₹${Math.round(profile.avgBudget).toLocaleString()} budget`,
        destinations: ['Maldives', 'Switzerland', 'Dubai', 'Santorini'],
        estimatedCost: profile.avgBudget,
        duration: profile.preferredDuration,
        icon: FaHeart,
        color: 'from-purple-500 to-pink-600',
      });
    } else {
      recommendations.push({
        id: 'medium-1',
        title: 'Best Value Destinations',
        description: `Great destinations for your ₹${Math.round(profile.avgBudget).toLocaleString()} budget range`,
        destinations: ['Goa', 'Kerala', 'Rajasthan', 'Himachal Pradesh'],
        estimatedCost: profile.avgBudget,
        duration: profile.preferredDuration,
        icon: FaMapMarkedAlt,
        color: 'from-blue-500 to-cyan-600',
      });
    }
  }

  // Pattern-based recommendations
  if (profile.favoriteDestinations.length > 0) {
    recommendations.push({
      id: 'similar-1',
      title: 'Similar to Your Favorites',
      description: `You loved ${profile.favoriteDestinations.join(', ')}. Try these similar places!`,
      destinations: getSimilarDestinations(profile.favoriteDestinations),
      estimatedCost: profile.avgBudget,
      duration: profile.preferredDuration,
      icon: FaHeart,
      color: 'from-rose-500 to-red-600',
    });
  }

  // Duration-based recommendations
  if (profile.preferredDuration > 0) {
    const durationType = profile.preferredDuration <= 3 ? 'Weekend' : profile.preferredDuration <= 7 ? 'Week-long' : 'Extended';
    recommendations.push({
      id: 'duration-1',
      title: `Perfect ${durationType} Trips`,
      description: `${profile.preferredDuration}-day itineraries matching your travel style`,
      destinations: getDurationBasedDestinations(profile.preferredDuration),
      estimatedCost: profile.avgBudget,
      duration: profile.preferredDuration,
      icon: FaCalendarAlt,
      color: 'from-orange-500 to-amber-600',
    });
  }

  // Trending destinations (AI-powered)
  try {
    const trendingRes = await aiAPI.getRecommendations({
      userProfile: profile,
      pastTrips: pastTrips.slice(0, 5), // Send last 5 trips
    });
    
    const apiRecommendations =
      trendingRes?.data?.recommendations ||
      trendingRes?.data?.data ||
      [];

    if (trendingRes.data.success && Array.isArray(apiRecommendations) && apiRecommendations.length > 0) {
      const normalizedDestinations = apiRecommendations
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.destination || item.name || item.title || null;
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 4);

      if (normalizedDestinations.length === 0) {
        return recommendations;
      }

      recommendations.push({
        id: 'ai-trending',
        title: 'AI-Powered Trending Picks',
        description: 'Personalized recommendations based on your travel history and current trends',
        destinations: normalizedDestinations,
        estimatedCost: profile.avgBudget,
        duration: profile.preferredDuration,
        icon: FaMagic,
        color: 'from-violet-500 to-purple-600',
        isAI: true,
      });
    }
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
  }

  return recommendations;
};

const SmartRecommendationEngine = ({ userId }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDestinations, setSelectedDestinations] = useState({});
  const hasLoadedRecommendationsRef = useRef(false);

  const loadSmartRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user's past trips
      const tripsRes = await tripAPI.getTrips();
      const userTrips = tripsRes.data.trips || tripsRes.data || [];

      // Analyze user pattern
      const profile = analyzeUserPattern(userTrips);
      setUserProfile(profile);

      // Generate personalized recommendations
      const personalizedRecs = await generatePersonalizedRecommendations(profile, userTrips);
      setRecommendations(personalizedRecs);

    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations', { id: 'recommendations-load-error' });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since function doesn't depend on any props/state

  useEffect(() => {
    // Prevent duplicate initial fetch in React.StrictMode (dev-only behavior).
    if (hasLoadedRecommendationsRef.current) {
      return;
    }
    hasLoadedRecommendationsRef.current = true;
    loadSmartRecommendations();
  }, [loadSmartRecommendations]);

  // Handle destination selection
  const toggleDestination = (recId, destination) => {
    setSelectedDestinations(prev => {
      const key = `${recId}-${destination}`;
      const newSelection = { ...prev };
      
      if (newSelection[key]) {
        delete newSelection[key];
      } else {
        newSelection[key] = { recId, destination };
      }
      
      return newSelection;
    });
  };

  // Create trip from recommendation
  const createTripFromRecommendation = (rec, destination) => {
    // Navigate to trip planner with pre-filled data
    navigate('/trip-planner', {
      state: {
        destination: destination,
        budget: rec.estimatedCost,
        duration: rec.duration,
      }
    });
    toast.success(`Planning trip to ${destination}!`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Analyzing your travel patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Summary */}
      {userProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaChartLine className="h-6 w-6" />
            <h3 className="text-xl font-bold">Your Travel Profile</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trip-planner')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all duration-200"
            >
              <div className="text-sm opacity-80">Avg. Budget</div>
              <div className="text-lg font-bold">₹{Math.round(userProfile.avgBudget).toLocaleString()}</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trip-planner')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all duration-200"
            >
              <div className="text-sm opacity-80">Travel Style</div>
              <div className="text-lg font-bold capitalize">{userProfile.travelStyle}</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trip-planner')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all duration-200"
            >
              <div className="text-sm opacity-80">Preferred Days</div>
              <div className="text-lg font-bold">{userProfile.preferredDuration}</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trip-planner')}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all duration-200"
            >
              <div className="text-sm opacity-80">Budget Range</div>
              <div className="text-lg font-bold capitalize">{userProfile.budgetRange}</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Personalized Recommendations */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <FaMagic className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personalized For You</h3>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Start planning trips to get personalized recommendations!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`bg-gradient-to-r ${rec.color} p-4 text-white`}>
                  <div className="flex items-center gap-2 mb-2">
                    <rec.icon className="h-5 w-5" />
                    <h4 className="font-bold text-lg">{rec.title}</h4>
                  </div>
                  <p className="text-sm opacity-90">{rec.description}</p>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rec.destinations.map((dest, i) => {
                      const isSelected = selectedDestinations[`${rec.id}-${dest}`];
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDestination(rec.id, dest)}
                          onDoubleClick={() => createTripFromRecommendation(rec, dest)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer hover:shadow-md ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }`}
                          title="Click to select, double-click to plan trip"
                        >
                          {dest}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <FaRupeeSign />
                        {Math.round(rec.estimatedCost).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt />
                        {rec.duration} days
                      </span>
                    </div>
                    {Object.values(selectedDestinations).some(s => s.recId === rec.id) && (
                      <button
                        onClick={() => {
                          const selected = Object.values(selectedDestinations).find(s => s.recId === rec.id);
                          if (selected) {
                            createTripFromRecommendation(rec, selected.destination);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <FaPlus />
                        Plan Trip
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRecommendationEngine;
