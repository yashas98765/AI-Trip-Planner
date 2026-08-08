import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShareAlt } from 'react-icons/fa';
import SocialShareModal from './SocialShareModal';

const ShareButton = ({ trip, variant = 'default', className = '' }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const variants = {
    default: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg',
    icon: 'p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300',
    outline: 'px-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg'
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowShareModal(true)}
        className={`flex items-center gap-2 font-medium transition-colors ${variants[variant]} ${className}`}
        title="Share trip"
      >
        <FaShareAlt className={variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4'} />
        {variant !== 'icon' && <span>Share</span>}
      </motion.button>

      <SocialShareModal
        trip={trip}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
};

export default ShareButton;
