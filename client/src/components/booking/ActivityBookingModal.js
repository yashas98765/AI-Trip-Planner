import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaCalendar,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaCheckCircle,
  FaArrowLeft,
  FaMountain,
  FaUmbrellaBeach,
  FaHome,
  FaShip,
  FaBed,
} from 'react-icons/fa';
import { bookingAPI } from '../../services/api';

const ActivityBookingModal = ({ isOpen, onClose, placeDetails = {}, activityType = 'adventure' }) => {
  const [step, setStep] = useState(1); // 1: Activity Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    age: '',
    nationality: 'Indian',
    activityName: '',
    bookingDate: '',
    bookingTime: '09:00',
    numberOfPeople: 1,
    duration: 'Full day',
    // For accommodation
    checkInDate: '',
    checkOutDate: '',
    roomType: 'standard',
    numberOfRooms: 1,
    // For tours and cruises
    departureTime: '',
    returnTime: '',
    tourLanguage: 'English',
    meetingPoint: '',
    specialRequests: '',
  });

  // Activity configurations by type
  const activityConfigs = {
    adventure: {
      title: 'Adventure Activity',
      icon: '🏔️',
      color: 'from-orange-500 to-red-500',
      activities: [
        { id: 'trekking', name: 'Trekking', price: 1500, duration: 'Full day', description: 'Mountain trekking adventure' },
        { id: 'rafting', name: 'White Water Rafting', price: 2000, duration: '4 hours', description: 'Thrilling river rafting' },
        { id: 'paragliding', name: 'Paragliding', price: 3000, duration: '30 minutes', description: 'Soar through the sky' },
        { id: 'bungee', name: 'Bungee Jumping', price: 2500, duration: '1 hour', description: 'Ultimate adrenaline rush' },
        { id: 'zipline', name: 'Zip Lining', price: 1200, duration: '2 hours', description: 'Fly across valleys' },
        { id: 'rock_climbing', name: 'Rock Climbing', price: 1800, duration: '3 hours', description: 'Scale new heights' },
      ],
    },
    theme_park: {
      title: 'Theme Park',
      icon: '🎢',
      color: 'from-purple-500 to-pink-500',
      activities: [
        { id: 'full_day', name: 'Full Day Pass', price: 1500, duration: 'Full day', description: 'Access all rides' },
        { id: 'water_park', name: 'Water Park Pass', price: 1200, duration: 'Full day', description: 'All water attractions' },
        { id: 'family_combo', name: 'Family Combo', price: 5000, duration: 'Full day', description: 'For up to 4 people' },
        { id: 'vip_pass', name: 'VIP Fast Track', price: 3000, duration: 'Full day', description: 'Skip queues' },
      ],
    },
    guided_tour: {
      title: 'Guided Tour',
      icon: '🗺️',
      color: 'from-blue-500 to-cyan-500',
      activities: [
        { id: 'city_tour', name: 'City Tour', price: 800, duration: '4 hours', description: 'Explore city highlights' },
        { id: 'heritage_tour', name: 'Heritage Tour', price: 1000, duration: '5 hours', description: 'Historical monuments' },
        { id: 'food_tour', name: 'Food Walk Tour', price: 900, duration: '3 hours', description: 'Local cuisine tasting' },
        { id: 'photography_tour', name: 'Photography Tour', price: 1500, duration: 'Full day', description: 'Capture best spots' },
        { id: 'night_tour', name: 'Night City Tour', price: 1200, duration: '3 hours', description: 'City nightlife' },
      ],
    },
    cruise: {
      title: 'Cruise',
      icon: '🚢',
      color: 'from-blue-600 to-indigo-600',
      activities: [
        { id: 'dinner_cruise', name: 'Dinner Cruise', price: 2500, duration: '3 hours', description: 'Romantic dinner on water' },
        { id: 'sunset_cruise', name: 'Sunset Cruise', price: 1800, duration: '2 hours', description: 'Beautiful sunset views' },
        { id: 'party_cruise', name: 'Party Cruise', price: 3000, duration: '4 hours', description: 'Music and entertainment' },
        { id: 'day_cruise', name: 'Day Cruise', price: 4000, duration: 'Full day', description: 'Full day sailing' },
      ],
    },
    boat_ride: {
      title: 'Boat Ride',
      icon: '⛵',
      color: 'from-cyan-500 to-blue-500',
      activities: [
        { id: 'speed_boat', name: 'Speed Boat Ride', price: 800, duration: '30 minutes', description: 'High-speed thrills' },
        { id: 'sailing', name: 'Sailing Experience', price: 1500, duration: '2 hours', description: 'Peaceful sailing' },
        { id: 'kayaking', name: 'Kayaking', price: 600, duration: '1 hour', description: 'Paddle your way' },
        { id: 'houseboat', name: 'Houseboat Tour', price: 2000, duration: '4 hours', description: 'Luxury houseboat' },
      ],
    },
    hostel: {
      title: 'Hostel',
      icon: '🏨',
      color: 'from-green-500 to-teal-500',
      activities: [
        { id: 'dorm_bed', name: 'Dorm Bed', price: 500, duration: 'Per night', description: 'Shared dormitory' },
        { id: 'private_room', name: 'Private Room', price: 1200, duration: 'Per night', description: 'Private accommodation' },
        { id: 'deluxe_room', name: 'Deluxe Room', price: 1800, duration: 'Per night', description: 'Premium room' },
      ],
    },
    resort: {
      title: 'Resort',
      icon: '🏖️',
      color: 'from-yellow-500 to-orange-500',
      activities: [
        { id: 'standard', name: 'Standard Room', price: 3000, duration: 'Per night', description: 'Comfortable stay' },
        { id: 'deluxe', name: 'Deluxe Room', price: 5000, duration: 'Per night', description: 'Luxury amenities' },
        { id: 'suite', name: 'Suite', price: 8000, duration: 'Per night', description: 'Premium suite' },
        { id: 'villa', name: 'Private Villa', price: 15000, duration: 'Per night', description: 'Exclusive villa' },
      ],
    },
    homestay: {
      title: 'Homestay',
      icon: '🏠',
      color: 'from-pink-500 to-red-500',
      activities: [
        { id: 'single_room', name: 'Single Room', price: 800, duration: 'Per night', description: 'Cozy single room' },
        { id: 'double_room', name: 'Double Room', price: 1200, duration: 'Per night', description: 'Comfortable double room' },
        { id: 'family_room', name: 'Family Room', price: 2000, duration: 'Per night', description: 'Spacious family room' },
        { id: 'entire_home', name: 'Entire Home', price: 3500, duration: 'Per night', description: 'Full property' },
      ],
    },
  };

  const config = activityConfigs[activityType] || activityConfigs.adventure;
  const isAccommodation = ['hostel', 'resort', 'homestay'].includes(activityType);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleActivitySelect = (activityId) => {
    const selectedActivity = config.activities.find((a) => a.id === activityId);
    if (selectedActivity) {
      setFormData({
        ...formData,
        activityName: selectedActivity.name,
        duration: selectedActivity.duration,
      });
    }
  };

  const calculatePricing = () => {
    const selectedActivity = config.activities.find(
      (a) => a.name === formData.activityName
    );
    if (!selectedActivity) return { basePrice: 0, convenienceFee: 0, gst: 0, total: 0 };

    let basePrice = selectedActivity.price;
    
    // Calculate accommodation pricing
    if (isAccommodation && formData.checkInDate && formData.checkOutDate) {
      const nights = Math.ceil(
        (new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24)
      );
      const rooms = formData.numberOfRooms || 1;
      basePrice = basePrice * nights * rooms;
    } else {
      // For activities, multiply by number of people
      basePrice = basePrice * (formData.numberOfPeople || 1);
    }

    const convenienceFee = 99;
    const gst = (basePrice + convenienceFee) * 0.18; // 18% GST
    const total = basePrice + convenienceFee + gst;

    return {
      basePrice: Math.round(basePrice),
      convenienceFee: Math.round(convenienceFee),
      gst: Math.round(gst),
      total: Math.round(total),
    };
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.activityName) {
        toast.error('Please select an activity');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.customerName || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return false;
      }
      if (isAccommodation) {
        if (!formData.checkInDate || !formData.checkOutDate) {
          toast.error('Please select check-in and check-out dates');
          return false;
        }
        if (new Date(formData.checkInDate) < new Date()) {
          toast.error('Check-in date cannot be in the past');
          return false;
        }
        if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
          toast.error('Check-out date must be after check-in date');
          return false;
        }
      } else {
        if (!formData.bookingDate) {
          toast.error('Please select a booking date');
          return false;
        }
        if (new Date(formData.bookingDate) < new Date()) {
          toast.error('Booking date cannot be in the past');
          return false;
        }
      }
    } else if (currentStep === 3) {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handlePayment = async () => {
    if (!validateStep(3)) return;

    setProcessingPayment(true);
    const pricing = calculatePricing();

    try {
      const bookingData = {
        activityType,
        placeDetails: {
          name: placeDetails.name || 'Activity Place',
          address: placeDetails.vicinity || placeDetails.formatted_address || 'N/A',
          contact: placeDetails.formatted_phone_number || '',
          placeId: placeDetails.place_id || '',
        },
        customerDetails: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          age: formData.age ? parseInt(formData.age) : undefined,
          nationality: formData.nationality,
        },
        bookingDetails: {
          activityName: formData.activityName,
          bookingDate: formData.bookingDate || formData.checkInDate,
          bookingTime: formData.bookingTime,
          numberOfPeople: parseInt(formData.numberOfPeople),
          duration: formData.duration,
          checkInDate: formData.checkInDate || undefined,
          checkOutDate: formData.checkOutDate || undefined,
          roomType: formData.roomType,
          numberOfRooms: parseInt(formData.numberOfRooms),
          departureTime: formData.departureTime,
          returnTime: formData.returnTime,
          tourLanguage: formData.tourLanguage,
          meetingPoint: formData.meetingPoint,
          specialRequests: formData.specialRequests,
        },
        pricing,
        payment: {
          method: paymentMethod,
        },
      };

      const response = await bookingAPI.createActivityBooking(bookingData);

      if (response.data.success) {
        setBookingConfirmation(response.data.booking);
        setStep(4);
        toast.success('Booking confirmed! Check your email for details.');
      } else {
        toast.error('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      age: '',
      nationality: 'Indian',
      activityName: '',
      bookingDate: '',
      bookingTime: '09:00',
      numberOfPeople: 1,
      duration: 'Full day',
      checkInDate: '',
      checkOutDate: '',
      roomType: 'standard',
      numberOfRooms: 1,
      departureTime: '',
      returnTime: '',
      tourLanguage: 'English',
      meetingPoint: '',
      specialRequests: '',
    });
    setStep(1);
    setPaymentMethod('');
    setBookingConfirmation(null);
    onClose();
  };

  if (!isOpen) return null;

  const pricing = calculatePricing();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.color} p-6 text-white relative`}>
            <button
              onClick={resetForm}
              className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="text-5xl">{config.icon}</div>
              <div>
                <h2 className="text-3xl font-bold">Book {config.title}</h2>
                <p className="text-white/90 mt-1">{placeDetails.name || 'Activity Booking'}</p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex gap-2 mt-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Activity Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Select Your Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.activities.map((activity) => (
                    <motion.button
                      key={activity.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActivitySelect(activity.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.activityName === activity.name
                          ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20`
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {activity.name}
                        </h4>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          ₹{activity.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {activity.description}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Duration: {activity.duration}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Details (content continues...) */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Booking Details
                </h3>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaUser className="inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaEnvelope className="inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaPhone className="inline mr-2" />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Age"
                      min="1"
                      max="120"
                    />
                  </div>
                </div>

                {/* Booking Date/Time Details */}
                {isAccommodation ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <FaCalendar className="inline mr-2" />
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <FaCalendar className="inline mr-2" />
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        name="checkOutDate"
                        value={formData.checkOutDate}
                        onChange={handleChange}
                        min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <FaBed className="inline mr-2" />
                        Number of Rooms
                      </label>
                      <input
                        type="number"
                        name="numberOfRooms"
                        value={formData.numberOfRooms}
                        onChange={handleChange}
                        min="1"
                        max="10"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <FaCalendar className="inline mr-2" />
                        Booking Date *
                      </label>
                      <input
                        type="date"
                        name="bookingDate"
                        value={formData.bookingDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        name="bookingTime"
                        value={formData.bookingTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Number of People
                      </label>
                      <input
                        type="number"
                        name="numberOfPeople"
                        value={formData.numberOfPeople}
                        onChange={handleChange}
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Any special requirements?"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h3>

                {/* Pricing Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-2xl">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    Pricing Summary
                  </h4>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>₹{pricing.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Convenience Fee:</span>
                      <span>₹{pricing.convenienceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>₹{pricing.gst.toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-white">
                        <span>Total:</span>
                        <span>₹{pricing.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'card', name: 'Credit/Debit Card', icon: FaCreditCard },
                    { id: 'upi', name: 'UPI', icon: FaMobileAlt },
                    { id: 'netbanking', name: 'Net Banking', icon: FaUniversity },
                    { id: 'wallet', name: 'Wallet', icon: FaWallet },
                  ].map((method) => (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <method.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {method.name}
                      </span>
                      {paymentMethod === method.id && (
                        <FaCheckCircle className="ml-auto h-5 w-5 text-green-500" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> This is a demo payment gateway. No actual payment will be processed.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && bookingConfirmation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <FaCheckCircle className="h-10 w-10 text-green-500" />
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Booking Confirmed! 🎉
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your booking has been successfully confirmed
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-2xl">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Booking Reference:
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {bookingConfirmation.bookingReference}
                    </span>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Activity:</span>
                      <span className="font-semibold">{bookingConfirmation.bookingDetails.activityName}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>People:</span>
                      <span className="font-semibold">{bookingConfirmation.bookingDetails.numberOfPeople}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Total Paid:</span>
                      <span className="font-semibold text-green-600">
                        ₹{bookingConfirmation.pricing.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded text-left">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📧 Confirmation email with voucher and receipt has been sent to{' '}
                    <strong>{bookingConfirmation.customerDetails.email}</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-4 justify-between">
              {step > 1 && step < 4 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FaArrowLeft />
                  Back
                </button>
              )}

              {step < 3 && (
                <button
                  onClick={handleNext}
                  className={`${
                    step === 1 ? 'w-full' : 'ml-auto'
                  } px-8 py-3 rounded-xl bg-gradient-to-r ${config.color} text-white font-bold hover:shadow-lg transition-all`}
                >
                  Continue
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingPayment ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Pay ₹{pricing.total.toLocaleString()}
                    </>
                  )}
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={resetForm}
                  className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivityBookingModal;
