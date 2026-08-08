import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShare, 
  FaTimes, 
  FaLink, 
  FaCopy, 
  FaCheck, 
  FaUsers,
  FaEye,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaEnvelope,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { tripAPI } from '../../services/api';

const ShareTripModal = ({ isOpen, onClose, tripId, tripDestination }) => {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState('view');
  const [emailInput, setEmailInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  // Generate shareable link when modal opens
  React.useEffect(() => {
    if (isOpen && tripId && !shareLink) {
      generateShareLink();
    }
  }, [isOpen, tripId]);

  const generateShareLink = async () => {
    try {
      if (!tripId) {
        toast.error('Save the trip before generating a share link');
        return;
      }

      setIsGenerating(true);
      const response = await tripAPI.shareTrip(tripId);
      
      if (response.data.success) {
        setShareLink(response.data.shareUrl);
        toast.success('Share link generated successfully!');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteByEmail = async () => {
    if (!tripId) {
      toast.error('Save the trip before inviting collaborators');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const response = await tripAPI.addCollaborator(tripId, {
        email: emailInput,
        permission: permission,
      });

      if (response.data.success) {
        setCollaborators(response.data.data.sharedWith || []);
        setEmailInput('');
        toast.success(`Invitation sent to ${emailInput}`);
      }
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleRemoveCollaborator = (email) => {
    setCollaborators(prev => prev.filter(c => c.email !== email));
    toast.success('Collaborator removed');
  };

  const permissionOptions = [
    { id: 'view', label: 'Can View', icon: FaEye, description: 'Can only view the trip' },
    { id: 'edit', label: 'Can Edit', icon: FaEdit, description: 'Can view and make changes' },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <FaShare className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Share Trip</h2>
                      <p className="text-blue-100 text-sm">{tripDestination || 'Your Trip'}</p>
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
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                {/* Share Link Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    <FaLink className="inline h-5 w-5 mr-2 text-blue-600" />
                    Share Link
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={isGenerating ? 'Generating link...' : shareLink}
                      readOnly
                      placeholder="Click generate to create share link"
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                    />
                    {isGenerating ? (
                      <button
                        disabled
                        className="px-4 py-3 bg-blue-400 text-white rounded-lg flex items-center space-x-2 cursor-not-allowed"
                      >
                        <FaSpinner className="h-4 w-4 animate-spin" />
                      </button>
                    ) : (
                      <button
                        onClick={handleCopyLink}
                        disabled={!shareLink}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:cursor-not-allowed"
                      >
                        {copied ? <FaCheck className="h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Anyone with this link can access your trip based on the permission you set.
                  </p>
                </div>

                {/* Permission Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Permission
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {permissionOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPermission(opt.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            permission === opt.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Icon className={`h-4 w-4 ${permission === opt.id ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className={`font-medium text-sm ${permission === opt.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {opt.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Invite by Email */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    <FaEnvelope className="inline h-5 w-5 mr-2 text-blue-600" />
                    Invite by Email
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleInviteByEmail()}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={handleInviteByEmail}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <FaUserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Invite</span>
                    </button>
                  </div>
                </div>

                {/* Collaborators List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    <FaUsers className="inline h-5 w-5 mr-2 text-blue-600" />
                    Collaborators ({collaborators.length})
                  </h3>
                  <div className="space-y-2">
                    {collaborators.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No collaborators yet. Invite someone to  collaborate!
                      </div>
                    ) : (
                      collaborators.map((collaborator) => (
                        <motion.div
                          key={collaborator.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {collaborator.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {collaborator.name}
                                {collaborator.status === 'pending' && (
                                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                    Pending
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {collaborator.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={collaborator.permission}
                              onChange={(e) => handleChangePermission(collaborator.id, e.target.value)}
                              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-blue-500 dark:text-white"
                            >
                              <option value="view">View</option>
                              <option value="edit">Edit</option>
                            </select>
                            <button
                              onClick={() => handleRemoveCollaborator(collaborator.id)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <FaTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                    💡 Collaboration Tips
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>View</strong> permission allows others to see your trip but not make changes</li>
                    <li>• <strong>Edit</strong> permission allows full editing of itinerary, bookings, and expenses</li>
                    <li>• Changes by collaborators are synced in real-time</li>
                    <li>• You can revoke access anytime by removing collaborators</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Trip sharing settings saved!');
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareTripModal;
