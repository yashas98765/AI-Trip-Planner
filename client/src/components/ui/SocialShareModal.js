import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaWhatsapp, 
  FaLinkedinIn, 
  FaTelegram,
  FaLink,
  FaEnvelope,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SocialShareModal = ({ trip, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!trip) return null;

  // Generate shareable link (would be from your deployed domain)
  const shareUrl = `${window.location.origin}/shared/trips/${trip._id}`;
  const shareText = `Check out my trip to ${trip.destination}!`;
  const shareTitle = `${trip.destination} Trip - AI Trip Planner`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareOnPlatform = (platform) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(shareTitle);

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: FaFacebookF,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => shareOnPlatform('facebook')
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => shareOnPlatform('twitter')
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => shareOnPlatform('whatsapp')
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedinIn,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => shareOnPlatform('linkedin')
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => shareOnPlatform('telegram')
    },
    {
      name: 'Email',
      icon: FaEnvelope,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => shareOnPlatform('email')
    }
  ];

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share Your Trip
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaTimes className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Trip Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {trip.destination}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trip.duration} days • {trip.travelStyle}
                  </p>
                </div>

                {/* Copy Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Copy Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {copied ? <FaCheck /> : <FaLink />}
                    </motion.button>
                  </div>
                </div>

                {/* Social Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Share On
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {socialPlatforms.map((platform) => (
                      <motion.button
                        key={platform.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={platform.action}
                        className={`${platform.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors`}
                      >
                        <platform.icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{platform.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Native Share (if available) */}
                {navigator.share && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: shareTitle,
                          text: shareText,
                          url: shareUrl
                        });
                        onClose();
                      } catch (err) {
                        if (err.name !== 'AbortError') {
                          toast.error('Failed to share');
                        }
                      }
                    }}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-900 dark:text-white transition-colors"
                  >
                    More Options...
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SocialShareModal;
