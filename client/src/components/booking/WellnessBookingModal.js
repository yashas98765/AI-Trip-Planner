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
  FaSpa,
  FaClock,
} from 'react-icons/fa';
import api from '../../services/api';

const WellnessBookingModal = ({ isOpen, onClose, centerDetails = {} }) => {
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    age: '',
    gender: 'other',
    appointmentDate: '',
    appointmentTime: '10:00',
    serviceType: '',
    serviceName: '',
    duration: '60 minutes',
    numberOfPeople: 1,
    therapist: 'any',
    specialRequests: '',
  });

  // Wellness service types with pricing
  const serviceTypes = [
    {
      id: 'massage',
      name: 'Massage Therapy',
      description: 'Relaxing full-body massage treatments',
      basePrice: 1500,
      features: ['Stress Relief', 'Muscle Relaxation', 'Improved Circulation'],
      icon: '💆',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'facial',
      name: 'Facial Treatment',
      description: 'Deep cleansing and rejuvenating facials',
      basePrice: 1200,
      features: ['Skin Cleansing', 'Anti-aging', 'Hydration'],
      icon: '✨',
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'body_spa',
      name: 'Body Spa',
      description: 'Complete body spa and scrub treatments',
      basePrice: 2000,
      features: ['Exfoliation', 'Detox', 'Skin Nourishment'],
      icon: '🧖',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'aromatherapy',
      name: 'Aromatherapy',
      description: 'Essential oil therapy for relaxation',
      basePrice: 1800,
      features: ['Stress Relief', 'Mood Enhancement', 'Holistic Healing'],
      icon: '🌸',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'yoga_session',
      name: 'Yoga Session',
      description: 'Professional yoga classes and sessions',
      basePrice: 800,
      features: ['Flexibility', 'Mind-Body Balance', 'Strength'],
      icon: '🧘',
      color: 'from-green-500 to-teal-500',
    },
    {
      id: 'meditation',
      name: 'Meditation',
      description: 'Guided meditation for peace and clarity',
      basePrice: 600,
      features: ['Mental Clarity', 'Stress Reduction', 'Inner Peace'],
      icon: '🕉️',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'sauna',
      name: 'Sauna Session',
      description: 'Steam and dry sauna treatments',
      basePrice: 700,
      features: ['Detoxification', 'Muscle Relaxation', 'Better Circulation'],
      icon: '♨️',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'jacuzzi',
      name: 'Jacuzzi Bath',
      description: 'Luxury jacuzzi and hydrotherapy',
      basePrice: 1000,
      features: ['Hydrotherapy', 'Muscle Relief', 'Relaxation'],
      icon: '🛁',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'manicure_pedicure',
      name: 'Manicure & Pedicure',
      description: 'Hand and feet care treatments',
      basePrice: 900,
      features: ['Nail Care', 'Skin Softening', 'Polish'],
      icon: '💅',
      color: 'from-pink-500 to-purple-500',
    },
    {
      id: 'hair_treatment',
      name: 'Hair Treatment',
      description: 'Nourishing hair spa and treatments',
      basePrice: 1100,
      features: ['Hair Strengthening', 'Scalp Massage', 'Deep Conditioning'],
      icon: '💇',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'couple_spa',
      name: 'Couple Spa',
      description: 'Romantic spa experience for two',
      basePrice: 3500,
      features: ['Private Room', 'Dual Treatment', 'Complimentary Refreshments'],
      icon: '💑',
      color: 'from-rose-500 to-pink-500',
    },
    {
      id: 'wellness_package',
      name: 'Wellness Package',
      description: 'Complete wellness day package',
      basePrice: 5000,
      features: ['Multiple Treatments', 'Lunch Included', 'Full Day Access'],
      icon: '🎁',
      color: 'from-purple-600 to-pink-600',
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleServiceSelect = (serviceId) => {
    const selectedService = serviceTypes.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      serviceType: serviceId,
      serviceName: selectedService.name,
    });
  };

  const calculatePricing = () => {
    const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);
    if (!selectedService) return { servicePrice: 0, convenienceFee: 0, gst: 0, total: 0 };

    const servicePrice = selectedService.basePrice * formData.numberOfPeople;
    const convenienceFee = 50 * formData.numberOfPeople;
    const gst = (servicePrice + convenienceFee) * 0.18; // 18% GST
    const total = servicePrice + convenienceFee + gst;

    return {
      servicePrice: Math.round(servicePrice),
      convenienceFee: Math.round(convenienceFee),
      gst: Math.round(gst),
      total: Math.round(total),
    };
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.serviceType) {
        toast.error('Please select a service type');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.customerName || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return false;
      }
      if (!formData.appointmentDate || !formData.appointmentTime) {
        toast.error('Please select appointment date and time');
        return false;
      }
      if (new Date(formData.appointmentDate) < new Date()) {
        toast.error('Appointment date cannot be in the past');
        return false;
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
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pricing = calculatePricing();
      const bookingData = {
        centerDetails: {
          name: centerDetails.name || 'Wellness Center',
          address: centerDetails.vicinity || centerDetails.address || 'N/A',
          contact: centerDetails.phone || 'N/A',
        },
        customerDetails: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          gender: formData.gender,
        },
        serviceDetails: {
          serviceType: formData.serviceType,
          serviceName: formData.serviceName,
          duration: formData.duration,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          numberOfPeople: parseInt(formData.numberOfPeople),
          therapist: formData.therapist,
          specialRequests: formData.specialRequests,
        },
        pricing,
        payment: {
          method: paymentMethod,
          status: 'pending',
        },
      };

      const response = await api.post('/wellness', bookingData);
      
      if (response.data.success) {
        setBookingConfirmation(response.data.booking);
        setStep(4);
        toast.success('Wellness appointment booked successfully! 🧘');
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Error booking wellness appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentMethod('');
    setBookingConfirmation(null);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      age: '',
      gender: 'other',
      appointmentDate: '',
      appointmentTime: '10:00',
      serviceType: '',
      serviceName: '',
      duration: '60 minutes',
      numberOfPeople: 1,
      therapist: 'any',
      specialRequests: '',
    });
    onClose();
  };

  const pricing = calculatePricing();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FaSpa /> Book Wellness Appointment
                  </h2>
                  <p className="text-purple-100 mt-1">{centerDetails.name || 'Wellness Center'}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mt-6 space-x-4">
                {['Service', 'Details', 'Payment', 'Confirm'].map((label, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step > index + 1
                          ? 'bg-green-500 text-white'
                          : step === index + 1
                          ? 'bg-white text-purple-600'
                          : 'bg-purple-400 text-white'
                      }`}
                    >
                      {step > index + 1 ? <FaCheckCircle /> : index + 1}
                    </div>
                    {index < 3 && (
                      <div className={`w-12 h-1 ${step > index + 1 ? 'bg-green-500' : 'bg-purple-400'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <AnimatePresence mode="wait">
                {/* Step 1: Service Selection */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Select Wellness Service
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <motion.div
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleServiceSelect(service.id)}
                          className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                            formData.serviceType === service.id
                              ? `border-purple-600 bg-gradient-to-br ${service.color} text-white shadow-lg`
                              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{service.icon}</div>
                            <div className="flex-1">
                              <h4 className={`font-bold text-lg ${formData.serviceType === service.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {service.name}
                              </h4>
                              <p className={`text-sm mt-1 ${formData.serviceType === service.id ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                {service.description}
                              </p>
                              <div className="mt-3 space-y-1">
                                {service.features.map((feature, idx) => (
                                  <p key={idx} className={`text-xs ${formData.serviceType === service.id ? 'text-white/80' : 'text-gray-500'}`}>
                                    ✓ {feature}
                                  </p>
                                ))}
                              </div>
                              <p className={`mt-3 text-lg font-bold ${formData.serviceType === service.id ? 'text-white' : 'text-purple-600'}`}>
                                Starting from ₹{service.basePrice}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Appointment Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Appointment & Personal Details
                    </h3>

                    {/* Personal Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FaUser className="inline mr-2" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FaEnvelope className="inline mr-2" />
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FaPhone className="inline mr-2" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Your age"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Prefer not to say</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Appointment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FaCalendar className="inline mr-2" />
                            Appointment Date *
                          </label>
                          <input
                            type="date"
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <FaClock className="inline mr-2" />
                            Appointment Time *
                          </label>
                          <input
                            type="time"
                            name="appointmentTime"
                            value={formData.appointmentTime}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Duration
                          </label>
                          <select
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="30 minutes">30 minutes</option>
                            <option value="60 minutes">60 minutes</option>
                            <option value="90 minutes">90 minutes</option>
                            <option value="2 hours">2 hours</option>
                            <option value="3 hours">3 hours</option>
                            <option value="Full day">Full day</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Number of People *
                          </label>
                          <input
                            type="number"
                            name="numberOfPeople"
                            value={formData.numberOfPeople}
                            onChange={handleChange}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Therapist Preference
                          </label>
                          <select
                            name="therapist"
                            value={formData.therapist}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="any">Any</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Special Requests
                          </label>
                          <textarea
                            name="specialRequests"
                            value={formData.specialRequests}
                            onChange={handleChange}
                            placeholder="Any special requirements or allergies..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Payment Method
                    </h3>

                    {/* Booking Summary */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Booking Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Service:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formData.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Center:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{centerDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(formData.appointmentDate).toLocaleDateString()} at {formData.appointmentTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formData.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Number of People:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formData.numberOfPeople}</span>
                        </div>
                      </div>

                      <div className="border-t border-purple-200 dark:border-purple-700 mt-4 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Service Price:</span>
                          <span className="text-gray-900 dark:text-white">₹{pricing.servicePrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Convenience Fee:</span>
                          <span className="text-gray-900 dark:text-white">₹{pricing.convenienceFee}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">GST (18%):</span>
                          <span className="text-gray-900 dark:text-white">₹{pricing.gst}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-200 dark:border-purple-700">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-purple-600 dark:text-purple-400">₹{pricing.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Select Payment Method</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'card', name: 'Credit/Debit Card', icon: FaCreditCard, color: 'blue' },
                          { id: 'upi', name: 'UPI', icon: FaMobileAlt, color: 'green' },
                          { id: 'netbanking', name: 'Net Banking', icon: FaUniversity, color: 'indigo' },
                          { id: 'wallet', name: 'Wallet', icon: FaWallet, color: 'purple' },
                        ].map((method) => (
                          <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                              paymentMethod === method.id
                                ? `border-${method.color}-600 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                            }`}
                          >
                            <method.icon
                              className={`text-2xl ${
                                paymentMethod === method.id ? `text-${method.color}-600` : 'text-gray-400'
                              }`}
                            />
                            <span className={`text-sm font-medium ${paymentMethod === method.id ? `text-${method.color}-700 dark:text-${method.color}-400` : 'text-gray-600 dark:text-gray-400'}`}>
                              {method.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && bookingConfirmation && (
                  <motion.div
                    key="step4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Appointment Confirmed! 🧘
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Your wellness appointment has been booked successfully
                    </p>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Booking Reference</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                        {bookingConfirmation.bookingReference}
                      </p>
                      <div className="space-y-2 text-sm text-left">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Service:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {bookingConfirmation.serviceDetails.serviceName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">People:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {bookingConfirmation.serviceDetails.numberOfPeople}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            ₹{bookingConfirmation.pricing.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <FaSpa className="inline mr-2" />
                        Appointment voucher and receipt have been sent to {bookingConfirmation.customerDetails.email}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Please check your email for appointment details. Arrive 15 minutes early for check-in.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            {step < 4 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                {step > 1 ? (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaArrowLeft /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={step === 1 && !formData.serviceType}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handlePayment}
                    disabled={processingPayment || !paymentMethod}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <FaCreditCard className="animate-pulse" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCreditCard />
                        Pay ₹{pricing.total}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WellnessBookingModal;
