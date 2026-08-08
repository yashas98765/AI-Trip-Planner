import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifiOff, FiWifi } from 'react-icons/fi';
import { useOffline } from '../../hooks';

const OfflineStatusBanner = () => {
  const isOffline = useOffline();
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    if (!isOffline && showReconnected === false) {
      // Show reconnected message briefly
      const wasOffline = sessionStorage.getItem('wasOffline');
      if (wasOffline === 'true') {
        setShowReconnected(true);
        sessionStorage.removeItem('wasOffline');
        
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
    } else if (isOffline) {
      sessionStorage.setItem('wasOffline', 'true');
    }
  }, [isOffline, showReconnected]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <FiWifiOff className="text-xl animate-pulse" />
              <p className="font-medium">
                You're offline. Some features may be limited.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <FiWifi className="text-xl" />
              <p className="font-medium">
                Back online! All features restored.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineStatusBanner;
