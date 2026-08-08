import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTshirt, FaFirstAid, FaFile, FaPlug, FaSoap, FaMountain, FaBox, FaDownload, FaPrint, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { generatePackingList } from '../../utils/packingListGenerator';

const PackingListCard = ({ trip }) => {
  const [packingData, setPackingData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    clothes: true,
    essentials: true,
    medicines: true,
    documents: true,
  });

  useEffect(() => {
    if (trip) {
      const data = generatePackingList(trip);
      setPackingData(data);
    }
  }, [trip]);

  if (!packingData) return null;

  const categoryIcons = {
    clothes: { icon: FaTshirt, color: 'purple' },
    essentials: { icon: FaBox, color: 'blue' },
    medicines: { icon: FaFirstAid, color: 'red' },
    documents: { icon: FaFile, color: 'yellow' },
    electronics: { icon: FaPlug, color: 'green' },
    toiletries: { icon: FaSoap, color: 'pink' },
    adventure: { icon: FaMountain, color: 'orange' },
    misc: { icon: FaBox, color: 'gray' },
  };

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      pink: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
      orange: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      gray: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    };
    return colors[color] || colors.gray;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      critical: { color: 'red', label: 'Must Have' },
      high: { color: 'orange', label: 'Important' },
      medium: { color: 'yellow', label: 'Recommended' },
      low: { color: 'gray', label: 'Optional' },
    };
    const badge = badges[priority] || badges.medium;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${getColorClasses(badge.color)}`}>
        {badge.label}
      </span>
    );
  };

  const toggleCheck = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getProgress = () => {
    const totalItems = packingData.totalItems;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return { checked: checkedCount, total: totalItems, percentage: Math.round((checkedCount / totalItems) * 100) };
  };

  const progress = getProgress();

  const handleDownload = () => {
    let content = `🎒 PACKING LIST - ${trip.destination?.city || trip.destination}\n\n`;
    content += `📅 Duration: ${packingData.duration} days\n`;
    content += `🌡️ Climate: ${packingData.climate}\n`;
    content += `👤 Traveler Type: ${packingData.travelerType}\n\n`;
    content += `═══════════════════════════════════\n\n`;

    Object.entries(packingData.packingList).forEach(([category, items]) => {
      if (items.length > 0) {
        content += `\n${category.toUpperCase()}\n`;
        content += `${'─'.repeat(40)}\n`;
        items.forEach(item => {
          const itemText = item.item || item;
          const qty = item.quantity ? ` (${item.quantity})` : '';
          const priority = item.priority ? ` [${item.priority}]` : '';
          const note = item.note ? ` - ${item.note}` : '';
          content += `☐ ${itemText}${qty}${priority}${note}\n`;
        });
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-list-${trip.destination?.city || 'trip'}.txt`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaTshirt className="text-3xl text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Smart Packing List</h2>
              <p className="text-purple-100 text-sm">
                AI-generated for {packingData.duration} days • {packingData.climate} weather
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors flex items-center gap-2 text-white"
            >
              <FaDownload />
              <span className="hidden md:inline">Download</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors flex items-center gap-2 text-white"
            >
              <FaPrint />
              <span className="hidden md:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center"
          >
            {progress.percentage > 10 && (
              <span className="text-xs font-bold text-white">
                {progress.checked}/{progress.total} ({progress.percentage}%)
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Trip Info */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{packingData.totalItems}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{packingData.climate}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Climate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{packingData.travelerType}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Travel Type</div>
          </div>
        </div>
      </div>

      {/* Packing List Categories */}
      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {Object.entries(packingData.packingList).map(([category, items]) => {
          if (items.length === 0) return null;

          const { icon: Icon, color } = categoryIcons[category] || categoryIcons.misc;
          const isExpanded = expandedSections[category] !== false;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`border-2 rounded-lg overflow-hidden ${getColorClasses(color)}`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleSection(category)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-xl" />
                  <h3 className="font-bold text-lg capitalize">{category}</h3>
                  <span className="text-sm opacity-75">({items.length} items)</span>
                </div>
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {/* Category Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 p-4 space-y-2"
                  >
                    {items.map((item, index) => {
                      const itemKey = `${category}-${index}`;
                      const isChecked = checkedItems[itemKey];
                      const itemText = item.item || item;
                      const quantity = item.quantity ? ` (×${item.quantity})` : '';

                      return (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isChecked
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <button
                            onClick={() => toggleCheck(category, index)}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                            }`}
                          >
                            {isChecked && <FaCheck className="text-white text-xs" />}
                          </button>
                          
                          <div className="flex-1">
                            <div className={`font-medium ${isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {itemText}{quantity}
                            </div>
                            {item.note && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                💡 {item.note}
                              </div>
                            )}
                          </div>

                          {item.priority && (
                            <div className="flex-shrink-0">
                              {getPriorityBadge(item.priority)}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Tip */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-b-xl border-t border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
          💡 <strong>Pro Tip:</strong> Pack essentials in carry-on. Roll clothes to save space. Check airline baggage limits!
        </p>
      </div>
    </motion.div>
  );
};

export default PackingListCard;
