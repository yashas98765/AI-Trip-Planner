import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDice, FaTimes, FaMapMarkedAlt, FaCalendarAlt, FaUsers, FaDollarSign, FaRocket, FaRedoAlt } from 'react-icons/fa';
import { generateMultipleSurprises, getSurpriseTagline } from '../../utils/surpriseMeGenerator';
import { toast } from 'react-hot-toast';

const SurpriseMeModal = ({ isOpen, onClose, onSelectTrip }) => {
  const [surpriseTrips, setSurpriseTrips] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate trips on mount or when user clicks regenerate
  React.useEffect(() => {
    if (isOpen && surpriseTrips.length === 0) {
      generateNewTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generateNewTrips = () => {
    setIsGenerating(true);
    // Simulate slight delay for effect
    setTimeout(() => {
      const trips = generateMultipleSurprises(3);
      setSurpriseTrips(trips);
      setIsGenerating(false);
    }, 500);
  };

  const handleSelectTrip = (trip) => {
    onSelectTrip(trip);
    toast.success(`${getSurpriseTagline(trip)}`, { icon: '✨', duration: 4000 });
    onClose();
  };

  const budgetLabels = {
    budget: 'Under ₹15,000',
    economy: '₹15,000 – ₹40,000',
    comfort: '₹40,000 – ₹80,000',
    premium: '₹80,000 – ₹1,50,000',
    luxury: '₹1,50,000+',
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <FaDice className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Surprise Me!</h2>
                      <p className="text-purple-100 text-sm">Let fate decide your next adventure</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {isGenerating ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        <FaDice className="h-12 w-12 text-purple-600" />
                      </motion.div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">Rolling the dice...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Pick Your Random Adventure
                      </h3>
                      <button
                        onClick={generateNewTrips}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <FaRedoAlt className="h-4 w-4" />
                        <span className="text-sm font-medium">Generate More</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {surpriseTrips.map((trip, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer hover:shadow-xl"
                          onClick={() => handleSelectTrip(trip)}
                        >
                          {/* Destination emoji badge */}
                          <div className="absolute -top-3 -right-3 text-4xl">
                            {trip._metadata.emoji}
                          </div>

                          <div className="mb-3">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {trip.destination}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {trip._metadata.description}
                            </p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <FaCalendarAlt className="h-4 w-4 mr-2 text-purple-600" />
                              <span className="text-xs">
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </span>
                            </div>

                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <FaUsers className="h-4 w-4 mr-2 text-purple-600" />
                              <span className="text-xs">
                                {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
                              </span>
                            </div>

                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <FaDollarSign className="h-4 w-4 mr-2 text-purple-600" />
                              <span className="text-xs">{budgetLabels[trip.budget]}</span>
                            </div>

                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <FaMapMarkedAlt className="h-4 w-4 mr-2 text-purple-600" />
                              <span className="text-xs capitalize">
                                {trip._metadata.duration} {trip._metadata.duration === 1 ? 'Day' : 'Days'} • {trip._metadata.vibe}
                              </span>
                            </div>
                          </div>

                          {/* Interests tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {trip.interests.slice(0, 3).map((interest, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>

                          {/* Select button (appears on hover) */}
                          <motion.button
                            initial={{ opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm group-hover:opacity-100 opacity-0 transition-opacity shadow-md"
                          >
                            Let's Go! 🚀
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Tips section */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start space-x-3">
                        <FaRocket className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            Pro Tip
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Click on any trip to auto-fill the form, then customize it to your liking. 
                            Not feeling any of these? Click "Generate More" for new suggestions!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SurpriseMeModal;
