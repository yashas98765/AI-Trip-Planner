import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaGripVertical,
  FaTrash,
  FaPlus,
  FaClock,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaEdit,
  FaSave,
  FaTimes,
} from 'react-icons/fa';

const EditableItinerary = ({ itinerary, onUpdate }) => {
  const [days, setDays] = useState(itinerary?.days || []);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivityForm, setNewActivityForm] = useState({ dayIndex: null, show: false });

  // Handle day reordering
  const handleDayReorder = (newOrder) => {
    setDays(newOrder);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: newOrder });
    }
  };

  // Handle activity reordering within a day
  const handleActivityReorder = (dayIndex, newActivities) => {
    const updatedDays = [...days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      activities: newActivities,
    };
    setDays(updatedDays);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: updatedDays });
    }
  };

  // Remove activity
  const removeActivity = (dayIndex, activityIndex) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].activities.splice(activityIndex, 1);
    setDays(updatedDays);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: updatedDays });
    }
    toast.success('Activity removed');
  };

  // Remove day
  const removeDay = (dayIndex) => {
    const updatedDays = days.filter((_, index) => index !== dayIndex);
    setDays(updatedDays);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: updatedDays });
    }
    toast.success('Day removed');
  };

  // Add new activity
  const addNewActivity = (dayIndex, activity) => {
    const updatedDays = [...days];
    if (!updatedDays[dayIndex].activities) {
      updatedDays[dayIndex].activities = [];
    }
    updatedDays[dayIndex].activities.push({
      time: activity.time || '10:00',
      title: activity.title || 'New Activity',
      location: activity.location || '',
      description: activity.description || '',
      estimatedCost: parseInt(activity.estimatedCost) || 0,
      type: activity.type || 'activity',
    });
    setDays(updatedDays);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: updatedDays });
    }
    setNewActivityForm({ dayIndex: null, show: false });
    toast.success('Activity added');
  };

  // Update activity
  const updateActivity = (dayIndex, activityIndex, updatedActivity) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].activities[activityIndex] = {
      ...updatedDays[dayIndex].activities[activityIndex],
      ...updatedActivity,
    };
    setDays(updatedDays);
    if (onUpdate) {
      onUpdate({ ...itinerary, days: updatedDays });
    }
    setEditingActivity(null);
    toast.success('Activity updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaEdit className="text-blue-600" />
          Editable Itinerary
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag to reorder • Click to edit • Delete unwanted items
        </p>
      </div>

      <Reorder.Group axis="y" values={days} onReorder={handleDayReorder} className="space-y-4">
        {days.map((day, dayIndex) => (
          <Reorder.Item
            key={day.day || dayIndex}
            value={day}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Day Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3 text-white">
                <FaGripVertical className="h-5 w-5 opacity-70" />
                <div>
                  <h4 className="font-bold text-lg">Day {dayIndex + 1}</h4>
                  <p className="text-sm opacity-90">{day.title || day.theme || 'Activities'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewActivityForm({ dayIndex, show: true })}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Add Activity"
                >
                  <FaPlus className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remove this day?')) removeDay(dayIndex);
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Remove Day"
                >
                  <FaTrash className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Activities */}
            <div className="p-4">
              {day.activities && day.activities.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={day.activities}
                  onReorder={(newActivities) => handleActivityReorder(dayIndex, newActivities)}
                  className="space-y-3"
                >
                  {day.activities.map((activity, activityIndex) => (
                    <Reorder.Item
                      key={activityIndex}
                      value={activity}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-grab active:cursor-grabbing"
                    >
                      {editingActivity?.dayIndex === dayIndex && editingActivity?.activityIndex === activityIndex ? (
                        // Edit Mode
                        <EditActivityForm
                          activity={activity}
                          onSave={(updated) => updateActivity(dayIndex, activityIndex, updated)}
                          onCancel={() => setEditingActivity(null)}
                        />
                      ) : (
                        // View Mode
                        <div className="flex items-start gap-3">
                          <FaGripVertical className="h-5 w-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h5>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <FaClock className="h-3 w-3" />
                                    {activity.time}
                                  </span>
                                  {activity.location && (
                                    <span className="flex items-center gap-1">
                                      <FaMapMarkerAlt className="h-3 w-3" />
                                      {typeof activity.location === 'string' ? activity.location : activity.location.name || 'Location'}
                                    </span>
                                  )}
                                  {activity.estimatedCost > 0 && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                      <FaRupeeSign className="h-3 w-3" />
                                      {activity.estimatedCost}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingActivity({ dayIndex, activityIndex })}
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Remove this activity?')) removeActivity(dayIndex, activityIndex);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {activity.description && typeof activity.description === 'string' && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <p className="text-center text-gray-400 dark:text-gray-500 py-4">No activities yet</p>
              )}

              {/* Add Activity Form */}
              {newActivityForm.show && newActivityForm.dayIndex === dayIndex && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <AddActivityForm
                    onAdd={(activity) => addNewActivity(dayIndex, activity)}
                    onCancel={() => setNewActivityForm({ dayIndex: null, show: false })}
                  />
                </motion.div>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

// Add Activity Form Component
const AddActivityForm = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    time: '10:00',
    location: '',
    description: '',
    estimatedCost: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter activity title');
      return;
    }
    onAdd(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Activity Title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
        />
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <input
          type="number"
          placeholder="Cost (₹)"
          value={formData.estimatedCost}
          onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows="2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaSave className="h-4 w-4" />
          Add Activity
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

// Edit Activity Form Component
const EditActivityForm = ({ activity, onSave, onCancel }) => {
  const [formData, setFormData] = useState(activity);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter activity title');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
        />
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <input
          type="number"
          value={formData.estimatedCost || 0}
          onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) || 0 })}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <input
          type="text"
          placeholder="Location"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <textarea
          placeholder="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows="2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaSave className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

export default EditableItinerary;
