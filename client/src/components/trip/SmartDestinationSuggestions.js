import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaMapMarkedAlt,
  FaFire,
  FaUsers,
  FaStar,
  FaChevronRight,
} from 'react-icons/fa';

const SmartDestinationSuggestions = ({ currentDestination, onSelectDestination }) => {
  const [suggestions, setSuggestions] = useState({
    trending: [],
    similar: [],
    peopleAlsoVisited: [],
  });

  // Destination database with categories and characteristics
  const destinationData = {
    // India - Popular
    'goa': { category: 'beach', vibe: 'party', season: 'winter', budget: 'medium', similar: ['pondicherry', 'kerala', 'andaman'] },
    'kerala': { category: 'nature', vibe: 'relaxed', season: 'winter', budget: 'medium', similar: ['goa', 'coorg', 'munnar'] },
    'manali': { category: 'mountains', vibe: 'adventure', season: 'summer', budget: 'medium', similar: ['shimla', 'dharamshala', 'rishikesh'] },
    'jaipur': { category: 'heritage', vibe: 'cultural', season: 'winter', budget: 'medium', similar: ['udaipur', 'jodhpur', 'delhi'] },
    'udaipur': { category: 'heritage', vibe: 'romantic', season: 'winter', budget: 'high', similar: ['jaipur', 'jaisalmer', 'pushkar'] },
    'shimla': { category: 'mountains', vibe: 'relaxed', season: 'summer', budget: 'medium', similar: ['manali', 'nainital', 'mussoorie'] },
    'delhi': { category: 'city', vibe: 'cultural', season: 'winter', budget: 'medium', similar: ['agra', 'jaipur', 'mumbai'] },
    'mumbai': { category: 'city', vibe: 'urban', season: 'winter', budget: 'high', similar: ['delhi', 'bangalore', 'pune'] },
    'bangalore': { category: 'city', vibe: 'urban', season: 'all', budget: 'high', similar: ['mumbai', 'hyderabad', 'chennai'] },
    'rishikesh': { category: 'spiritual', vibe: 'adventure', season: 'spring', budget: 'low', similar: ['haridwar', 'dharamshala', 'manali'] },
    'andaman': { category: 'beach', vibe: 'adventure', season: 'winter', budget: 'high', similar: ['lakshadweep', 'goa', 'kerala'] },
    'leh-ladakh': { category: 'mountains', vibe: 'adventure', season: 'summer', budget: 'high', similar: ['spiti', 'manali', 'kashmir'] },
    'varanasi': { category: 'spiritual', vibe: 'cultural', season: 'winter', budget: 'low', similar: ['rishikesh', 'haridwar', 'bodhgaya'] },
    'pondicherry': { category: 'beach', vibe: 'relaxed', season: 'winter', budget: 'medium', similar: ['goa', 'kanyakumari', 'mahabalipuram'] },
    'ooty': { category: 'mountains', vibe: 'relaxed', season: 'summer', budget: 'medium', similar: ['coorg', 'munnar', 'kodaikanal'] },
    'darjeeling': { category: 'mountains', vibe: 'relaxed', season: 'spring', budget: 'medium', similar: ['gangtok', 'shillong', 'ooty'] },
    'agra': { category: 'heritage', vibe: 'cultural', season: 'winter', budget: 'medium', similar: ['delhi', 'jaipur', 'mathura'] },
    'coorg': { category: 'nature', vibe: 'relaxed', season: 'winter', budget: 'medium', similar: ['ooty', 'munnar', 'wayanad'] },
    'munnar': { category: 'nature', vibe: 'relaxed', season: 'all', budget: 'medium', similar: ['ooty', 'coorg', 'wayanad'] },
    'hampi': { category: 'heritage', vibe: 'cultural', season: 'winter', budget: 'low', similar: ['badami', 'aihole', 'pattadakal'] },
  };

  // Trending destinations (can be fetched from API in real app)
  const trendingDestinations = [
    { name: 'Leh-Ladakh', trend: 95, emoji: '🏔️', tag: 'Adventure Paradise' },
    { name: 'Goa', trend: 92, emoji: '🏖️', tag: 'Beach & Nightlife' },
    { name: 'Manali', trend: 88, emoji: '⛷️', tag: 'Hill Station' },
    { name: 'Kerala', trend: 85, emoji: '🌴', tag: 'Backwaters' },
    { name: 'Jaipur', trend: 82, emoji: '🏰', tag: 'Heritage' },
    { name: 'Andaman', trend: 80, emoji: '🏝️', tag: 'Island Escape' },
  ];

  const generateSuggestions = (destination) => {
    const destKey = destination.toLowerCase().trim();
    const destInfo = destinationData[destKey];

    let similarDests = [];
    let peopleAlsoVisitedDests = [];

    if (destInfo) {
      // Get similar destinations
      similarDests = destInfo.similar.map(key => ({
        name: capitalizeWords(key),
        reason: `Similar ${destInfo.category} destination`,
        emoji: getCategoryEmoji(destinationData[key]?.category),
        category: destinationData[key]?.category,
      }));

      // Generate "People also visited" based on category and vibe
      peopleAlsoVisitedDests = Object.keys(destinationData)
        .filter(key => {
          const other = destinationData[key];
          return key !== destKey && 
                 !destInfo.similar.includes(key) &&
                 (other.category === destInfo.category || other.vibe === destInfo.vibe);
        })
        .slice(0, 4)
        .map(key => ({
          name: capitalizeWords(key),
          reason: `Popular with ${capitalizeWords(destKey)} travelers`,
          emoji: getCategoryEmoji(destinationData[key]?.category),
          category: destinationData[key]?.category,
        }));
    }

    setSuggestions({
      trending: trendingDestinations.slice(0, 6),
      similar: similarDests.slice(0, 4),
      peopleAlsoVisited: peopleAlsoVisitedDests,
    });
  };

  useEffect(() => {
    if (currentDestination) {
      generateSuggestions(currentDestination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDestination]);

  const capitalizeWords = (str) => {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      beach: '🏖️',
      mountains: '🏔️',
      heritage: '🏰',
      spiritual: '🕉️',
      nature: '🌿',
      city: '🏙️',
      adventure: '🎿',
    };
    return emojis[category] || '📍';
  };

  const handleSuggestionClick = (destination) => {
    if (onSelectDestination) {
      onSelectDestination(destination.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trending Destinations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
      >
        <div className="flex items-center gap-2 mb-4">
          <FaFire className="text-2xl text-orange-600 dark:text-orange-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Trending Destinations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.trending.map((dest, index) => (
            <motion.button
              key={dest.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuggestionClick(dest)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all text-left border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{dest.emoji}</span>
                <div className="flex items-center gap-1">
                  <FaStar className="text-yellow-500 text-sm" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {dest.trend}%
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {dest.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {dest.tag}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Similar Destinations */}
      {suggestions.similar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaMapMarkedAlt className="text-2xl text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Similar Destinations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.similar.map((dest, index) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(dest)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-all text-left border border-gray-200 dark:border-gray-700 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {dest.reason}
                    </p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* People Also Visited */}
      {suggestions.peopleAlsoVisited.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaUsers className="text-2xl text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              People Also Visited
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.peopleAlsoVisited.map((dest, index) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(dest)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-all text-left border border-gray-200 dark:border-gray-700 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {dest.reason}
                    </p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SmartDestinationSuggestions;
