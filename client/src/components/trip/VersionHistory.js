import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHistory, 
  FaClock, 
  FaUndo, 
  FaCheck, 
  FaExchangeAlt,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const VersionHistory = ({ trip, onRestoreVersion, onCompareVersions, onClose }) => {
  const [selectedToCompare, setSelectedToCompare] = useState([]);
  const [isComparing, setIsComparing] = useState(false);

  const versions = trip.versions || [];
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleRestore = async (versionNumber) => {
    if (window.confirm(`Are you sure you want to restore Version ${versionNumber}?`)) {
      try {
        await onRestoreVersion(versionNumber);
        toast.success('Version restored successfully!');
        onClose();
      } catch (error) {
        toast.error('Failed to restore version');
      }
    }
  };

  const toggleCompareSelection = (versionNumber) => {
    if (selectedToCompare.includes(versionNumber)) {
      setSelectedToCompare(selectedToCompare.filter(v => v !== versionNumber));
    } else if (selectedToCompare.length < 2) {
      setSelectedToCompare([...selectedToCompare, versionNumber]);
    } else {
      toast.error('You can only compare 2 versions at a time');
    }
  };

  const handleCompare = () => {
    if (selectedToCompare.length === 2) {
      onCompareVersions(selectedToCompare[0], selectedToCompare[1]);
      setIsComparing(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaHistory className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Version History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {versions.length} versions available
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Compare Actions */}
          {selectedToCompare.length === 2 && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                  <FaExchangeAlt />
                  <span>
                    Comparing Version {selectedToCompare[0]} and {selectedToCompare[1]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCompare}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Comparison
                  </button>
                  <button
                    onClick={() => setSelectedToCompare([])}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Version List */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            {sortedVersions.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No version history available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedVersions.map((version) => (
                  <motion.div
                    key={version.versionNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border rounded-lg p-4 transition-all ${
                      version.isCurrent
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : selectedToCompare.includes(version.versionNumber)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Version Number */}
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            version.isCurrent
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            v{version.versionNumber}
                          </div>
                          {version.isCurrent && (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              <FaCheck className="h-3 w-3" />
                              Current
                            </span>
                          )}
                        </div>

                        {/* Version Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {version.description || `Version ${version.versionNumber}`}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <FaClock className="h-3 w-3" />
                            <span>
                              {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!version.isCurrent && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleCompareSelection(version.versionNumber)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedToCompare.includes(version.versionNumber)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {selectedToCompare.includes(version.versionNumber) ? 'Selected' : 'Compare'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRestore(version.versionNumber)}
                              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <FaUndo className="h-3 w-3" />
                              Restore
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Version Details */}
                    {version.itinerary && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {version.itinerary.days?.length || 0} days in itinerary
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VersionHistory;
