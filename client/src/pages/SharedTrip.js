import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaMapMarkedAlt, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaUserFriends,
  FaArrowLeft,
  FaPlane
} from 'react-icons/fa';
import { tripAPI } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { toast }from 'react-hot-toast';

const SharedTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedTrip = async () => {
      try {
        // This would be a public endpoint that doesn't require auth
        const response = await tripAPI.getSharedTrip(id);
        setTrip(response.data);
      } catch (error) {
        toast.error('Failed to load shared trip');
        console.error('Error fetching shared trip:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <FaPlane className="h-24 w-24 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trip Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This trip doesn't exist or is no longer shared.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <FaPlane className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AI Trip Planner
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Trip Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {trip.destination}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt />
                  <span>{trip.duration} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaDollarSign />
                  <span>{trip.budget || 'Flexible'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUserFriends />
                  <span>{trip.travelStyle}</span>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="p-6 md:p-8">
              {trip.itinerary && trip.itinerary.length > 0 ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Itinerary
                  </h2>
                  {trip.itinerary.map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-l-4 border-blue-600 pl-6 py-4"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Day {index + 1}: {day.title || `Day ${index + 1}`}
                      </h3>
                      {day.activities && day.activities.length > 0 && (
                        <ul className="space-y-2">
                          {day.activities.map((activity, actIndex) => (
                            <li
                              key={actIndex}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              • {activity.name || activity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaMapMarkedAlt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Itinerary details coming soon...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create Your Own Trip
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start planning your dream adventure with AI-powered itinerary generation
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Get Started Free
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedTrip;
