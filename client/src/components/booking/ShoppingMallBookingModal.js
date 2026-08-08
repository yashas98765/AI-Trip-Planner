import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaShoppingBag,
  FaCalendar,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaEnvelope,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaCheckCircle,
  FaArrowLeft,
  FaFileInvoice,
  FaReceipt,
  FaCar,
  FaShoppingCart,
  FaStore,
} from 'react-icons/fa';
import api from '../../services/api';

const ShoppingMallBookingModal = ({ isOpen, onClose, mallDetails = {} }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    visitDate: '',
    visitTime: 'morning', // morning, afternoon, evening
    serviceType: '', // shopping_assistance, parking, personal_shopper, vip_experience
    numberOfPeople: 1,
    parkingRequired: false,
    parkingDuration: 2, // hours
    vehicleType: 'car', // car, bike, suv
    specialRequests: '',
    storePreferences: [],
  });

  // Service types with pricing
  const serviceTypes = [
    {
      id: 'shopping_assistance',
      name: 'Shopping Assistance',
      description: 'Personal guide to help you navigate the mall',
      price: 299,
      duration: '2 hours',
      features: ['Expert Guide', 'Store Recommendations', 'Discount Coupons'],
      icon: '🛍️',
    },
    {
      id: 'personal_shopper',
      name: 'Personal Shopper',
      description: 'Professional styling and shopping assistance',
      price: 999,
      duration: '3 hours',
      features: ['Style Expert', 'Personal Fitting', 'Premium Brands Access'],
      icon: '👔',
    },
    {
      id: 'vip_experience',
      name: 'VIP Experience',
      description: 'Luxury shopping with exclusive perks',
      price: 2499,
      duration: '4 hours',
      features: ['Dedicated Concierge', 'Priority Access', 'Complimentary Refreshments', 'Valet Parking'],
      icon: '⭐',
    },
    {
      id: 'gift_wrapping',
      name: 'Gift Wrapping Service',
      description: 'Professional gift wrapping for your purchases',
      price: 149,
      duration: '30 minutes',
      features: ['Premium Materials', 'Custom Designs', 'Greeting Cards'],
      icon: '🎁',
    },
    {
      id: 'locker_service',
      name: 'Locker & Baggage Storage',
      description: 'Secure storage for your belongings',
      price: 99,
      duration: 'Full day',
      features: ['Secure Lockers', '24/7 Monitoring', 'Easy Access'],
      icon: '🔒',
    },
    {
      id: 'kids_play_area',
      name: 'Kids Play Area Access',
      description: 'Supervised play area for children',
      price: 199,
      duration: '2 hours',
      features: ['Trained Supervisors', 'Safe Environment', 'Fun Activities'],
      icon: '🎮',
    },
    {
      id: 'food_court_voucher',
      name: 'Food Court Voucher',
      description: 'Pre-loaded dining voucher for food court',
      price: 500,
      duration: 'Full day',
      features: ['Multiple Cuisines', 'No Expiry', 'Family Friendly'],
      icon: '🍔',
    },
    {
      id: 'entertainment_zone',
      name: 'Entertainment Zone Pass',
      description: 'Access to gaming and entertainment area',
      price: 399,
      duration: '3 hours',
      features: ['Gaming Arcade', 'VR Experiences', 'Movie Theatre Discount'],
      icon: '🎯',
    },
    {
      id: 'senior_assistance',
      name: 'Senior Citizen Assistance',
      description: 'Dedicated support for senior shoppers',
      price: 199,
      duration: '2 hours',
      features: ['Wheelchair Availability', 'Priority Service', 'Rest Area Access'],
      icon: '👴',
    },
    {
      id: 'group_tour',
      name: 'Group Shopping Tour',
      description: 'Guided tour for groups (5-10 people)',
      price: 1499,
      duration: '3 hours',
      features: ['Professional Guide', 'Group Discounts', 'Customized Itinerary'],
      icon: '👥',
    },
    {
      id: 'parking',
      name: 'Parking Reservation',
      description: 'Pre-book your parking spot',
      price: 100,
      duration: 'Per 2 hours',
      features: ['Reserved Spot', 'Covered Parking', 'CCTV Security'],
      icon: '🚗',
    },
  ];

  // Store categories
  const storeCategories = [
    { id: 'fashion', name: 'Fashion & Apparel', icon: '👗' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'food', name: 'Food Court', icon: '🍔' },
    { id: 'beauty', name: 'Beauty & Cosmetics', icon: '💄' },
    { id: 'home', name: 'Home & Living', icon: '🏠' },
    { id: 'sports', name: 'Sports & Fitness', icon: '⚽' },
    { id: 'kids', name: 'Kids & Toys', icon: '🧸' },
    { id: 'books', name: 'Books & Stationery', icon: '📚' },
  ];

  // Payment methods
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <FaCreditCard className="h-6 w-6" />,
      description: 'Visa, Mastercard, Rupay',
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: <FaMobileAlt className="h-6 w-6" />,
      description: 'Google Pay, PhonePe, Paytm',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <FaUniversity className="h-6 w-6" />,
      description: 'All major banks',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: <FaWallet className="h-6 w-6" />,
      description: 'Paytm, Amazon Pay, etc.',
    },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleServiceSelect = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceType: serviceId,
    }));
  };

  const handleStoreToggle = (storeId) => {
    setFormData((prev) => ({
      ...prev,
      storePreferences: prev.storePreferences.includes(storeId)
        ? prev.storePreferences.filter((id) => id !== storeId)
        : [...prev.storePreferences, storeId],
    }));
  };

  const calculateTotal = () => {
    if (!formData.serviceType) return 0;
    
    const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);
    if (!selectedService) return 0;

    let basePrice = selectedService.price * formData.numberOfPeople;
    let parkingCharges = 0;
    
    if (formData.parkingRequired) {
      const parkingRate = formData.vehicleType === 'bike' ? 20 : formData.vehicleType === 'suv' ? 150 : 100;
      parkingCharges = Math.ceil(formData.parkingDuration / 2) * parkingRate;
    }

    const convenienceFee = 49;
    const gst = (basePrice + parkingCharges + convenienceFee) * 0.18; // 18% GST

    return {
      basePrice,
      parkingCharges,
      convenienceFee,
      gst: Math.round(gst),
      total: Math.round(basePrice + parkingCharges + convenienceFee + gst),
    };
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.serviceType) {
        toast.error('Please select a service type');
        return false;
      }
      if (formData.numberOfPeople < 1) {
        toast.error('Number of people must be at least 1');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.customerName.trim()) {
        toast.error('Please enter your name');
        return false;
      }
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return false;
      }
      if (!formData.visitDate) {
        toast.error('Please select a visit date');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handlePayment = async () => {
    if (!validateStep()) return;

    setProcessingPayment(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const bookingData = {
        mallDetails: {
          name: mallDetails.name || 'Shopping Mall',
          address: mallDetails.vicinity || mallDetails.address || '',
          contact: mallDetails.phone || '',
        },
        customerDetails: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
        },
        bookingDetails: {
          serviceType: formData.serviceType,
          serviceName: serviceTypes.find((s) => s.id === formData.serviceType)?.name || '',
          visitDate: formData.visitDate,
          visitTime: formData.visitTime,
          numberOfPeople: formData.numberOfPeople,
          parkingRequired: formData.parkingRequired,
          parkingDuration: formData.parkingDuration,
          vehicleType: formData.vehicleType,
          storePreferences: formData.storePreferences,
          specialRequests: formData.specialRequests,
        },
        pricing: calculateTotal(),
        payment: {
          method: paymentMethod,
          status: 'completed',
          transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        },
      };

      const response = await api.post('/shopping-mall/book', bookingData);
      
      if (response.data.success) {
        setBookingConfirmation(response.data.booking);
        toast.success('Booking confirmed successfully!');
        setStep(4);
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || error.message || 'Booking failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await api.get(
        `/shopping-mall/invoice/${bookingConfirmation._id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingConfirmation.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await api.get(
        `/shopping-mall/receipt/${bookingConfirmation._id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${bookingConfirmation.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentMethod('');
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      visitDate: '',
      visitTime: 'morning',
      serviceType: '',
      numberOfPeople: 1,
      parkingRequired: false,
      parkingDuration: 2,
      vehicleType: 'car',
      specialRequests: '',
      storePreferences: [],
    });
    setBookingConfirmation(null);
    onClose();
  };

  if (!isOpen) return null;

  const pricing = calculateTotal();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 relative flex-shrink-0">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <FaTimes className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Book Shopping Experience</h2>
                <p className="text-white/90 text-sm">
                  {mallDetails.name || 'Shopping Mall'} - Premium Services
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {step > s ? <FaCheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-12 h-1 transition-all ${
                        step > s ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Select Service
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceTypes.map((service) => (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          formData.serviceType === service.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {formData.serviceType === service.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{service.icon}</div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                              {service.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {service.description}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                                ₹{service.price}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {service.duration}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {service.features.map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of People
                    </label>
                    <input
                      type="number"
                      name="numberOfPeople"
                      min="1"
                      max="10"
                      value={formData.numberOfPeople}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                      <input
                        type="checkbox"
                        name="parkingRequired"
                        checked={formData.parkingRequired}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Parking Required</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Reserve a parking spot</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.parkingRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vehicle Type
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="bike">Two Wheeler (₹20/2hrs)</option>
                        <option value="car">Car (₹100/2hrs)</option>
                        <option value="suv">SUV (₹150/2hrs)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        name="parkingDuration"
                        min="1"
                        max="12"
                        value={formData.parkingDuration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Store Preferences */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Store Preferences (Optional)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {storeCategories.map((category) => (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStoreToggle(category.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.storePreferences.includes(category.id)
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Customer Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaUser className="inline h-4 w-4 mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaEnvelope className="inline h-4 w-4 mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaPhone className="inline h-4 w-4 mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendar className="inline h-4 w-4 mr-2" />
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'morning', label: 'Morning', time: '9 AM - 12 PM' },
                      { value: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM' },
                      { value: 'evening', label: 'Evening', time: '5 PM - 9 PM' },
                    ].map((slot) => (
                      <motion.button
                        key={slot.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, visitTime: slot.value }))
                        }
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.visitTime === slot.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {slot.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {slot.time}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="Any special requirements or preferences..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-2xl">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                    Booking Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {serviceTypes.find((s) => s.id === formData.serviceType)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">People</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.numberOfPeople}
                      </span>
                    </div>
                    {formData.parkingRequired && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Parking</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formData.vehicleType.toUpperCase()} - {formData.parkingDuration}hrs
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between text-base font-bold">
                        <span className="text-gray-900 dark:text-white">Total Amount</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          ₹{pricing.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Choose Payment Method
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            paymentMethod === method.id
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {method.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </div>
                        </div>
                        {paymentMethod === method.id && (
                          <FaCheckCircle className="h-6 w-6 text-purple-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                    Payment Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Service Charges</span>
                      <span>₹{pricing.basePrice}</span>
                    </div>
                    {formData.parkingRequired && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Parking Charges</span>
                        <span>₹{pricing.parkingCharges}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Convenience Fee</span>
                      <span>₹{pricing.convenienceFee}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>GST (18%)</span>
                      <span>₹{pricing.gst}</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-gray-900 dark:text-white">Total Amount</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          ₹{pricing.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <FaCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Your payment information is encrypted and secure. This is a dummy
                      payment gateway for demonstration purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && bookingConfirmation && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-block p-6 bg-green-100 dark:bg-green-900/30 rounded-full"
                >
                  <FaCheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Booking Confirmed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your booking has been successfully confirmed. A confirmation email with all
                    details has been sent to {formData.email}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-left">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Booking Reference</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {bookingConfirmation.bookingReference}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Transaction ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bookingConfirmation.payment.transactionId}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Visit Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(formData.visitDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                        ₹{bookingConfirmation.pricing.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadInvoice}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFileInvoice className="h-5 w-5" />
                    Download Invoice
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadReceipt}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FaReceipt className="h-5 w-5" />
                    Download Receipt
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {step < 4 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <FaArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={step === 3 ? handlePayment : handleNext}
                  disabled={processingPayment}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment
                    ? 'Processing...'
                    : step === 3
                    ? `Pay ₹${pricing.total}`
                    : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShoppingMallBookingModal;
